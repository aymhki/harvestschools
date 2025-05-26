<?php
//header('Content-Type: application/json');
//header('Access-Control-Allow-Origin: http://localhost:5173');
//header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
//header('Pragma: no-cache');
//header('Expires: 0');
//
//$dbConfig = require 'dbConfig.php';
//$servername = $dbConfig['db_host'];
//$username = $dbConfig['db_username'];
//$password = $dbConfig['db_password'];
//$dbname = $dbConfig['db_name'];
//
//try {
//    $input = file_get_contents('php://input');
//    $data = json_decode($input, true);
//
//    if (!isset($data['bookingId']) || !isset($data['extrasId']) ||
//        !isset($data['username']) || !isset($data['password_hash'])) {
//        echo json_encode([
//            'success' => false,
//            'message' => 'Missing required parameters: bookingId, extrasId, username, and password_hash are required',
//            'code' => 400
//        ]);
//        exit;
//    }
//
//    $bookingId = $data['bookingId'];
//    $extrasId = $data['extrasId'];
//    $requestUsername = $data['username'];
//    $requestPasswordHash = $data['password_hash'];
//
//    $startTime = microtime(true);
//
//    $conn = new mysqli($servername, $username, $password, $dbname);
//    if ($conn->connect_error) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Connection failed: " . $conn->connect_error,
//            'code' => 500
//        ]);
//        exit;
//    }
//
//    $validationSql = "SELECT
//                        b.booking_id,
//                        b.auth_id,
//                        ac.username,
//                        ac.password_hash,
//                        be.extra_id
//                      FROM bookings b
//                      JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
//                      LEFT JOIN booking_extras be ON b.booking_id = be.booking_id
//                      WHERE b.booking_id = ?
//                        AND ac.username = ?
//                        AND ac.password_hash = ?
//                        AND (be.extra_id = ? OR be.extra_id IS NULL)";
//
//    $stmt = $conn->prepare($validationSql);
//    if (!$stmt) {
//        echo json_encode([
//            'success' => false,
//            'message' => "Prepare failed: " . $conn->error,
//            'code' => 500
//        ]);
//        exit;
//    }
//
//    $stmt->bind_param("issi", $bookingId, $requestUsername, $requestPasswordHash, $extrasId);
//    $stmt->execute();
//    $validationResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($validationResult->num_rows == 0) {
//        echo json_encode([
//            'success' => false,
//            'message' => 'Invalid booking details. Could not find a booking with this url',
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $validationRow = $validationResult->fetch_assoc();
//
//    if ($extrasId && !$validationRow['extra_id']) {
//        echo json_encode([
//            'success' => false,
//            'message' => 'No booking extras found for the provided extras ID',
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $confirmationSql = "SELECT
//                          b.booking_id,
//                          b.booking_date,
//                          b.booking_time,
//                          b.status,
//                          b.notes,
//                          b.created_at AS booking_created,
//                          ac.username,
//                          COALESCE(be.cd_count, 0) as cd_count,
//                          COALESCE(be.additional_attendees, 0) as additional_attendees,
//                          COALESCE(be.payment_status, 'Not Signed Up') as payment_status,
//                          be.extra_id,
//                          be.created_at AS extras_created
//                        FROM bookings b
//                        JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
//                        LEFT JOIN booking_extras be ON b.booking_id = be.booking_id
//                        WHERE b.booking_id = ?";
//
//    $stmt = $conn->prepare($confirmationSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $confirmationResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($confirmationResult->num_rows == 0) {
//        echo json_encode([
//            'success' => false,
//            'message' => 'Booking not found',
//            'code' => 404
//        ]);
//        exit;
//    }
//
//    $confirmationData = $confirmationResult->fetch_assoc();
//
//    $studentsSql = "SELECT s.student_id, s.name, s.school_division, s.grade
//                   FROM booking_students s
//                   JOIN booking_students_linker sl ON s.student_id = sl.student_id
//                   WHERE sl.booking_id = ?
//                   ORDER BY s.student_id";
//
//    $stmt = $conn->prepare($studentsSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $studentsResult = $stmt->get_result();
//    $stmt->close();
//
//    $students = [];
//    while ($student = $studentsResult->fetch_assoc()) {
//        $students[] = $student;
//    }
//
//    $parentsSql = "SELECT p.parent_id, p.name, p.email, p.phone_number, pl.is_primary
//                  FROM booking_parents p
//                  JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
//                  WHERE pl.booking_id = ?
//                  ORDER BY pl.is_primary DESC, p.parent_id";
//
//    $stmt = $conn->prepare($parentsSql);
//    $stmt->bind_param("i", $bookingId);
//    $stmt->execute();
//    $parentsResult = $stmt->get_result();
//    $stmt->close();
//
//    $parents = [];
//    while ($parent = $parentsResult->fetch_assoc()) {
//        $parents[] = $parent;
//    }
//
//    $cdCount = intval($confirmationData['cd_count']);
//    $additionalAttendees = intval($confirmationData['additional_attendees']);
//    $totalCdCost = $cdCount * 250;
//    $totalAdditionalAttendeeCost = $additionalAttendees * 100;
//    $totalCost = $totalCdCost + $totalAdditionalAttendeeCost;
//    $totalCostFormatted = number_format($totalCost, 2, '.', '') . ' EGP';
//    $totalCdCostFormatted = number_format($totalCdCost, 2, '.', '') . ' EGP';
//    $totalAdditionalAttendeeCostFormatted = number_format($totalAdditionalAttendeeCost, 2, '.', '') . ' EGP';
//
//    $responseData = [
//        'booking_id' => $confirmationData['booking_id'],
//        'booking_date' => $confirmationData['booking_date'],
//        'booking_time' => $confirmationData['booking_time'],
//        'booking_status' => $confirmationData['status'],
//        'booking_notes' => $confirmationData['notes'],
//        'booking_created' => $confirmationData['booking_created'],
//        'username' => $confirmationData['username'],
//        'cd_count' => $confirmationData['cd_count'],
//        'additional_attendees' => $confirmationData['additional_attendees'],
//        'payment_status' => $confirmationData['payment_status'],
//        'extra_id' => $confirmationData['extra_id'],
//        'extras_created' => $confirmationData['extras_created'],
//        'total_paid' => $totalCostFormatted,
//        'cd_cost' => $totalCdCostFormatted,
//        'additional_attendee_cost' => $totalAdditionalAttendeeCostFormatted,
//        'students' => $students,
//        'parents' => $parents
//    ];
//
//    $endTime = microtime(true);
//    $executionTime = ($endTime - $startTime) * 1000;
//
//    echo json_encode([
//        'success' => true,
//        'confirmation_data' => $responseData,
//        'executionTime' => $executionTime,
//        'message' => 'Booking confirmation retrieved successfully',
//        'code' => 200
//    ]);
//
//} catch (Exception $e) {
//    $statusCode = $e->getCode() ?: 500;
//    echo json_encode([
//        'success' => false,
//        'message' => $e->getMessage(),
//        'code' => $statusCode
//    ]);
//} finally {
//    if (isset($conn) && $conn) {
//        $conn->close();
//    }
//}
//?>

