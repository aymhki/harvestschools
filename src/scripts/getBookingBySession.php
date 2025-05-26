<?php
//header('Content-Type: application/json');
//header('Access-Control-Allow-Origin: http://localhost:5173');
//header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
//header('Pragma: no-cache');
//header('Expires: 0');
//$dbConfig = require 'dbConfig.php';
//$servername = $dbConfig['db_host'];
//$username = $dbConfig['db_username'];
//$password = $dbConfig['db_password'];
//$dbname = $dbConfig['db_name'];
//
//try {
//    $input = json_decode(file_get_contents('php://input'), true);
//
//    if (!isset($input['session_id'])) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Session ID is required",
//            'code' => 400
//        ]);
//        exit;
//    }
//
//    $sessionId = $input['session_id'];
//    $startTime = microtime(true);
//    $conn = new mysqli($servername, $username, $password, $dbname);
//
//    if ($conn->connect_error) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Connection failed: " . $conn->connect_error,
//            'code' => 500
//        ]);
//        exit;
//    }
//
//    $sessionSql = "SELECT username FROM booking_sessions WHERE id = ?";
//    $stmt = $conn->prepare($sessionSql);
//
//    if (!$stmt) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Prepare failed: " . $conn->error,
//            'code' => 500
//        ]);
//        exit;
//    }
//
//    $stmt->bind_param("s", $sessionId);
//    $stmt->execute();
//    $sessionResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($sessionResult->num_rows == 0) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Invalid session ID",
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $sessionRow = $sessionResult->fetch_assoc();
//    $bookingUsername = $sessionRow['username'];
//    $bookingSql = "SELECT b.booking_id
//                   FROM bookings b
//                   JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
//                   WHERE ac.username = ?";
//    $stmt = $conn->prepare($bookingSql);
//
//    if (!$stmt) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Prepare failed: " . $conn->error,
//            'code' => 500
//        ]);
//        exit;
//    }
//
//    $stmt->bind_param("s", $bookingUsername);
//    $stmt->execute();
//    $bookingResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($bookingResult->num_rows == 0) {
//        echo json_encode([
//            'success' => false,
//            'message' => "No booking found for this user",
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $bookingRow = $bookingResult->fetch_assoc();
//    $bookingId = $bookingRow['booking_id'];
//    $bookingDetailsSql = "SELECT
//                            b.booking_id,
//                            b.auth_id,
//                            b.booking_date,
//                            b.booking_time,
//                            b.status,
//                            b.notes,
//                            b.created_at AS booking_created_at,
//                            b.updated_at AS booking_updated_at,
//                            ac.username,
//                            ac.password_hash,
//                            ac.created_at AS auth_created_at,
//                            ac.updated_at AS auth_updated_at
//                         FROM bookings b
//                         JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
//                         WHERE b.booking_id = ?";
//    $stmt = $conn->prepare($bookingDetailsSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $bookingDetailsResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($bookingDetailsResult->num_rows == 0) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Booking details not found",
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $bookingDetails = $bookingDetailsResult->fetch_assoc();
//    $extrasSql = "SELECT
//                    extra_id,
//                    cd_count,
//                    additional_attendees,
//                    payment_status,
//                    created_at,
//                    updated_at
//                  FROM booking_extras
//                  WHERE booking_id = ?";
//    $stmt = $conn->prepare($extrasSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $extrasResult = $stmt->get_result();
//    $stmt->close();
//    $extras = $extrasResult->num_rows > 0 ? $extrasResult->fetch_assoc() : null;
//    $parentsSql = "SELECT
//                     p.*,
//                     pl.is_primary
//                   FROM booking_parents p
//                   JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
//                   WHERE pl.booking_id = ?
//                   ORDER BY pl.is_primary DESC";
//    $stmt = $conn->prepare($parentsSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $parentsResult = $stmt->get_result();
//    $stmt->close();
//    $parents = [];
//
//    while ($parent = $parentsResult->fetch_assoc()) {
//        $parents[] = $parent;
//    }
//
//    $studentsSql = "SELECT
//                     s.*
//                   FROM booking_students s
//                   JOIN booking_students_linker sl ON s.student_id = sl.student_id
//                   WHERE sl.booking_id = ?";
//    $stmt = $conn->prepare($studentsSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $studentsResult = $stmt->get_result();
//    $stmt->close();
//    $students = [];
//
//    while ($student = $studentsResult->fetch_assoc()) {
//        $students[] = $student;
//    }
//
//    $bookingData = [
//        'booking' => $bookingDetails,
//        'extras' => $extras,
//        'parents' => $parents,
//        'students' => $students
//    ];
//    $tabularData = [];
//    $tabularHeaders = [
//        'Booking ID', 'Student ID', 'Student Name', 'School Division', 'Grade',
//        'Booking Username', 'Booking Password', 'First Parent Name', 'First Parent Email', 'First Parent Phone',
//        'Second Parent Name', 'Second Parent Email', 'Second Parent Phone',
//        'CD Count', 'Additional Attendees', 'Payment Status', 'Booking Date', 'Booking Time', 'Status', 'Notes',
//        'Student Created', 'Booking Created'
//    ];
//    $tabularData[] = $tabularHeaders;
//    $firstParent = null;
//    $secondParent = null;
//
//    foreach ($parents as $parent) {
//        if ($parent['is_primary'] == 1) {
//            $firstParent = $parent;
//        } else {
//            $secondParent = $parent;
//        }
//    }
//
//    foreach ($students as $student) {
//        $row = [
//            $bookingId,
//            $student['student_id'],
//            $student['name'],
//            $student['school_division'],
//            $student['grade'],
//            $bookingDetails['username'],
//            $bookingDetails['password_hash'],
//            $firstParent ? $firstParent['name'] : null,
//            $firstParent ? $firstParent['email'] : null,
//            $firstParent ? $firstParent['phone_number'] : null,
//            $secondParent ? $secondParent['name'] : null,
//            $secondParent ? $secondParent['email'] : null,
//            $secondParent ? $secondParent['phone_number'] : null,
//            $extras ? $extras['cd_count'] : 0,
//            $extras ? $extras['additional_attendees'] : 0,
//            $extras ? $extras['payment_status'] : 'Not Signed Up',
//            $bookingDetails['booking_date'],
//            $bookingDetails['booking_time'],
//            $bookingDetails['status'],
//            $bookingDetails['notes'],
//            $student['created_at'],
//            $bookingDetails['booking_created_at']
//        ];
//
//        $tabularData[] = $row;
//    }
//
//    $endTime = microtime(true);
//    $executionTime = ($endTime - $startTime) * 1000;
//
//    echo json_encode([
//        'success' => true,
//        'bookingId' => $bookingId,
//        'bookingUsername' => $bookingUsername,
//        'sessionId' => $sessionId,
//        'detailedData' => $bookingData,
//        'tabularData' => $tabularData,
//        'executionTime' => $executionTime,
//        'message' => "Booking details retrieved successfully",
//        'code' => 200
//    ]);
//
//} catch (Exception $e) {
//    echo json_encode([
//        'success' => false,
//        'message' => $e->getMessage(),
//        'code' => $e->getCode() ?: 500
//    ]);
//} finally {
//    if ($conn) {
//        $conn->close();
//    }
//}

