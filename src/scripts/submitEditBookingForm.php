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
        'existingStudentIds' => [],
        'existingParentIds' => [],
        'newStudentIds' => []
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
            $errorInfo['message'] = "Prepare failed: " . $conn->error;
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
            $errorInfo['message'] = "Invalid session";
            $errorInfo['code'] = 401;
            echo json_encode($errorInfo);
            return;
        }

        $permissionRow = $permissionResult->fetch_assoc();
        $permissionLevels = explode(',', $permissionRow['permission_level']);
        $cleanPermissionLevels = array_map(function($level) {
            return intval(trim($level));
        }, $permissionLevels);
        $hasPermission = in_array(1, $cleanPermissionLevels);

        if (!$hasPermission) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = "Permission denied";
            $errorInfo['code'] = 403;
            echo json_encode($errorInfo);
            return;
        }

        $formData = [];
        $studentSections = [];

        // Parse form data
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

        // Get booking ID from form data - this is required
        if (!isset($_POST['booking_id']) || empty($_POST['booking_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking ID is required';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $data['bookingId'] = intval($_POST['booking_id']);

        // Start transaction
        $conn->autocommit(false);

        // Get auth ID from booking
        $stmt = $conn->prepare("SELECT auth_id FROM bookings WHERE booking_id = ?");
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

        $row = $result->fetch_assoc();
        $data['authId'] = $row['auth_id'];
        $stmt->close();

        // Update booking username if changed
        if (!empty($formData['Booking Username'])) {
            $bookingUsername = $formData['Booking Username'];

            // Check if the new username already exists but isn't the one we're editing
            $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id <> ?");
            $stmt->bind_param("si", $bookingUsername, $data['authId']);
            $stmt->execute();
            $usernameResult = $stmt->get_result();

            if ($usernameResult->num_rows > 0) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Username already exists. Please choose a different username.';
                $errorInfo['code'] = 409;
                $stmt->close();
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();

            // Update username
            if (!empty($formData['Booking Password'])) {
                // Update both username and password
                $bookingPassword = $formData['Booking Password'];
                $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ?, password_hash = SHA2(?, 256) WHERE auth_id = ?");
                $stmt->bind_param("ssi", $bookingUsername, $bookingPassword, $data['authId']);
            } else {
                // Update only username
                $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");
                $stmt->bind_param("si", $bookingUsername, $data['authId']);
            }

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update authentication credentials: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Get existing parent IDs and information
        $stmt = $conn->prepare(
            "SELECT p.parent_id, p.name, p.email, p.phone_number, pl.is_primary 
             FROM booking_parents p 
             JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id 
             WHERE pl.booking_id = ? 
             ORDER BY pl.is_primary DESC"
        );
        $stmt->bind_param("i", $data['bookingId']);
        $stmt->execute();
        $parentResult = $stmt->get_result();
        $existingParents = [];
        while ($parentRow = $parentResult->fetch_assoc()) {
            $data['existingParentIds'][] = $parentRow['parent_id'];
            $existingParents[] = $parentRow;
        }
        $stmt->close();

        // Get existing student IDs and information
        $stmt = $conn->prepare(
            "SELECT s.student_id, s.name, s.school_division, s.grade 
             FROM booking_students s 
             JOIN booking_students_linker sl ON s.student_id = sl.student_id 
             WHERE sl.booking_id = ?"
        );
        $stmt->bind_param("i", $data['bookingId']);
        $stmt->execute();
        $studentResult = $stmt->get_result();
        $existingStudents = [];
        while ($studentRow = $studentResult->fetch_assoc()) {
            $data['existingStudentIds'][] = $studentRow['student_id'];
            $existingStudents[] = $studentRow;
        }
        $stmt->close();

        // Update first parent (always required)
        if (empty($formData['First Parent Name'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent name is required';
            $errorInfo['code'] = 400;
            performRollback($conn);
            echo json_encode($errorInfo);
            return;
        }

        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'] ?? '';
        $firstParentPhone = $formData['First Parent Phone Number'] ?? '';

        if (count($existingParents) > 0) {
            // Update first parent
            $firstParentId = $existingParents[0]['parent_id'];
            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
            $stmt->bind_param("sssi", $firstParentName, $firstParentEmail, $firstParentPhone, $firstParentId);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update first parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        } else {
            // Insert new first parent
            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to add first parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }

            $firstParentId = $conn->insert_id;
            $stmt->close();

            // Link first parent to booking
            $isPrimary = 1;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $data['bookingId'], $firstParentId, $isPrimary);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to link first parent to booking: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Handle second parent
        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            if (count($existingParents) > 1) {
                // Update second parent
                $secondParentId = $existingParents[1]['parent_id'];
                $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
                $stmt->bind_param("sssi", $secondParentName, $secondParentEmail, $secondParentPhone, $secondParentId);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to update second parent: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $stmt->close();
                    performRollback($conn);
                    echo json_encode($errorInfo);
                    return;
                }
                $stmt->close();
            } else {
                // Insert new second parent
                $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to add second parent: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $stmt->close();
                    performRollback($conn);
                    echo json_encode($errorInfo);
                    return;
                }

                $secondParentId = $conn->insert_id;
                $stmt->close();

                // Link second parent to booking
                $isPrimary = 0;
                $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
                $stmt->bind_param("iii", $data['bookingId'], $secondParentId, $isPrimary);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link second parent to booking: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $stmt->close();
                    performRollback($conn);
                    echo json_encode($errorInfo);
                    return;
                }
                $stmt->close();
            }
        } else if (count($existingParents) > 1) {
            // Remove second parent if it existed before but not anymore
            $secondParentId = $existingParents[1]['parent_id'];

            // Remove link first
            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ? AND parent_id = ?");
            $stmt->bind_param("ii", $data['bookingId'], $secondParentId);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to remove second parent link: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();

            // Then remove parent
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $secondParentId);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to remove second parent: ' . $stmt->error;
                $errorInfo['code'] = 500;
                $stmt->close();
                performRollback($conn);
                echo json_encode($errorInfo);
                return;
            }
            $stmt->close();
        }

        // Process students
        $hasStudents = false;
        $studentCount = 0;

        foreach ($studentSections as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                $hasStudents = true;
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                $grade = $studentData['Student Grade'] ?? '';

                if ($studentCount < count($existingStudents)) {
                    // Update existing student
                    $studentId = $existingStudents[$studentCount]['student_id'];
                    $stmt = $conn->prepare("UPDATE booking_students SET name = ?, school_division = ?, grade = ? WHERE student_id = ?");
                    $stmt->bind_param("sssi", $studentName, $schoolDivision, $grade, $studentId);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to update student #' . ($studentCount + 1) . ': ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        $stmt->close();
                        performRollback($conn);
                        echo json_encode($errorInfo);
                        return;
                    }
                    $stmt->close();
                } else {
                    // Insert new student
                    $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                    $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to add student #' . ($studentCount + 1) . ': ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        $stmt->close();
                        performRollback($conn);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $studentId = $conn->insert_id;
                    $data['newStudentIds'][] = $studentId;
                    $stmt->close();

                    // Link new student to booking
                    $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                    $stmt->bind_param("ii", $data['bookingId'], $studentId);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to link student #' . ($studentCount + 1) . ' to booking: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        $stmt->close();
                        performRollback($conn);
                        echo json_encode($errorInfo);
                        return;
                    }
                    $stmt->close();
                }

                $studentCount++;
            }
        }

        // Remove any excess students
        if ($studentCount < count($existingStudents)) {
            for ($i = $studentCount; $i < count($existingStudents); $i++) {
                $studentId = $existingStudents[$i]['student_id'];

                // Remove link first
                $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ? AND student_id = ?");
                $stmt->bind_param("ii", $data['bookingId'], $studentId);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to remove student link: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $stmt->close();
                    performRollback($conn);
                    echo json_encode($errorInfo);
                    return;
                }
                $stmt->close();

                // Then remove student
                $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                $stmt->bind_param("i", $studentId);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to remove student: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    $stmt->close();
                    performRollback($conn);
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
            performRollback($conn);
            echo json_encode($errorInfo);
            return;
        }

        // Update extras information
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';

        $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?");
        $stmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $data['bookingId']);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update extras information: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $stmt->close();
            performRollback($conn);
            echo json_encode($errorInfo);
            return;
        }
        $stmt->close();

        // Commit transaction
        if (!$conn->commit()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
            $errorInfo['code'] = 500;
            performRollback($conn);
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
            performRollback($conn);
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

function performRollback($conn) {
    try {
        $conn->rollback();
    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());
    }
}
?>