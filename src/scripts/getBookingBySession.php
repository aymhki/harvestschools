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

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['sessionId'])) {
        throw new Exception("Session ID is required", 400);
    }

    $sessionId = $input['sessionId'];
    $startTime = microtime(true);

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    $sessionSql = "SELECT username FROM booking_sessions WHERE id = ?";
    $stmt = $conn->prepare($sessionSql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $sessionResult = $stmt->get_result();
    $stmt->close();

    if ($sessionResult->num_rows == 0) {
        throw new Exception("Invalid session ID", 404);
    }

    $sessionRow = $sessionResult->fetch_assoc();
    $bookingUsername = $sessionRow['username'];

    $bookingSql = "SELECT b.booking_id 
                   FROM bookings b
                   JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
                   WHERE ac.username = ?";
    $stmt = $conn->prepare($bookingSql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param("s", $bookingUsername);
    $stmt->execute();
    $bookingResult = $stmt->get_result();
    $stmt->close();

    if ($bookingResult->num_rows == 0) {
        throw new Exception("No booking found for this user", 404);
    }

    $bookingRow = $bookingResult->fetch_assoc();
    $bookingId = $bookingRow['booking_id'];


    $bookingDetailsSql = "SELECT 
                            b.booking_id,
                            b.auth_id,
                            b.booking_date,
                            b.booking_time,
                            b.status,
                            b.notes,
                            b.created_at AS booking_created_at,
                            b.updated_at AS booking_updated_at,
                            ac.username,
                            ac.password_hash,
                            ac.created_at AS auth_created_at,
                            ac.updated_at AS auth_updated_at
                         FROM bookings b
                         JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
                         WHERE b.booking_id = ?";

    $stmt = $conn->prepare($bookingDetailsSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $bookingDetailsResult = $stmt->get_result();
    $stmt->close();

    if ($bookingDetailsResult->num_rows == 0) {
        throw new Exception("Booking details not found", 404);
    }

    $bookingDetails = $bookingDetailsResult->fetch_assoc();

    $extrasSql = "SELECT 
                    extra_id,
                    cd_count,
                    additional_attendees,
                    payment_status,
                    created_at,
                    updated_at
                  FROM booking_extras
                  WHERE booking_id = ?";

    $stmt = $conn->prepare($extrasSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $extrasResult = $stmt->get_result();
    $stmt->close();

    $extras = $extrasResult->num_rows > 0 ? $extrasResult->fetch_assoc() : null;

    $parentsSql = "SELECT 
                     p.*,
                     pl.is_primary
                   FROM booking_parents p
                   JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
                   WHERE pl.booking_id = ?
                   ORDER BY pl.is_primary DESC";

    $stmt = $conn->prepare($parentsSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $parentsResult = $stmt->get_result();
    $stmt->close();

    $parents = [];
    while ($parent = $parentsResult->fetch_assoc()) {
        $parents[] = $parent;
    }

    $studentsSql = "SELECT 
                     s.*
                   FROM booking_students s
                   JOIN booking_students_linker sl ON s.student_id = sl.student_id
                   WHERE sl.booking_id = ?";

    $stmt = $conn->prepare($studentsSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $studentsResult = $stmt->get_result();
    $stmt->close();

    $students = [];
    while ($student = $studentsResult->fetch_assoc()) {
        $students[] = $student;
    }

    $bookingData = [
        'booking' => $bookingDetails,
        'extras' => $extras,
        'parents' => $parents,
        'students' => $students
    ];

    $tabularData = [];
    $tabularHeaders = [
        'Booking ID', 'Student ID', 'Student Name', 'School Division', 'Grade',
        'Booking Username', 'Booking Password', 'First Parent Name', 'First Parent Email', 'First Parent Phone',
        'Second Parent Name', 'Second Parent Email', 'Second Parent Phone',
        'CD Count', 'Additional Attendees', 'Payment Status', 'Booking Date', 'Booking Time', 'Status', 'Notes',
        'Student Created', 'Booking Created'
    ];

    $tabularData[] = $tabularHeaders;

    $firstParent = null;
    $secondParent = null;

    foreach ($parents as $parent) {
        if ($parent['is_primary'] == 1) {
            $firstParent = $parent;
        } else {
            $secondParent = $parent;
        }
    }

    foreach ($students as $student) {
        $row = [
            $bookingId,
            $student['student_id'],
            $student['name'],
            $student['school_division'],
            $student['grade'],
            $bookingDetails['username'],
            $bookingDetails['password_hash'],
            $firstParent ? $firstParent['name'] : null,
            $firstParent ? $firstParent['email'] : null,
            $firstParent ? $firstParent['phone_number'] : null,
            $secondParent ? $secondParent['name'] : null,
            $secondParent ? $secondParent['email'] : null,
            $secondParent ? $secondParent['phone_number'] : null,
            $extras ? $extras['cd_count'] : 0,
            $extras ? $extras['additional_attendees'] : 0,
            $extras ? $extras['payment_status'] : 'Not Signed Up',
            $bookingDetails['booking_date'],
            $bookingDetails['booking_time'],
            $bookingDetails['status'],
            $bookingDetails['notes'],
            $student['created_at'],
            $bookingDetails['booking_created_at']
        ];

        $tabularData[] = $row;
    }

    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    echo json_encode([
        'success' => true,
        'bookingId' => $bookingId,
        'bookingUsername' => $bookingUsername,
        'sessionId' => $sessionId,
        'detailedData' => $bookingData,
        'tabularData' => $tabularData,
        'executionTime' => $executionTime
    ]);

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