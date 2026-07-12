<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../authHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            'success' => false,
            'message' => "Invalid request method. Use POST.",
            'code' => 405
        ]);
        exit;
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    if (!isset($data['bookingId'])) {
        echo json_encode([
            'success' => false,
            'message' => "Missing required parameter: bookingId",
            'code' => 400
        ]);
        exit;
    }

    global $GRADUATION_BOOKING_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $GRADUATION_BOOKING_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }


    $bookingId = (int)$data['bookingId'];
    $bookingCheckSql = "SELECT booking_id, auth_id FROM graduation_bookings WHERE booking_id = ?";
    $stmt = $conn->prepare($bookingCheckSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => "Booking not found",
            'code' => 404
        ]);
        exit;
    }

    $bookingData = $result->fetch_assoc();
    $authId = $bookingData['auth_id'];
    $stmt->close();

    $parentSql = "SELECT parent_id FROM graduation_booking_parents_linker WHERE booking_id = ?";
    $stmt = $conn->prepare($parentSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $parentResult = $stmt->get_result();
    $parentIds = [];

    while ($parentRow = $parentResult->fetch_assoc()) {
        $parentIds[] = $parentRow['parent_id'];
    }

    $stmt->close();
    $studentSql = "SELECT student_id FROM graduation_booking_students_linker WHERE booking_id = ?";
    $stmt = $conn->prepare($studentSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $studentResult = $stmt->get_result();
    $studentIds = [];

    while ($studentRow = $studentResult->fetch_assoc()) {
        $studentIds[] = $studentRow['student_id'];
    }

    $stmt->close();
    $conn->autocommit(false);
    $conn->begin_transaction();

    try {
        $stmt = $conn->prepare("DELETE FROM graduation_booking_sessions WHERE auth_id = ?");
        $stmt->bind_param("i", $authId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete booking session: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM graduation_booking_students_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete student linkers: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();

        foreach ($studentIds as $studentId) {
            $stmt = $conn->prepare("DELETE FROM graduation_booking_students WHERE student_id = ?");
            $stmt->bind_param("i", $studentId);

            if (!$stmt->execute()) {
                echo json_encode([
                    'success' => false,
                    'message' => "Failed to delete student: " . $stmt->error,
                    'code' => 500
                ]);
                exit;
            }

            $stmt->close();
        }

        $stmt = $conn->prepare("DELETE FROM graduation_booking_parents_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete parent linkers: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();

        foreach ($parentIds as $parentId) {
            $stmt = $conn->prepare("DELETE FROM graduation_booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $parentId);

            if (!$stmt->execute()) {
                echo json_encode([
                    'success' => false,
                    'message' => "Failed to delete parent: " . $stmt->error,
                    'code' => 500
                ]);
                exit;
            }

            $stmt->close();
        }

        $stmt = $conn->prepare("DELETE FROM graduation_booking_extras WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete extras: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM graduation_bookings WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete booking: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM graduation_booking_auth_credentials WHERE auth_id = ?");
        $stmt->bind_param("i", $authId);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete auth credentials: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => "Booking and all related data successfully deleted",
            'deleted_booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
        $conn->rollback();

        echo json_encode([
            'success' => false,
            'message' => "Transaction failed: " . $e->getMessage(),
            'code' => 500
        ]);
        exit;

    } finally {
        $conn->autocommit(true);
    }
} catch (Exception $e) {

    $statusCode = $e->getCode() ?: 500;
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $statusCode
    ]);

} finally {
    if ($conn) {
        $conn->close();
    }
}
?>