// File 3: User Booking Details Retrieval
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
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['session_id'])) {
        echo json_encode([
            'success' => false,
            'message' => "Session ID is required",
            'code' => 400
        ]);
        exit;
    }
    $sessionId = $input['session_id'];
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
    $sessionSql = "SELECT username FROM booking_sessions WHERE id = ?";
    $stmt = $conn->prepare($sessionSql);
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
    $sessionResult = $stmt->get_result();
    $stmt->close();
    if ($sessionResult->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => "Invalid session ID",
            'code' => 404
        ]);
        exit;
    }
    $sessionRow = $sessionResult->fetch_assoc();
    $bookingUsername = $sessionRow['username'];
    $bookingSql = "SELECT b.booking_id 
                   FROM bookings b
                   JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
                   WHERE ac.username = ?";
    $stmt = $conn->prepare($bookingSql);
    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => "Prepare failed: " . $conn->error,
            'code' => 500
        ]);
        exit;
    }
    $stmt->bind_param("s", $bookingUsername);
    $stmt->execute();
    $bookingResult = $stmt->get_result();
    $stmt->close();
    if ($bookingResult->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => "No booking found for this user",
            'code' => 404
        ]);
        exit;
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
        echo json_encode([
            'success' => false,
            'message' => "Booking details not found",
            'code' => 404
        ]);
        exit;
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

    // Calculate costs
    $studentCount = count($students);
    $cdCount = $extras ? intval($extras['cd_count']) : 0;
    $additionalAttendees = $extras ? intval($extras['additional_attendees']) : 0;
    $totalCdCost = $cdCount * 250;
    $totalAdditionalAttendeeCost = $additionalAttendees * 100;
    $totalExtrasCost = $totalCdCost + $totalAdditionalAttendeeCost;

    // New calculations
    $totalBaseFair = $studentCount * 1200;
    $totalCostBaseAndExtras = $totalBaseFair + $totalExtrasCost;

    // Add cost information to booking details
    $bookingDetails['student_count'] = $studentCount;
    $bookingDetails['total_paid_for_base_fair'] = number_format($totalBaseFair, 2, '.', '') . ' EGP';
    $bookingDetails['total_paid_for_base_and_extras'] = number_format($totalCostBaseAndExtras, 2, '.', '') . ' EGP';
    $bookingDetails['cd_cost'] = number_format($totalCdCost, 2, '.', '') . ' EGP';
    $bookingDetails['additional_attendee_cost'] = number_format($totalAdditionalAttendeeCost, 2, '.', '') . ' EGP';
    $bookingDetails['total_extras_cost'] = number_format($totalExtrasCost, 2, '.', '') . ' EGP';

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
        'Student Created', 'Booking Created', 'Student Count', 'Total Paid for Base Fair', 'Total Paid for Base and Extras'
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

    // Format costs for tabular data
    $totalBaseFairFormatted = number_format($totalBaseFair, 2, '.', '') . ' EGP';
    $totalCostBaseAndExtrasFormatted = number_format($totalCostBaseAndExtras, 2, '.', '') . ' EGP';

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
            $bookingDetails['booking_created_at'],
            $studentCount,
            $totalBaseFairFormatted,
            $totalCostBaseAndExtrasFormatted
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
        'executionTime' => $executionTime,
        'message' => "Booking details retrieved successfully",
        'code' => 200
    ]);


} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $e->getCode() ?: 500
    ]);
} finally {
    if ($conn) {
        $conn->close();
    }
}

?>






