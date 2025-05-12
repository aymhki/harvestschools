<?php

header('Content-Type: application/json');
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
        throw new Exception("Unauthorized: No session found", 401);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method. Use POST.", 405);
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['studentId']) || !isset($data['bookingId'])) {
        throw new Exception("Missing required parameters: studentId and bookingId", 400);
    }

    $studentId = (int)$data['studentId'];
    $bookingId = (int)$data['bookingId'];

    $sessionId = $_COOKIE['harvest_schools_admin_session_id'];
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    $permissionSql = "SELECT u.permission_level
                      FROM admin_sessions s
                      JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                      WHERE s.id = ?";

    $stmt = $conn->prepare($permissionSql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows == 0) {
        throw new Exception("Invalid session", 401);
    }

    $permissionRow = $permissionResult->fetch_assoc();
    $permissionLevels = explode(',', $permissionRow['permission_level']);
    $cleanPermissionLevels = array_map(function($level) {
        return intval(trim($level));
    }, $permissionLevels);

    $hasPermission = in_array(1, $cleanPermissionLevels);

    if (!$hasPermission) {
        throw new Exception("Permission denied", 403);
    }

    $studentCheckSql = "SELECT s.student_id 
                        FROM booking_students s 
                        JOIN booking_students_linker sl ON s.student_id = sl.student_id 
                        WHERE s.student_id = ? AND sl.booking_id = ?";

    $stmt = $conn->prepare($studentCheckSql);
    $stmt->bind_param("ii", $studentId, $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Student not found or doesn't belong to specified booking", 404);
    }
    $stmt->close();

    $countSql = "SELECT COUNT(*) as student_count 
                 FROM booking_students_linker 
                 WHERE booking_id = ?";

    $stmt = $conn->prepare($countSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $isLastStudent = ($row['student_count'] <= 1);
    $stmt->close();

    $conn->autocommit(false);
    $conn->begin_transaction();

    try {
        if ($isLastStudent) {

            $stmt = $conn->prepare("SELECT parent_id FROM booking_parents_linker WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            $stmt->execute();
            $parentResult = $stmt->get_result();
            $parentIds = [];
            while ($parentRow = $parentResult->fetch_assoc()) {
                $parentIds[] = $parentRow['parent_id'];
            }
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete student linkers: " . $stmt->error);
            }
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
            $stmt->bind_param("i", $studentId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete student: " . $stmt->error);
            }
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete parent linkers: " . $stmt->error);
            }
            $stmt->close();

            foreach ($parentIds as $parentId) {
                $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
                $stmt->bind_param("i", $parentId);
                if (!$stmt->execute()) {
                    throw new Exception("Failed to delete parent: " . $stmt->error);
                }
                $stmt->close();
            }

            $stmt = $conn->prepare("DELETE FROM booking_extras WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete extras: " . $stmt->error);
            }
            $stmt->close();

            $stmt = $conn->prepare("SELECT auth_id FROM bookings WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $authId = $row['auth_id'];
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
            $stmt->bind_param("i", $bookingId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete booking: " . $stmt->error);
            }
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
            $stmt->bind_param("i", $authId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete auth credentials: " . $stmt->error);
            }
            $stmt->close();

            $message = "Booking and all related data successfully deleted";
        } else {

            $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE student_id = ? AND booking_id = ?");
            $stmt->bind_param("ii", $studentId, $bookingId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete student linker: " . $stmt->error);
            }
            $stmt->close();

            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
            $stmt->bind_param("i", $studentId);
            if (!$stmt->execute()) {
                throw new Exception("Failed to delete student: " . $stmt->error);
            }
            $stmt->close();

            $message = "Student successfully deleted";
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => $message,
            'deleted_entire_booking' => $isLastStudent
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    } finally {
        $conn->autocommit(true);
    }

} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $statusCode
    ]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>