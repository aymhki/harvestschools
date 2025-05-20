<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];
try {
    if (!isset($_COOKIE['harvest_schools_admin_session_id'])) {
        echo json_encode([
            'success' => false,
            'message' => "Unauthorized: No session found",
            'code' => 401
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            'success' => false,
            'message' => "Invalid request method. Use POST.",
            'code' => 405
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['bookingId'])) {
        echo json_encode([
            'success' => false,
            'message' => "Missing required parameter: bookingId",
            'code' => 400
        ]);
        exit;
    }

    $bookingId = (int)$data['bookingId'];
    $sessionId = $_COOKIE['harvest_schools_admin_session_id'];
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            'success' => false,
            'message' => "Connection failed: " . $conn->connect_error,
            'code' => 500
        ]);
        exit;
    }

    $permissionSql = "SELECT u.permission_level
                      FROM admin_sessions s
                      JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                      WHERE s.id = ?";

    $stmt = $conn->prepare($permissionSql);

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => "Prepare failed: " . $conn->error,
            'code' => 500
        ]);
        exit;
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => "Invalid session",
            'code' => 401
        ]);
        exit;
    }

    $permissionRow = $permissionResult->fetch_assoc();
    $permissionLevels = explode(',', $permissionRow['permission_level']);

    $cleanPermissionLevels = array_map(function($level) {return intval(trim($level));}, $permissionLevels);
    $hasPermission = in_array(1, $cleanPermissionLevels);

    if (!$hasPermission) {
        echo json_encode([
            'success' => false,
            'message' => "Permission denied",
            'code' => 403
        ]);
        exit;
    }

    $bookingCheckSql = "SELECT booking_id, auth_id FROM bookings WHERE booking_id = ?";
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
    $bookingAuthSql = "SELECT username FROM booking_auth_credentials WHERE auth_id = ?";
    $stmt = $conn->prepare($bookingAuthSql);
    $stmt->bind_param("i", $authId);
    $stmt->execute();
    $authResult = $stmt->get_result();
    $authRow = $authResult->fetch_assoc();
    $bookingAuthUsername = $authRow['username'];
    $stmt->close();
    $parentSql = "SELECT parent_id FROM booking_parents_linker WHERE booking_id = ?";
    $stmt = $conn->prepare($parentSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $parentResult = $stmt->get_result();
    $parentIds = [];

    while ($parentRow = $parentResult->fetch_assoc()) {
        $parentIds[] = $parentRow['parent_id'];
    }

    $stmt->close();
    $studentSql = "SELECT student_id FROM booking_students_linker WHERE booking_id = ?";
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
        $stmt = $conn->prepare("DELETE FROM booking_sessions WHERE username = ?");
        $stmt->bind_param("s", $bookingAuthUsername);

        if (!$stmt->execute()) {
            echo json_encode([
                'success' => false,
                'message' => "Failed to delete booking session: " . $stmt->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->close();
        $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
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
            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
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

        $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
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
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
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

        $stmt = $conn->prepare("DELETE FROM booking_extras WHERE booking_id = ?");
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
        $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
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
        $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
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
    if (isset($conn)) {
        $conn->close();
    }
}
?>
