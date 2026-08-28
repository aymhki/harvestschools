<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../authHelpers.php';
require_once __DIR__ . '/eventBookingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

function event_booking_id_placeholders(array $ids) {
    return implode(',', array_fill(0, count($ids), '?'));
}


function event_booking_delete_where_in($conn, $sql, array $ids) {
    $stmt = $conn->prepare($sql);
    $stmt->bind_param(str_repeat('i', count($ids)), ...$ids);
    $stmt->execute();
    $stmt->close();
}


function event_booking_collect_linked_ids($conn, $table, $column, array $bookingIds) {
    $stmt = $conn->prepare(
        "SELECT DISTINCT " . $column . " FROM " . $table
        . " WHERE booking_id IN (" . event_booking_id_placeholders($bookingIds) . ")"
    );
    $stmt->bind_param(str_repeat('i', count($bookingIds)), ...$bookingIds);
    $stmt->execute();
    $result = $stmt->get_result();
    $ids = [];

    while ($row = $result->fetch_assoc()) {
        $ids[] = (int)$row[$column];
    }

    $stmt->close();

    return $ids;
}


try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => "Invalid request method. Use POST.", 'code' => 405]);
        exit;
    }

    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
    $scope = trim((string)($data['scope'] ?? ''));
    $division = trim((string)($data['division'] ?? ''));

    if ($scope !== 'all' && $scope !== 'division') {
        echo json_encode(['success' => false, 'message' => "Choose whether to delete every booking or one school division.", 'code' => 400]);
        exit;
    }

    if ($scope === 'division' && !in_array($division, EVENT_BOOKING_DIVISIONS, true)) {
        echo json_encode(['success' => false, 'message' => "That is not a school division.", 'code' => 400]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $EVENT_BOOKING_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $EVENT_BOOKING_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    if ($scope === 'all') {
        $stmt = $conn->prepare("SELECT booking_id, auth_id FROM event_bookings");
    } else {
        $stmt = $conn->prepare(
            "SELECT b.booking_id, b.auth_id
             FROM event_bookings b
             WHERE EXISTS (
                     SELECT 1 FROM event_booking_students_linker sl
                     JOIN event_booking_students s ON s.student_id = sl.student_id
                     WHERE sl.booking_id = b.booking_id AND s.school_division = ?
                   )
               AND NOT EXISTS (
                     SELECT 1 FROM event_booking_students_linker sl2
                     JOIN event_booking_students s2 ON s2.student_id = sl2.student_id
                     WHERE sl2.booking_id = b.booking_id AND s2.school_division <> ?
                   )"
        );
        $stmt->bind_param("ss", $division, $division);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $bookingIds = [];
    $authIds = [];

    while ($row = $result->fetch_assoc()) {
        $bookingIds[] = (int)$row['booking_id'];
        $authIds[] = (int)$row['auth_id'];
    }

    $stmt->close();

    if ($bookingIds === []) {
        echo json_encode([
            'success' => true,
            'message' => $scope === 'all'
                ? "There are no bookings to delete."
                : "No booking has all of its students in " . $division . ".",
            'code'    => 200,
            'deleted' => 0
        ]);
        exit;
    }

    $studentIds = event_booking_collect_linked_ids($conn, 'event_booking_students_linker', 'student_id', $bookingIds);
    $parentIds = event_booking_collect_linked_ids($conn, 'event_booking_parents_linker', 'parent_id', $bookingIds);
    $bookingPlaceholders = event_booking_id_placeholders($bookingIds);

    $conn->begin_transaction();

    try {
        event_booking_delete_where_in(
            $conn,
            "DELETE FROM event_booking_sessions WHERE auth_id IN (" . event_booking_id_placeholders($authIds) . ")",
            $authIds
        );

        event_booking_delete_where_in($conn, "DELETE FROM event_booking_students_linker WHERE booking_id IN ($bookingPlaceholders)", $bookingIds);

        if ($studentIds !== []) {
            event_booking_delete_where_in(
                $conn,
                "DELETE FROM event_booking_students WHERE student_id IN (" . event_booking_id_placeholders($studentIds) . ")",
                $studentIds
            );
        }

        event_booking_delete_where_in($conn, "DELETE FROM event_booking_parents_linker WHERE booking_id IN ($bookingPlaceholders)", $bookingIds);

        if ($parentIds !== []) {
            event_booking_delete_where_in(
                $conn,
                "DELETE FROM event_booking_parents WHERE parent_id IN (" . event_booking_id_placeholders($parentIds) . ")",
                $parentIds
            );
        }

        event_booking_delete_where_in($conn, "DELETE FROM event_booking_extras WHERE booking_id IN ($bookingPlaceholders)", $bookingIds);
        event_booking_delete_where_in($conn, "DELETE FROM event_bookings WHERE booking_id IN ($bookingPlaceholders)", $bookingIds);
        event_booking_delete_where_in(
            $conn,
            "DELETE FROM event_booking_auth_credentials WHERE auth_id IN (" . event_booking_id_placeholders($authIds) . ")",
            $authIds
        );

        $conn->commit();
    } catch (Throwable $deleteError) {
        $conn->rollback();

        echo json_encode(['success' => false, 'message' => "Nothing was deleted: " . $deleteError->getMessage(), 'code' => 500]);
        exit;
    }

    admin_log_action($conn, ($scope === 'all' ? 'Deleted all ' : 'Deleted ') . count($bookingIds) . ' event booking' . (count($bookingIds) === 1 ? '' : 's') . ($scope === 'all' ? '' : ' in the "' . $division . '" division') . ' — booking ids: ' . admin_list_summary(array_map('strval', $bookingIds)) . '; also removed ' . count($studentIds) . ' student' . (count($studentIds) === 1 ? '' : 's') . ' and ' . count($parentIds) . ' parent' . (count($parentIds) === 1 ? '' : 's') . '.');
    echo json_encode([
        'success' => true,
        'message' => count($bookingIds) . ' booking' . (count($bookingIds) === 1 ? '' : 's')
            . ' deleted with ' . count($studentIds) . ' student' . (count($studentIds) === 1 ? '' : 's')
            . ' and ' . count($parentIds) . ' parent' . (count($parentIds) === 1 ? '' : 's') . '.',
        'code'    => 200,
        'deleted' => count($bookingIds)
    ]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'code' => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
