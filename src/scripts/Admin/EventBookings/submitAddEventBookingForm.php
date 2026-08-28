<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../authHelpers.php';
require_once __DIR__ . '/eventBookingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = null;
    $data = [
        'authId' => null,
        'bookingId' => null,
        'firstParentId' => null,
        'secondParentId' => null,
        'studentIds' => [],
        'extrasId' => null
    ];
    $errorInfo = [
        'success' => true,
        'message' => '',
        'code' => 0
    ];

    try {
        $conn = new mysqli($servername, $username, $password, $dbname);

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

        $formData = [];

        $studentsDynamicSectionId = 100;
        $maxNumberOfStudents = 5;
        $studentTemplateFieldLabels = [
            14 => 'Student Name',
            15 => 'Student School Division',
            16 => 'Student Grade',
        ];
        $studentFieldPattern = '/^field_' . $studentsDynamicSectionId . '_i(\d+)_f(\d+)$/';

        $studentSections = [];

        foreach ($_POST as $key => $value) {
            if (preg_match($studentFieldPattern, $key, $matches)) {
                $sectionOrdinal = (int)$matches[1];
                $templateFieldId = (int)$matches[2];

                if (isset($studentTemplateFieldLabels[$templateFieldId])) {
                    if (!isset($studentSections[$sectionOrdinal])) {
                        $studentSections[$sectionOrdinal] = [];
                    }

                    $studentSections[$sectionOrdinal][$studentTemplateFieldLabels[$templateFieldId]] = $value;
                }
            } else if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;
                }
            }
        }

        ksort($studentSections);

        if (count($studentSections) > $maxNumberOfStudents) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'A maximum of ' . $maxNumberOfStudents . ' students is allowed per booking';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }


        $booking = event_booking_normalise([
            'booking_username'    => $formData['Booking Username'] ?? '',
            'booking_password'    => $formData['Booking Password'] ?? '',
            'first_parent_name'   => $formData['First Parent Name'] ?? '',
            'first_parent_email'  => $formData['First Parent Email'] ?? '',
            'first_parent_phone'  => $formData['First Parent Phone Number'] ?? '',
            'second_parent_name'  => $formData['Second Parent Name'] ?? '',
            'second_parent_email' => $formData['Second Parent Email'] ?? '',
            'second_parent_phone' => $formData['Second Parent Phone Number'] ?? '',
            'cd_count'            => $formData['CD Count'] ?? 0,
            'additional_attendees'=> $formData['Additional Attendees'] ?? 0,
            'payment_status'      => $formData['Extras Payment Status'] ?? 'Not Signed Up',
        ]);

        $booking['students'] = [];

        foreach ($studentSections as $studentData) {
            if (empty($studentData['Student Name'])) {
                continue;
            }

            $booking['students'][] = [
                'name'            => $studentData['Student Name'],
                'school_division' => $studentData['Student School Division'] ?? 'Other',
                'grade'           => $studentData['Student Grade'] ?? '',
            ];
        }

        $problem = event_booking_validate($conn, $booking);

        if ($problem !== null) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = $problem['message'];
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $conn->begin_transaction();

        try {
            $bookingId = event_booking_insert($conn, $booking);
            $conn->commit();
        } catch (Throwable $insertError) {
            $conn->rollback();

            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to create the booking: ' . $insertError->getMessage();
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        admin_log_action($conn, 'Created the event booking #' . $bookingId . '.');
        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'code' => 200,
            'booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
        $errorInfo['success'] = false;
        $errorInfo['message'] = 'An unexpected error occurred: ' . $e->getMessage();
        $errorInfo['code'] = 500;

        if ($conn !== null && !$conn->connect_error) {
            performRollback($conn, $data);
        }

        echo json_encode($errorInfo);
    } finally {
        if ($conn !== null && !$conn->connect_error) {
            $conn->close();
        }
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method',
        'code' => 405
    ]);
}

function performRollback($conn, $data) {
    try {
        if (!$conn->begin_transaction()) {
            error_log("Failed to begin transaction for rollback");
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_extras WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_students_linker WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        foreach ($data['studentIds'] as $studentId) {
            $stmt = $conn->prepare("DELETE FROM event_booking_students WHERE student_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $studentId);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_parents_linker WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['firstParentId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_parents WHERE parent_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['firstParentId']);
                $stmt->execute();
            }
        }

        if (!empty($data['secondParentId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_parents WHERE parent_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['secondParentId']);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM event_bookings WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['authId'])) {
            $stmt = $conn->prepare("DELETE FROM event_booking_auth_credentials WHERE auth_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['authId']);
                $stmt->execute();
            }
        }

        if (!$conn->commit()) {
            error_log("Failed to commit rollback transaction: " . $conn->error);
            performFinalCleanup($conn, $data);
        }

    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());

        try {
            $conn->rollback();
            performFinalCleanup($conn, $data);
        } catch (Exception $innerEx) {
            error_log("Critical error during rollback: " . $innerEx->getMessage());
        }
    }
}

function performFinalCleanup($conn, $data) {
    try {
        $intIds = [
            ["DELETE FROM event_booking_extras WHERE booking_id = ?", $data['bookingId']],
            ["DELETE FROM event_booking_students_linker WHERE booking_id = ?", $data['bookingId']],
            ["DELETE FROM event_booking_parents_linker WHERE booking_id = ?", $data['bookingId']],
            ["DELETE FROM event_bookings WHERE booking_id = ?", $data['bookingId']],
            ["DELETE FROM event_booking_parents WHERE parent_id = ?", $data['firstParentId']],
            ["DELETE FROM event_booking_parents WHERE parent_id = ?", $data['secondParentId']],
            ["DELETE FROM event_booking_auth_credentials WHERE auth_id = ?", $data['authId']],
        ];

        foreach ($intIds as [$sql, $id]) {
            if ($id === null) continue;
            $stmt = $conn->prepare($sql);
            if ($stmt) {
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $stmt->close();
            }
        }

        foreach ($data['studentIds'] as $studentId) {
            $stmt = $conn->prepare("DELETE FROM event_booking_students WHERE student_id = ?");
            if ($stmt) {
                $stmt->bind_param("i", $studentId);
                $stmt->execute();
                $stmt->close();
            }
        }

    } catch (Exception $e) {
        error_log("Final cleanup failed: " . $e->getMessage());
    }
}

?>