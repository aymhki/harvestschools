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
        'authId' => null,
        'bookingId' => null,
        'studentIds' => [],
    ];
    $errorInfo = [
        'success' => true,
        'message' => '',
        'code' => 0
    ];

    try {
        // Check admin authorization
        if (!isset($_COOKIE['harvest_schools_admin_session_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Unauthorized: No session found';
            $errorInfo['code'] = 401;
            echo json_encode($errorInfo);
            return;
        }

        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database connection failed: ' . $conn->connect_error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        // Verify admin permissions
        $sessionId = $_COOKIE['harvest_schools_admin_session_id'];
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

        if ($permissionResult->num_rows == 0) {
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
        $bookingId = null;

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;
                $instanceKey = 'instance_' . $fieldId;

                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];

                    // Check if this is the booking_id field
                    if ($label === 'booking-id') {
                        $bookingId = intval($value);
                        continue;
                    }

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

        // Ensure we have a booking ID
        if (empty($bookingId)) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Missing booking ID';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $conn->autocommit(false);

        // Get existing booking information
        $stmt = $conn->prepare("SELECT auth_id FROM bookings WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error retrieving booking: ' . $stmt->error;
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

        $bookingData = $result->fetch_assoc();
        $authId = $bookingData['auth_id'];
        $data['authId'] = $authId;
        $data['bookingId'] = $bookingId;
        $stmt->close();

        // Update username if provided
        if (!empty($formData['Booking Username'])) {
            $bookingUsername = $formData['Booking Username'];

            // Check if username exists but belongs to a different auth_id
            $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");
            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("si", $bookingUsername, $authId);
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
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            // Update username
            if (!empty($formData['Booking Password']) && !empty($formData['Confirm Booking Password'])) {
                // Update both username and password
                $bookingPassword = $formData['Booking Password'];
                $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ?, password_hash = SHA2(?, 256) WHERE auth_id = ?");
                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("ssi", $bookingUsername, $bookingPassword, $authId);
            } else {
                // Update only username
                $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");
                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("si", $bookingUsername, $authId);
            }

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update authentication credentials: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        } else if (!empty($formData['Booking Password']) && !empty($formData['Confirm Booking Password'])) {
            // Update password only
            $bookingPassword = $formData['Booking Password'];
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET password_hash = SHA2(?, 256) WHERE auth_id = ?");
            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("si", $bookingPassword, $authId);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update password: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Delete and recreate parents
        // First, get all parent IDs linked to this booking
        $stmt = $conn->prepare("SELECT parent_id FROM booking_parents_linker WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error retrieving parent links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $parentIdsResult = $stmt->get_result();
        $parentIds = [];
        while ($row = $parentIdsResult->fetch_assoc()) {
            $parentIds[] = $row['parent_id'];
        }
        $stmt->close();

        // Delete parent links
        $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error deleting parent links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }
        $stmt->close();

        // Delete parents
        foreach ($parentIds as $parentId) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("i", $parentId);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error deleting parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Add first parent
        if (empty($formData['First Parent Name']) || empty($formData['First Parent Email']) || empty($formData['First Parent Phone Number'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent information is incomplete';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'];
        $firstParentPhone = $formData['First Parent Phone Number'];
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

        $firstParentId = $conn->insert_id;
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

        $stmt->bind_param("iii", $bookingId, $firstParentId, $isPrimary);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to link first parent to booking: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }
        $stmt->close();

        // Add second parent if provided
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

            $secondParentId = $conn->insert_id;
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

            $stmt->bind_param("iii", $bookingId, $secondParentId, $isPrimary);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to link second parent to booking: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Delete and recreate students
        // First, get all student IDs linked to this booking
        $stmt = $conn->prepare("SELECT student_id FROM booking_students_linker WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error retrieving student links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $studentIdsResult = $stmt->get_result();
        $studentIds = [];
        while ($row = $studentIdsResult->fetch_assoc()) {
            $studentIds[] = $row['student_id'];
        }
        $stmt->close();

        // Delete student links
        $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error deleting student links: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }
        $stmt->close();

        // Delete students
        foreach ($studentIds as $studentId) {
            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("i", $studentId);
            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Database error deleting student: ' . $stmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Add new students
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

                $stmt->bind_param("ii", $bookingId, $studentId);
                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
                $stmt->close();
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

        // Update extras
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';
        $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $bookingId);
        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update extras record: ' . $stmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }
        $stmt->close();

        // Commit the transaction
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
            'message' => 'Booking updated successfully',
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

/**
 * Rolls back changes in case of an error
 */
function performRollback($conn, $data) {
    try {
        $conn->rollback();
    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());
    }
}
?>