<?php
// File 1: Booking Confirmation Retrieval
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
    if (!isset($data['bookingId']) || !isset($data['extrasId']) ||
        !isset($data['username']) || !isset($data['password_hash'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required parameters: bookingId, extrasId, username, and password_hash are required',
            'code' => 400
        ]);
        exit;
    }
    $bookingId = $data['bookingId'];
    $extrasId = $data['extrasId'];
    $requestUsername = $data['username'];
    $requestPasswordHash = $data['password_hash'];
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
    $validationSql = "SELECT 
                        b.booking_id,
                        b.auth_id,
                        ac.username,
                        ac.password_hash,
                        be.extra_id
                      FROM bookings b
                      JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
                      LEFT JOIN booking_extras be ON b.booking_id = be.booking_id
                      WHERE b.booking_id = ? 
                        AND ac.username = ? 
                        AND ac.password_hash = ?
                        AND (be.extra_id = ? OR be.extra_id IS NULL)";
    $stmt = $conn->prepare($validationSql);
    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => "Prepare failed: " . $conn->error,
            'code' => 500
        ]);
        exit;
    }
    $stmt->bind_param("issi", $bookingId, $requestUsername, $requestPasswordHash, $extrasId);
    $stmt->execute();
    $validationResult = $stmt->get_result();
    $stmt->close();
    if ($validationResult->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid booking details. Could not find a booking with this url',
            'code' => 404
        ]);
        exit;
    }
    $validationRow = $validationResult->fetch_assoc();
    if ($extrasId && !$validationRow['extra_id']) {
        echo json_encode([
            'success' => false,
            'message' => 'No booking extras found for the provided extras ID',
            'code' => 404
        ]);
        exit;
    }
    $confirmationSql = "SELECT 
                          b.booking_id,
                          b.booking_date,
                          b.booking_time,
                          b.status,
                          b.notes,
                          b.created_at AS booking_created,
                          ac.username,
                          COALESCE(be.cd_count, 0) as cd_count,
                          COALESCE(be.additional_attendees, 0) as additional_attendees,
                          COALESCE(be.payment_status, 'Not Signed Up') as payment_status,
                          be.extra_id,
                          be.created_at AS extras_created
                        FROM bookings b
                        JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
                        LEFT JOIN booking_extras be ON b.booking_id = be.booking_id
                        WHERE b.booking_id = ?";
    $stmt = $conn->prepare($confirmationSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $confirmationResult = $stmt->get_result();
    $stmt->close();
    if ($confirmationResult->num_rows == 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Booking not found',
            'code' => 404
        ]);
        exit;
    }
    $confirmationData = $confirmationResult->fetch_assoc();

    // Get student count for base fair calculation
    $studentCountSql = "SELECT COUNT(*) as student_count
                       FROM booking_students s
                       JOIN booking_students_linker sl ON s.student_id = sl.student_id
                       WHERE sl.booking_id = ?";
    $stmt = $conn->prepare($studentCountSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $studentCountResult = $stmt->get_result();
    $studentCount = $studentCountResult->fetch_assoc()['student_count'];
    $stmt->close();

    $studentsSql = "SELECT s.student_id, s.name, s.school_division, s.grade
                   FROM booking_students s
                   JOIN booking_students_linker sl ON s.student_id = sl.student_id
                   WHERE sl.booking_id = ?
                   ORDER BY s.student_id";
    $stmt = $conn->prepare($studentsSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $studentsResult = $stmt->get_result();
    $stmt->close();
    $students = [];
    while ($student = $studentsResult->fetch_assoc()) {
        $students[] = $student;
    }
    $parentsSql = "SELECT p.parent_id, p.name, p.email, p.phone_number, pl.is_primary
                  FROM booking_parents p
                  JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
                  WHERE pl.booking_id = ?
                  ORDER BY pl.is_primary DESC, p.parent_id";
    $stmt = $conn->prepare($parentsSql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $parentsResult = $stmt->get_result();
    $stmt->close();
    $parents = [];
    while ($parent = $parentsResult->fetch_assoc()) {
        $parents[] = $parent;
    }

    // Calculate costs
    $cdCount = intval($confirmationData['cd_count']);
    $additionalAttendees = intval($confirmationData['additional_attendees']);
    $totalCdCost = $cdCount * 250;
    $totalAdditionalAttendeeCost = $additionalAttendees * 100;
    $totalExtrasCost = $totalCdCost + $totalAdditionalAttendeeCost;

    // New calculations
    $totalBaseFair = $studentCount * 1200;
    $totalCostBaseAndExtras = $totalBaseFair + $totalExtrasCost;

    // Format costs
    $totalCdCostFormatted = number_format($totalCdCost, 2, '.', '') . ' EGP';
    $totalAdditionalAttendeeCostFormatted = number_format($totalAdditionalAttendeeCost, 2, '.', '') . ' EGP';
    $totalExtrasCostFormatted = number_format($totalExtrasCost, 2, '.', '') . ' EGP';
    $totalBaseFairFormatted = number_format($totalBaseFair, 2, '.', '') . ' EGP';
    $totalCostBaseAndExtrasFormatted = number_format($totalCostBaseAndExtras, 2, '.', '') . ' EGP';

    $responseData = [
        'booking_id' => $confirmationData['booking_id'],
        'booking_date' => $confirmationData['booking_date'],
        'booking_time' => $confirmationData['booking_time'],
        'booking_status' => $confirmationData['status'],
        'booking_notes' => $confirmationData['notes'],
        'booking_created' => $confirmationData['booking_created'],
        'username' => $confirmationData['username'],
        'cd_count' => $confirmationData['cd_count'],
        'additional_attendees' => $confirmationData['additional_attendees'],
        'payment_status' => $confirmationData['payment_status'],
        'extra_id' => $confirmationData['extra_id'],
        'extras_created' => $confirmationData['extras_created'],
        'student_count' => $studentCount,
        'total_paid' => $totalExtrasCostFormatted, // Keep for backward compatibility
        'cd_cost' => $totalCdCostFormatted,
        'additional_attendee_cost' => $totalAdditionalAttendeeCostFormatted,
        'total_paid_for_base_fair' => $totalBaseFairFormatted,
        'total_paid_for_base_and_extras' => $totalCostBaseAndExtrasFormatted,
        'students' => $students,
        'parents' => $parents
    ];
    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;
    echo json_encode([
        'success' => true,
        'confirmation_data' => $responseData,
        'executionTime' => $executionTime,
        'message' => 'Booking confirmation retrieved successfully',
        'code' => 200
    ]);
} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $statusCode
    ]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>
