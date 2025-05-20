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
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing session_id",
            "code" => 400
        ]);
        exit;
    }

    $sessionId = $data['session_id'];

    $startTime = microtime(true);
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

    $bookingsSql = "SELECT 
                b.booking_id,
                b.created_at AS booking_created,
                b.booking_date,
                b.booking_time,
                b.status,
                b.notes,
                ac.username,
                ac.password_hash,
                e.cd_count,
                e.additional_attendees,
                e.payment_status
            FROM bookings b
            JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
            LEFT JOIN booking_extras e ON b.booking_id = e.booking_id
            ORDER BY b.booking_id";

    $bookingsResult = $conn->query($bookingsSql);
    if (!$bookingsResult) {
        echo json_encode([
            'success' => false,
            'message' => "Query failed: " . $conn->error,
            'code' => 500
        ]);
        exit;
    }

    $data = [];
    $headers = [
        'Booking ID', 'Booking Created', 'Booking Date', 'Booking Time', 'Booking Status', 'Booking Notes',
        'Booking Username', 'Booking Password', 'Student IDs', 'Student Names',
        'School Divisions', 'Grades', 'Students Created',
        'Parent Names', 'Parent Emails', 'Parent Phones',
        'CD Count', 'Additional Attendees', 'Booking Extras Status'
    ];
    $data[] = $headers;

    while ($booking = $bookingsResult->fetch_assoc()) {
        $studentsSql = "SELECT s.student_id, s.name, s.school_division, s.grade, s.created_at
                       FROM booking_students s
                       JOIN booking_students_linker sl ON s.student_id = sl.student_id
                       WHERE sl.booking_id = ?
                       ORDER BY s.student_id";

        $stmtStudents = $conn->prepare($studentsSql);
        $stmtStudents->bind_param("i", $booking['booking_id']);
        $stmtStudents->execute();
        $studentsResult = $stmtStudents->get_result();

        $studentIds = [];
        $studentNames = [];
        $schoolDivisions = [];
        $grades = [];
        $studentsCreated = [];

        while ($student = $studentsResult->fetch_assoc()) {
            $studentIds[] = $student['student_id'];
            $studentNames[] = $student['name'];
            $schoolDivisions[] = $student['school_division'];
            $grades[] = $student['grade'];
            $studentsCreated[] = $student['created_at'];
        }

        $stmtStudents->close();

        $parentsSql = "SELECT p.parent_id, p.name, p.email, p.phone_number
                      FROM booking_parents p
                      JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
                      WHERE pl.booking_id = ?
                      ORDER BY p.parent_id";

        $stmtParents = $conn->prepare($parentsSql);
        $stmtParents->bind_param("i", $booking['booking_id']);
        $stmtParents->execute();
        $parentsResult = $stmtParents->get_result();
        $parentNames = [];
        $parentEmails = [];
        $parentPhones = [];

        while ($parent = $parentsResult->fetch_assoc()) {
            if (!empty($parent['name'])) {
                $parentNames[] = $parent['name'];
            }
            if (!empty($parent['email'])) {
                $parentEmails[] = $parent['email'];
            }
            if (!empty($parent['phone_number'])) {
                $parentPhones[] = $parent['phone_number'];
            }
        }

        $stmtParents->close();

        $rowData = [
            $booking['booking_id'],
            $booking['booking_created'],
            $booking['booking_date'],
            $booking['booking_time'],
            $booking['status'],
            $booking['notes'],
            $booking['username'],
            $booking['password_hash'],
            implode(', ', $studentIds),
            implode(', ', $studentNames),
            implode(', ', $schoolDivisions),
            implode(', ', $grades),
            implode(', ', $studentsCreated),
            implode(', ', $parentNames),
            implode(', ', $parentEmails),
            implode(', ', $parentPhones),
            $booking['cd_count'],
            $booking['additional_attendees'],
            $booking['payment_status']
        ];

        $data[] = $rowData;
    }

    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    echo json_encode([
        'success' => true,
        'data' => $data,
        'executionTime' => $executionTime
    ]);

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