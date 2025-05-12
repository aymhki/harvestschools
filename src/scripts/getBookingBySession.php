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
    if (!isset($_GET['session_id'])) {
        throw new Exception("Session ID is required", 400);
    }

    $sessionId = $_GET['session_id'];
    $startTime = microtime(true);

    // Connect to the database
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    // Step 1: Get username from session ID
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

    // Step 2: Get booking ID from username
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

    // Step 3: Get all detailed information for the booking

    // A. Get booking details and auth credentials
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

    // B. Get booking extras
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

    // C. Get parents information
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

    // D. Get students information
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

    // Format 1: All data in one object grouped by booking
    $bookingData = [
        'booking' => $bookingDetails,
        'extras' => $extras,
        'parents' => $parents,
        'students' => $students
    ];

    // Format 2: Similar to getAllBookings with one row per student
    $tabularData = [];
    $tabularHeaders = [
        'Booking ID', 'Student ID', 'Student Name', 'School Division', 'Grade',
        'Booking Username', 'Booking Password', 'First Parent Name', 'First Parent Email', 'First Parent Phone',
        'Second Parent Name', 'Second Parent Email', 'Second Parent Phone',
        'CD Count', 'Additional Attendees', 'Payment Status', 'Booking Date', 'Booking Time', 'Status', 'Notes',
        'Student Created', 'Booking Created'
    ];

    $tabularData[] = $tabularHeaders;

    // Extract first parent (is_primary = 1) and second parent (is_primary = 0)
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
            $bookingId, // Booking ID
            $student['student_id'], // Student ID
            $student['name'], // Student Name
            $student['school_division'], // School Division
            $student['grade'], // Grade
            $bookingDetails['username'], // Booking Username
            $bookingDetails['password_hash'], // Booking Password
            $firstParent ? $firstParent['name'] : null, // First Parent Name
            $firstParent ? $firstParent['email'] : null, // First Parent Email
            $firstParent ? $firstParent['phone_number'] : null, // First Parent Phone
            $secondParent ? $secondParent['name'] : null, // Second Parent Name
            $secondParent ? $secondParent['email'] : null, // Second Parent Email
            $secondParent ? $secondParent['phone_number'] : null, // Second Parent Phone
            $extras ? $extras['cd_count'] : 0, // CD Count
            $extras ? $extras['additional_attendees'] : 0, // Additional Attendees
            $extras ? $extras['payment_status'] : 'Not Signed Up', // Payment Status
            $bookingDetails['booking_date'], // Booking Date
            $bookingDetails['booking_time'], // Booking Time
            $bookingDetails['status'], // Status
            $bookingDetails['notes'], // Notes
            $student['created_at'], // Student Created
            $bookingDetails['booking_created_at'] // Booking Created
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