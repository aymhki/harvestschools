<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = null;
    $data = [
        'bookingId' => null,
        'authId' => null,
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
        // Check for admin session
        if (!isset($_COOKIE['harvest_schools_admin_session_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Unauthorized: No session found';
            $errorInfo['code'] = 401;
            echo json_encode($errorInfo);
            return;
        }

        $sessionId = $_COOKIE['harvest_schools_admin_session_id'];

        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database connection failed: ' . $conn->connect_error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        // Verify admin permission
        $permissionSql = "SELECT u.permission_level
                         FROM admin_sessions s
                         JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                         WHERE s.id = ?";
        $stmt = $conn->prepare($permissionSql);
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("s", $sessionId);
        $stmt->execute();
        $permissionResult = $stmt->get_result();
        $stmt->close();

        if ($permissionResult->num_rows === 0) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Invalid session';
            $errorInfo['code'] = 401;
            echo json_encode($errorInfo);
            return;
        }

        $permissionRow = $permissionResult->fetch_assoc();
        $permissionLevels = explode(',', $permissionRow['permission_level']);
        $cleanPermissionLevels = array_map(function($level) {return intval(trim($level));}, $permissionLevels);
        $hasPermission = in_array(1, $cleanPermissionLevels);

        if (!$hasPermission) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Permission denied';
            $errorInfo['code'] = 403;
            echo json_encode($errorInfo);
            return;
        }

        // Parse form data
        $formData = [];
        $studentSections = [];

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;
                $instanceKey = 'instance_' . $fieldId;
                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    if (isset($_POST[$instanceKey])) {
                        $instanceId = $_POST[$instanceKey];
                        if (strpos($instanceId, 'student-section') === 0) {
                            $sectionNumber = substr($instanceId, strrpos($instanceId, '_') + 1);
                            if (!isset($studentSections[$sectionNumber])) {
                                $studentSections[$sectionNumber] = [];
                            }
                            $studentSections[$sectionNumber][$label] = $value;
                        }
                    } else {
                        $formData[$label] = $value;
                    }
                }
            }
        }

        // Get booking ID from form data or hidden field
        if (!isset($_POST['booking_id']) || !is_numeric($_POST['booking_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Invalid or missing booking ID';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $data['bookingId'] = (int)$_POST['booking_id'];

        $conn->autocommit(false);

        // Get existing booking data
        $stmt = $conn->prepare("SELECT * FROM bookings WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $data['bookingId']);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to retrieve booking information: ' . $stmt->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking not found';
            $errorInfo['code'] = 404;
            echo json_encode($errorInfo);
            return;
        }

        $bookingInfo = $result->fetch_assoc();
        $data['authId'] = $bookingInfo['auth_id'];

        // Get auth credentials
        $stmt = $conn->prepare("SELECT username FROM booking_auth_credentials WHERE auth_id = ?");
        $stmt->bind_param("i", $data['authId']);
        $stmt->execute();
        $result = $stmt->get_result();
        $authData = $result->fetch_assoc();
        $currentUsername = $authData['username'];

        // Verify username from form
        if (empty($formData['Booking Username'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Username is required';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $bookingUsername = $formData['Booking Username'];

        // If username changed, check if it already exists
        if ($bookingUsername !== $currentUsername) {
            $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");
            $stmt->bind_param("si", $bookingUsername, $data['authId']);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Username already exists. Please choose a different username.';
                $errorInfo['code'] = 409;
                echo json_encode($errorInfo);
                return;
            }
        }

        // Delete existing students
        $stmt = $conn->prepare("SELECT student_id FROM booking_students_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $data['bookingId']);
        $stmt->execute();
        $result = $stmt->get_result();
        $existingStudentIds = [];

        while ($row = $result->fetch_assoc()) {
            $existingStudentIds[] = $row['student_id'];
        }

        $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $data['bookingId']);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update student links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        foreach ($existingStudentIds as $studentId) {
            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
            $stmt->bind_param("i", $studentId);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update students: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // Delete existing parents
        $stmt = $conn->prepare("SELECT parent_id FROM booking_parents_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $data['bookingId']);
        $stmt->execute();
        $result = $stmt->get_result();
        $existingParentIds = [];

        while ($row = $result->fetch_assoc()) {
            $existingParentIds[] = $row['parent_id'];
        }

        $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $data['bookingId']);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update parent links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        foreach ($existingParentIds as $parentId) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $parentId);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update parents: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // Update auth credentials - username always, password only if provided
        if (!empty($formData['Booking Password'])) {
            // Password provided, update both username and password
            $bookingPassword = $formData['Booking Password'];
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ?, password_hash = SHA2(?, 256) WHERE auth_id = ?");
            $stmt->bind_param("ssi", $bookingUsername, $bookingPassword, $data['authId']);
        } else {
            // No password provided, update only username
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");
            $stmt->bind_param("si", $bookingUsername, $data['authId']);
        }

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update authentication credentials: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // Add first parent
        if (empty($formData['First Parent Name'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent information is required';
            $errorInfo['code'] = 400;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'] ?? '';
        $firstParentPhone = $formData['First Parent Phone Number'] ?? '';

        $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to add first parent: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        $data['firstParentId'] = $conn->insert_id;
        $isPrimary = 1;

        $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $data['bookingId'], $data['firstParentId'], $isPrimary);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to link first parent to booking: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // Add second parent if provided
        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to add second parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            $data['secondParentId'] = $conn->insert_id;
            $isPrimary = 0;

            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $data['bookingId'], $data['secondParentId'], $isPrimary);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to link second parent to booking: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // Add students
        $hasStudents = false;

        foreach ($studentSections as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                $hasStudents = true;
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'IGCSE';
                $grade = $studentData['Student Grade'] ?? '';

                $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to add student #' . ($index + 1) . ': ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $conn->rollback();
                    echo json_encode($errorInfo);
                    return;
                }

                $studentId = $conn->insert_id;
                $data['studentIds'][] = $studentId;

                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $data['bookingId'], $studentId);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $conn->rollback();
                    echo json_encode($errorInfo);
                    return;
                }
            }
        }

        if (!$hasStudents) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'At least one student is required';
            $errorInfo['code'] = 400;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // Update extras
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';

        $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?");
        $stmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $data['bookingId']);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update extras information: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // Commit the transaction
        if (!$conn->commit()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Booking updated successfully',
            'code' => 200,
            'booking_id' => $data['bookingId']
        ]);

    } catch (Exception $e) {
        $errorInfo['success'] = false;
        $errorInfo['message'] = 'An unexpected error occurred: ' . $e->getMessage();
        $errorInfo['code'] = 500;

        if ($conn !== null && !$conn->connect_error) {
            $conn->rollback();
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
?>