<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../authHelpers.php';
$dbConfig = require '../../../../configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $GRADUATION_BOOKING_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $GRADUATION_BOOKING_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
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
            FROM graduation_bookings b
            JOIN graduation_booking_auth_credentials ac ON b.auth_id = ac.auth_id
            LEFT JOIN graduation_booking_extras e ON b.booking_id = e.booking_id
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
        'ID', 'Booking Created', 'Booking Date', 'Booking Time', 'Booking Status', 'Booking Notes',
        'Booking Username', 'Booking Password', 'Student IDs', 'Student Names',
        'School Divisions', 'Grades', 'Students Created', 'Student Count',
        'Parent Names', 'Parent Emails', 'Parent Phones',
        'CD Count', 'Additional Attendees', 'Booking Extras Status',
        'Total CD Cost', 'Total Additional Attendee(s) Cost', 'Total Extras Cost',
        'Total Paid for Base Fare', 'Total for Base and Extras'
    ];

    $data[] = $headers;

    while ($booking = $bookingsResult->fetch_assoc()) {
        $studentsSql = "SELECT s.student_id, s.name, s.school_division, s.grade, s.created_at
                       FROM graduation_booking_students s
                       JOIN graduation_booking_students_linker sl ON s.student_id = sl.student_id
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
        $studentCount = 0;

        while ($student = $studentsResult->fetch_assoc()) {
            $studentIds[] = $student['student_id'];
            $studentNames[] = $student['name'];
            $schoolDivisions[] = $student['school_division'];
            $grades[] = $student['grade'];
            $studentsCreated[] = $student['created_at'];
            $studentCount++;
        }

        $stmtStudents->close();
        $parentsSql = "SELECT p.parent_id, p.name, p.email, p.phone_number
                      FROM graduation_booking_parents p
                      JOIN graduation_booking_parents_linker pl ON p.parent_id = pl.parent_id
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

        $cdCount = intval($booking['cd_count'] ?? 0);
        $additionalAttendees = intval($booking['additional_attendees'] ?? 0);
        $totalCdCost = $cdCount * 150;
        $totalAdditionalAttendeeCost = $additionalAttendees * 150;
        $totalExtrasCost = $totalCdCost + $totalAdditionalAttendeeCost;

        $totalBaseFair = $studentCount * 1200;
        $totalCostBaseAndExtras = $totalBaseFair + $totalExtrasCost;

        $totalCdCostFormatted = number_format($totalCdCost, 2, '.', '') . ' EGP';
        $totalAdditionalAttendeeCostFormatted = number_format($totalAdditionalAttendeeCost, 2, '.', '') . ' EGP';
        $totalExtrasCostFormatted = number_format($totalExtrasCost, 2, '.', '') . ' EGP';
        $totalBaseFairFormatted = number_format($totalBaseFair, 2, '.', '') . ' EGP';
        $totalCostBaseAndExtrasFormatted = number_format($totalCostBaseAndExtras, 2, '.', '') . ' EGP';
        $studentCount = number_format($studentCount, 0, '.', '');

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
            $studentCount,
            implode(', ', $parentNames),
            implode(', ', $parentEmails),
            implode(', ', $parentPhones),
            $booking['cd_count'],
            $booking['additional_attendees'],
            $booking['payment_status'],
            $totalCdCostFormatted,
            $totalAdditionalAttendeeCostFormatted,
            $totalExtrasCostFormatted,
            $totalBaseFairFormatted,
            $totalCostBaseAndExtrasFormatted
        ];

        $data[] = $rowData;
    }

    $endTime = microtime(true);
    echo json_encode([
        'success' => true,
        'data' => $data,
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