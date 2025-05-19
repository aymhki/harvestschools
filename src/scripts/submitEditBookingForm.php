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
        'existingStudentIds' => [],
        'removedStudentIds' => [],
        'newStudentIds' => [],
        'extrasId' => null
    ];
    $errorInfo = [
        'success' => true,
        'message' => '',
        'code' => 0
    ];

    try {
        // 1. Validate admin session
        if (!isset($_COOKIE['harvest_schools_admin_session_id'])) {
            echo json_encode([
                'success' => false,
                'message' => "Unauthorized: No session found",
                'code' => 401
            ]);
            exit;
        }

        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database connection failed: ' . $conn->connect_error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        // 2. Verify admin permissions
        $sessionId = $_COOKIE['harvest_schools_admin_session_id'];
        $permissionSql = "SELECT u.permission_level
                          FROM admin_sessions s
                          JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                          WHERE s.id = ?";

        $stmt = $conn->prepare($permissionSql);
        $stmt->bind_param("s", $sessionId);
        $stmt->execute();
        $permissionResult = $stmt->get_result();
        $stmt->close();

        if ($permissionResult->num_rows == 0) {
            echo json_encode([
                'success' => false,
                'message' => "Invalid session",
                'code' => 401
            ]);
            exit;
        }

        $permissionRow = $permissionResult->fetch_assoc();
        $permissionLevels = explode(',', $permissionRow['permission_level']);
        $cleanPermissionLevels = array_map(function($level) {return intval(trim($level));}, $permissionLevels);
        $hasPermission = in_array(1, $cleanPermissionLevels);

        if (!$hasPermission) {
            echo json_encode([
                'success' => false,
                'message' => "Permission denied",
                'code' => 403
            ]);
            exit;
        }

        // 3. Parse form data
        if (!isset($_POST['booking_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking ID is required';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $data['bookingId'] = intval($_POST['booking_id']);

        // Parse the form data into structured arrays
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

        // 4. Begin transaction for safe updates
        $conn->autocommit(false);
        $conn->begin_transaction();

        // 5. Get existing booking data
        $bookingStmt = $conn->prepare("SELECT booking_id, auth_id FROM bookings WHERE booking_id = ?");
        $bookingStmt->bind_param("i", $data['bookingId']);
        $bookingStmt->execute();
        $bookingResult = $bookingStmt->get_result();

        if ($bookingResult->num_rows === 0) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking not found';
            $errorInfo['code'] = 404;
            echo json_encode($errorInfo);
            return;
        }

        $bookingData = $bookingResult->fetch_assoc();
        $data['authId'] = $bookingData['auth_id'];
        $bookingStmt->close();

        // 6. Get existing auth data
        $authStmt = $conn->prepare("SELECT username FROM booking_auth_credentials WHERE auth_id = ?");
        $authStmt->bind_param("i", $data['authId']);
        $authStmt->execute();
        $authResult = $authStmt->get_result();
        $authData = $authResult->fetch_assoc();
        $currentUsername = $authData['username'];
        $authStmt->close();

        // 7. Update auth credentials if username changed
        $newUsername = $formData['Booking Username'];
        $passwordChanged = !empty($formData['Booking Password']) && !empty($formData['Confirm Booking Password']);

        // Only check for username conflicts if username is being changed
        if ($newUsername !== $currentUsername) {
            $usernameCheckStmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");
            $usernameCheckStmt->bind_param("si", $newUsername, $data['authId']);
            $usernameCheckStmt->execute();
            $usernameResult = $usernameCheckStmt->get_result();

            if ($usernameResult->num_rows > 0) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Username already exists. Please choose a different username.';
                $errorInfo['code'] = 409;
                echo json_encode($errorInfo);
                return;
            }

            // Update username
            $updateUsernameSql = "UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?";
            $updateUsernameStmt = $conn->prepare($updateUsernameSql);
            $updateUsernameStmt->bind_param("si", $newUsername, $data['authId']);

            if (!$updateUsernameStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update username: ' . $updateUsernameStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            // Update any session references to maintain login state
            $updateSessionSql = "UPDATE booking_sessions SET username = ? WHERE username = ?";
            $updateSessionStmt = $conn->prepare($updateSessionSql);
            $updateSessionStmt->bind_param("ss", $newUsername, $currentUsername);
            $updateSessionStmt->execute();
        }

        // Update password if provided
        if ($passwordChanged) {
            if ($formData['Booking Password'] !== $formData['Confirm Booking Password']) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Passwords do not match';
                $errorInfo['code'] = 400;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            $newPassword = $formData['Booking Password'];
            $updatePasswordSql = "UPDATE booking_auth_credentials SET password_hash = ? WHERE auth_id = ?";
            $updatePasswordStmt = $conn->prepare($updatePasswordSql);
            $passHash = hash('sha256', $newPassword);
            $updatePasswordStmt->bind_param("si", $passHash, $data['authId']);

            if (!$updatePasswordStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update password: ' . $updatePasswordStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // 8. Get existing parents
        $parentLinkStmt = $conn->prepare("SELECT parent_id, is_primary FROM booking_parents_linker WHERE booking_id = ?");
        $parentLinkStmt->bind_param("i", $data['bookingId']);
        $parentLinkStmt->execute();
        $parentLinkResult = $parentLinkStmt->get_result();
        $existingParents = [];

        while ($parentLink = $parentLinkResult->fetch_assoc()) {
            $existingParents[] = [
                'id' => $parentLink['parent_id'],
                'is_primary' => $parentLink['is_primary']
            ];
        }

        $parentLinkStmt->close();

        // 9. Process first parent (always required)
        if (empty($formData['First Parent Name']) || empty($formData['First Parent Email']) || empty($formData['First Parent Phone Number'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent information is incomplete';
            $errorInfo['code'] = 400;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // Update first parent if exists, otherwise create
        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'];
        $firstParentPhone = $formData['First Parent Phone Number'];

        $firstParentId = null;
        foreach ($existingParents as $parent) {
            if ($parent['is_primary'] == 1) {
                $firstParentId = $parent['id'];
                break;
            }
        }

        if ($firstParentId) {
            // Update existing first parent
            $updateFirstParentSql = "UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?";
            $updateFirstParentStmt = $conn->prepare($updateFirstParentSql);
            $updateFirstParentStmt->bind_param("sssi", $firstParentName, $firstParentEmail, $firstParentPhone, $firstParentId);

            if (!$updateFirstParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update first parent: ' . $updateFirstParentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            $data['firstParentId'] = $firstParentId;
        } else {
            // Create new first parent
            $insertFirstParentSql = "INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)";
            $insertFirstParentStmt = $conn->prepare($insertFirstParentSql);
            $insertFirstParentStmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

            if (!$insertFirstParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to add first parent: ' . $insertFirstParentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            $data['firstParentId'] = $conn->insert_id;

            // Link first parent to booking
            $isPrimary = 1;
            $linkFirstParentSql = "INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)";
            $linkFirstParentStmt = $conn->prepare($linkFirstParentSql);
            $linkFirstParentStmt->bind_param("iii", $data['bookingId'], $data['firstParentId'], $isPrimary);

            if (!$linkFirstParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to link first parent: ' . $linkFirstParentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // 10. Process second parent (optional)
        $secondParentId = null;
        foreach ($existingParents as $parent) {
            if ($parent['is_primary'] == 0) {
                $secondParentId = $parent['id'];
                break;
            }
        }

        if (!empty($formData['Second Parent Name'])) {
            // Second parent provided in form
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            if ($secondParentId) {
                // Update existing second parent
                $updateSecondParentSql = "UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?";
                $updateSecondParentStmt = $conn->prepare($updateSecondParentSql);
                $updateSecondParentStmt->bind_param("sssi", $secondParentName, $secondParentEmail, $secondParentPhone, $secondParentId);

                if (!$updateSecondParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to update second parent: ' . $updateSecondParentStmt->error;
                    $errorInfo['code'] = 500;
                    $conn->rollback();
                    echo json_encode($errorInfo);
                    return;
                }

                $data['secondParentId'] = $secondParentId;
            } else {
                // Create new second parent
                $insertSecondParentSql = "INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)";
                $insertSecondParentStmt = $conn->prepare($insertSecondParentSql);
                $insertSecondParentStmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

                if (!$insertSecondParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to add second parent: ' . $insertSecondParentStmt->error;
                    $errorInfo['code'] = 500;
                    $conn->rollback();
                    echo json_encode($errorInfo);
                    return;
                }

                $data['secondParentId'] = $conn->insert_id;

                // Link second parent to booking
                $isPrimary = 0;
                $linkSecondParentSql = "INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)";
                $linkSecondParentStmt = $conn->prepare($linkSecondParentSql);
                $linkSecondParentStmt->bind_param("iii", $data['bookingId'], $data['secondParentId'], $isPrimary);

                if (!$linkSecondParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link second parent: ' . $linkSecondParentStmt->error;
                    $errorInfo['code'] = 500;
                    $conn->rollback();
                    echo json_encode($errorInfo);
                    return;
                }
            }
        } else if ($secondParentId) {
            // Second parent exists in DB but not in form - remove it
            $deleteParentLinkSql = "DELETE FROM booking_parents_linker WHERE booking_id = ? AND parent_id = ?";
            $deleteParentLinkStmt = $conn->prepare($deleteParentLinkSql);
            $deleteParentLinkStmt->bind_param("ii", $data['bookingId'], $secondParentId);

            if (!$deleteParentLinkStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to remove second parent link: ' . $deleteParentLinkStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            // Delete the parent record
            $deleteParentSql = "DELETE FROM booking_parents WHERE parent_id = ?";
            $deleteParentStmt = $conn->prepare($deleteParentSql);
            $deleteParentStmt->bind_param("i", $secondParentId);

            if (!$deleteParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to delete second parent: ' . $deleteParentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // 11. Get existing students
        $studentLinkStmt = $conn->prepare("SELECT student_id FROM booking_students_linker WHERE booking_id = ?");
        $studentLinkStmt->bind_param("i", $data['bookingId']);
        $studentLinkStmt->execute();
        $studentLinkResult = $studentLinkStmt->get_result();
        $existingStudentIds = [];

        while ($studentLink = $studentLinkResult->fetch_assoc()) {
            $existingStudentIds[] = $studentLink['student_id'];
        }

        $studentLinkStmt->close();

        // 12. Process students from form
        $submittedStudentIds = [];
        $hasStudents = false;

        foreach ($studentSections as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                $hasStudents = true;
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                $grade = $studentData['Student Grade'] ?? '';
                $studentId = !empty($studentData['Student ID']) ? intval($studentData['Student ID']) : 0;

                if ($studentId > 0 && in_array($studentId, $existingStudentIds)) {
                    // Update existing student
                    $updateStudentSql = "UPDATE booking_students SET name = ?, school_division = ?, grade = ? WHERE student_id = ?";
                    $updateStudentStmt = $conn->prepare($updateStudentSql);
                    $updateStudentStmt->bind_param("sssi", $studentName, $schoolDivision, $grade, $studentId);

                    if (!$updateStudentStmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to update student #' . ($index + 1) . ': ' . $updateStudentStmt->error;
                        $errorInfo['code'] = 500;
                        $conn->rollback();
                        echo json_encode($errorInfo);
                        return;
                    }

                    $submittedStudentIds[] = $studentId;
                } else {
                    // Create new student
                    $insertStudentSql = "INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)";
                    $insertStudentStmt = $conn->prepare($insertStudentSql);
                    $insertStudentStmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                    if (!$insertStudentStmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to add student #' . ($index + 1) . ': ' . $insertStudentStmt->error;
                        $errorInfo['code'] = 500;
                        $conn->rollback();
                        echo json_encode($errorInfo);
                        return;
                    }

                    $newStudentId = $conn->insert_id;
                    $submittedStudentIds[] = $newStudentId;

                    // Link new student to booking
                    $linkStudentSql = "INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)";
                    $linkStudentStmt = $conn->prepare($linkStudentSql);
                    $linkStudentStmt->bind_param("ii", $data['bookingId'], $newStudentId);

                    if (!$linkStudentStmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ': ' . $linkStudentStmt->error;
                        $errorInfo['code'] = 500;
                        $conn->rollback();
                        echo json_encode($errorInfo);
                        return;
                    }
                }
            }
        }

        // Ensure there's at least one student
        if (!$hasStudents) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'At least one student is required';
            $errorInfo['code'] = 400;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // 13. Remove students that were in DB but not in form
        $studentsToRemove = array_diff($existingStudentIds, $submittedStudentIds);
        foreach ($studentsToRemove as $studentId) {
            // Remove link
            $unlinkStudentSql = "DELETE FROM booking_students_linker WHERE booking_id = ? AND student_id = ?";
            $unlinkStudentStmt = $conn->prepare($unlinkStudentSql);
            $unlinkStudentStmt->bind_param("ii", $data['bookingId'], $studentId);

            if (!$unlinkStudentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to remove student link: ' . $unlinkStudentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }

            // Delete student record
            $deleteStudentSql = "DELETE FROM booking_students WHERE student_id = ?";
            $deleteStudentStmt = $conn->prepare($deleteStudentSql);
            $deleteStudentStmt->bind_param("i", $studentId);

            if (!$deleteStudentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to delete student: ' . $deleteStudentStmt->error;
                $errorInfo['code'] = 500;
                $conn->rollback();
                echo json_encode($errorInfo);
                return;
            }
        }

        // 14. Update extras information
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';

        $updateExtrasSql = "UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?";
        $updateExtrasStmt = $conn->prepare($updateExtrasSql);
        $updateExtrasStmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $data['bookingId']);

        if (!$updateExtrasStmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update extras: ' . $updateExtrasStmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // 15. Commit transaction
        if (!$conn->commit()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        // 16. Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Booking updated successfully',
            'booking_id' => $data['bookingId']
        ]);

    } catch (Exception $e) {
        if (isset($conn) && $conn->ping()) {
            $conn->rollback();
        }

        echo json_encode([
            'success' => false,
            'message' => 'An error occurred: ' . $e->getMessage(),
            'code' => 500
        ]);
    } finally {
        if (isset($conn) && $conn->ping()) {
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