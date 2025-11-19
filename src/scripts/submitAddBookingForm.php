<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
$dbConfig = require 'dbConfig.php';
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
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database connection failed: ' . $conn->connect_error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }


        $formData = [];

        $studentFieldMappings = [
            14 => ['section' => 1, 'field' => 'Student Name'],
            15 => ['section' => 1, 'field' => 'Student School Division'],
            16 => ['section' => 1, 'field' => 'Student Grade'],
            18 => ['section' => 2, 'field' => 'Student Name'],
            19 => ['section' => 2, 'field' => 'Student School Division'],
            20 => ['section' => 2, 'field' => 'Student Grade'],
            22 => ['section' => 3, 'field' => 'Student Name'],
            23 => ['section' => 3, 'field' => 'Student School Division'],
            24 => ['section' => 3, 'field' => 'Student Grade'],
            26 => ['section' => 4, 'field' => 'Student Name'],
            27 => ['section' => 4, 'field' => 'Student School Division'],
            28 => ['section' => 4, 'field' => 'Student Grade'],
            30 => ['section' => 5, 'field' => 'Student Name'],
            31 => ['section' => 5, 'field' => 'Student School Division'],
            32 => ['section' => 5, 'field' => 'Student Grade'],
        ];

        $studentSections = [];
        for ($i = 1; $i <= 5; $i++) {
            $studentSections[$i] = [];
        }

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = (int)substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($studentFieldMappings[$fieldId])) {
                    $mapping = $studentFieldMappings[$fieldId];
                    $sectionNumber = $mapping['section'];
                    $fieldName = $mapping['field'];
                    $studentSections[$sectionNumber][$fieldName] = $value;
                } else if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;
                }
            }
        }


//        $formData = [];
//        $studentSections = [];
//
//        foreach ($_POST as $key => $value) {
//            if (strpos($key, 'field_') === 0) {
//                $fieldId = substr($key, 6);
//                $labelKey = 'label_' . $fieldId;
//                $instanceKey = 'instance_' . $fieldId;
//                if (isset($_POST[$labelKey])) {
//                    $label = $_POST[$labelKey];
//                    if (isset($_POST[$instanceKey])) {
//                        $instanceId = $_POST[$instanceKey];
//                        if (strpos($instanceId, 'student-section') === 0) {
//                            $sectionNumber = substr($instanceId, strrpos($instanceId, '_') + 1);
//                            if (!isset($studentSections[$sectionNumber])) {
//                                $studentSections[$sectionNumber] = [];
//                            }
//                            $studentSections[$sectionNumber][$label] = $value;
//                        }
//                    } else {
//                        $formData[$label] = $value;
//                    }
//                }
//            }
//        }

        $conn->autocommit(false);

        if (empty($formData['Booking Username']) || empty($formData['Booking Password'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Username and password are required';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $bookingUsername = $formData['Booking Username'];
        $bookingPassword = $formData['Booking Password'];
        $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ?");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("s", $bookingUsername);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error checking username: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Username already exists. Please choose a different username.';
            $errorInfo['code'] = 409;
            echo json_encode($errorInfo);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO booking_auth_credentials (username, password_hash) VALUES (?, SHA2(?, 256))");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("ss", $bookingUsername, $bookingPassword);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to create authentication record: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $data['authId'] = $conn->insert_id;
        $stmt = $conn->prepare("INSERT INTO bookings (auth_id) VALUES (?)");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $data['authId']);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to create booking record: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $data['bookingId'] = $conn->insert_id;

        if (empty($formData['First Parent Name'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent information is incomplete';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'] ?? '';
        $firstParentPhone = $formData['First Parent Phone Number'] ?? '';
        $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to add first parent: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $data['firstParentId'] = $conn->insert_id;
        $isPrimary = 1;
        $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("iii", $data['bookingId'], $data['firstParentId'], $isPrimary);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to link first parent to booking: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';
            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");

            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to add second parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $data['secondParentId'] = $conn->insert_id;
            $isPrimary = 0;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");

            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("iii", $data['bookingId'], $data['secondParentId'], $isPrimary);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to link second parent to booking: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
        }

        $hasStudents = false;

        foreach ($studentSections as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                $hasStudents = true;
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                $grade = $studentData['Student Grade'] ?? '';
                $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to add student #' . ($index + 1) . ': ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $studentId = $conn->insert_id;
                $data['studentIds'][] = $studentId;
                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("ii", $data['bookingId'], $studentId);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
            }
        }

        if (!$hasStudents) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'At least one student is required';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';


        if (($cdCount > 0 || $additionalAttendees > 0) && $paymentStatus === 'Not Signed Up') {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'You can\'t sign up for extras without updating the extras status';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO booking_extras (booking_id, cd_count, additional_attendees, payment_status) VALUES (?, ?, ?, ?)");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("iiis", $data['bookingId'], $cdCount, $additionalAttendees, $paymentStatus);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to create extras record: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $data['extrasId'] = $conn->insert_id;

        if (!$conn->commit()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'code' => 200,
            'booking_id' => $data['bookingId']
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
            $stmt = $conn->prepare("DELETE FROM booking_extras WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        foreach ($data['studentIds'] as $studentId) {
            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $studentId);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['firstParentId'])) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['firstParentId']);
                $stmt->execute();
            }
        }

        if (!empty($data['secondParentId'])) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['secondParentId']);
                $stmt->execute();
            }
        }

        if (!empty($data['bookingId'])) {
            $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");

            if ($stmt) {
                $stmt->bind_param("i", $data['bookingId']);
                $stmt->execute();
            }
        }

        if (!empty($data['authId'])) {
            $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");

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
        if (!empty($data['bookingId'])) {
            $conn->query("DELETE FROM booking_extras WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM booking_students_linker WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM booking_parents_linker WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM bookings WHERE booking_id = {$data['bookingId']}");
        }

        foreach ($data['studentIds'] as $studentId) {
            $conn->query("DELETE FROM booking_students WHERE student_id = $studentId");
        }

        if (!empty($data['firstParentId'])) {
            $conn->query("DELETE FROM booking_parents WHERE parent_id = {$data['firstParentId']}");
        }

        if (!empty($data['secondParentId'])) {
            $conn->query("DELETE FROM booking_parents WHERE parent_id = {$data['secondParentId']}");
        }

        if (!empty($data['authId'])) {
            $conn->query("DELETE FROM booking_auth_credentials WHERE auth_id = {$data['authId']}");
        }

    } catch (Exception $e) {
        error_log("Final cleanup failed: " . $e->getMessage());
    }
}
?>