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
        'originalUsername' => null,
        'existingParentIds' => [],
        'existingStudentIds' => [],
        'updatedParentIds' => [],
        'updatedStudentIds' => [],
        'removedParentIds' => [],
        'removedStudentIds' => [],
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

        // Validate booking ID
        if (!isset($_POST['booking_id']) || empty($_POST['booking_id'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking ID is required for editing';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $bookingId = intval($_POST['booking_id']);
        $data['bookingId'] = $bookingId;

        $conn->autocommit(false);

        // Fetch current booking data
        $bookingQuery = "SELECT b.booking_id, b.auth_id, a.username 
                        FROM bookings b 
                        JOIN booking_auth_credentials a ON b.auth_id = a.auth_id 
                        WHERE b.booking_id = ?";
        $stmt = $conn->prepare($bookingQuery);

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
            $errorInfo['message'] = 'Database error fetching booking: ' . $stmt->error;
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
        $data['authId'] = $bookingData['auth_id'];
        $data['originalUsername'] = $bookingData['username'];

        // 1. Update auth credentials if username changed
        if (!empty($formData['Booking Username']) && $formData['Booking Username'] !== $data['originalUsername']) {
            // Check if new username already exists
            $checkUsernameStmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");
            $checkUsernameStmt->bind_param("si", $formData['Booking Username'], $data['authId']);
            $checkUsernameStmt->execute();
            $usernameResult = $checkUsernameStmt->get_result();

            if ($usernameResult->num_rows > 0) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Username already exists. Please choose a different username.';
                $errorInfo['code'] = 409;
                echo json_encode($errorInfo);
                return;
            }

            // Update username
            $updateAuthStmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");
            $updateAuthStmt->bind_param("si", $formData['Booking Username'], $data['authId']);

            if (!$updateAuthStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update username: ' . $updateAuthStmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
        }

        // 2. Update password if provided
        if (!empty($formData['Booking Password']) && !empty($formData['Confirm Booking Password'])) {
            if ($formData['Booking Password'] !== $formData['Confirm Booking Password']) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Passwords do not match';
                $errorInfo['code'] = 400;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $updatePasswordStmt = $conn->prepare("UPDATE booking_auth_credentials SET password_hash = SHA2(?, 256) WHERE auth_id = ?");
            $updatePasswordStmt->bind_param("si", $formData['Booking Password'], $data['authId']);

            if (!$updatePasswordStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to update password: ' . $updatePasswordStmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }
        }

        // 3. Get existing parents
        $parentsQuery = "SELECT p.parent_id, pl.is_primary 
                        FROM booking_parents p 
                        JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id 
                        WHERE pl.booking_id = ?";
        $parentsStmt = $conn->prepare($parentsQuery);
        $parentsStmt->bind_param("i", $bookingId);
        $parentsStmt->execute();
        $parentsResult = $parentsStmt->get_result();

        $existingPrimaryParentId = null;
        $existingSecondaryParentId = null;

        while ($parentRow = $parentsResult->fetch_assoc()) {
            if ($parentRow['is_primary'] == 1) {
                $existingPrimaryParentId = $parentRow['parent_id'];
            } else {
                $existingSecondaryParentId = $parentRow['parent_id'];
            }
            $data['existingParentIds'][] = $parentRow['parent_id'];
        }

        // 4. Update first parent
        if (!empty($formData['First Parent Name'])) {
            $firstParentName = $formData['First Parent Name'];
            $firstParentEmail = $formData['First Parent Email'] ?? '';
            $firstParentPhone = $formData['First Parent Phone Number'] ?? '';

            if ($existingPrimaryParentId) {
                // Update existing primary parent
                $updateParentStmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
                $updateParentStmt->bind_param("sssi", $firstParentName, $firstParentEmail, $firstParentPhone, $existingPrimaryParentId);

                if (!$updateParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to update first parent: ' . $updateParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $data['updatedParentIds'][] = $existingPrimaryParentId;
            } else {
                // Insert new primary parent
                $insertParentStmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
                $insertParentStmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

                if (!$insertParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to insert first parent: ' . $insertParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $newPrimaryParentId = $conn->insert_id;
                $data['updatedParentIds'][] = $newPrimaryParentId;

                // Link new primary parent to booking
                $linkParentStmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, 1)");
                $linkParentStmt->bind_param("ii", $bookingId, $newPrimaryParentId);

                if (!$linkParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link first parent to booking: ' . $linkParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
            }
        } else {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'First parent information is required';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        // 5. Update or remove second parent
        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            if ($existingSecondaryParentId) {
                // Update existing secondary parent
                $updateParentStmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
                $updateParentStmt->bind_param("sssi", $secondParentName, $secondParentEmail, $secondParentPhone, $existingSecondaryParentId);

                if (!$updateParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to update second parent: ' . $updateParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $data['updatedParentIds'][] = $existingSecondaryParentId;
            } else {
                // Insert new secondary parent
                $insertParentStmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
                $insertParentStmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

                if (!$insertParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to insert second parent: ' . $insertParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $newSecondaryParentId = $conn->insert_id;
                $data['updatedParentIds'][] = $newSecondaryParentId;

                // Link new secondary parent to booking
                $linkParentStmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, 0)");
                $linkParentStmt->bind_param("ii", $bookingId, $newSecondaryParentId);

                if (!$linkParentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link second parent to booking: ' . $linkParentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
            }
        } else if ($existingSecondaryParentId) {
            // Remove existing secondary parent link
            $unlinkParentStmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ? AND parent_id = ?");
            $unlinkParentStmt->bind_param("ii", $bookingId, $existingSecondaryParentId);

            if (!$unlinkParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to unlink second parent: ' . $unlinkParentStmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            // Delete the parent record
            $deleteParentStmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $deleteParentStmt->bind_param("i", $existingSecondaryParentId);

            if (!$deleteParentStmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Failed to delete second parent: ' . $deleteParentStmt->error;
                $errorInfo['code'] = 500;
                performRollback($conn, $data);
                echo json_encode($errorInfo);
                return;
            }

            $data['removedParentIds'][] = $existingSecondaryParentId;
        }

        // 6. Get existing students
        $studentsQuery = "SELECT s.student_id, s.name, s.school_division, s.grade 
                         FROM booking_students s 
                         JOIN booking_students_linker sl ON s.student_id = sl.student_id 
                         WHERE sl.booking_id = ?";
        $studentsStmt = $conn->prepare($studentsQuery);
        $studentsStmt->bind_param("i", $bookingId);
        $studentsStmt->execute();
        $studentsResult = $studentsStmt->get_result();

        $existingStudents = [];
        while ($studentRow = $studentsResult->fetch_assoc()) {
            $existingStudents[$studentRow['student_id']] = $studentRow;
            $data['existingStudentIds'][] = $studentRow['student_id'];
        }

        // 7. Process student sections
        $processedStudentIds = [];
        if (empty($studentSections)) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'At least one student is required';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        foreach ($studentSections as $index => $studentData) {
            if (empty($studentData['Student Name'])) {
                continue; // Skip empty student sections
            }

            $studentName = $studentData['Student Name'];
            $schoolDivision = $studentData['Student School Division'] ?? 'IGCSE';
            $grade = $studentData['Student Grade'] ?? '';

            // Check if this is an existing student or a new one
            $existingStudentId = null;

            // If student section has a student ID field, use it to identify existing students
            if (!empty($studentData['student-section']) && is_numeric($studentData['student-section'])) {
                $existingStudentId = intval($studentData['student-section']);
                if (!isset($existingStudents[$existingStudentId])) {
                    $existingStudentId = null; // Reset if the ID doesn't match any existing student
                }
            }

            if ($existingStudentId) {
                // Update existing student
                $updateStudentStmt = $conn->prepare("UPDATE booking_students SET name = ?, school_division = ?, grade = ? WHERE student_id = ?");
                $updateStudentStmt->bind_param("sssi", $studentName, $schoolDivision, $grade, $existingStudentId);

                if (!$updateStudentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to update student #' . ($index + 1) . ': ' . $updateStudentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $processedStudentIds[] = $existingStudentId;
                $data['updatedStudentIds'][] = $existingStudentId;
            } else {
                // Insert new student
                $insertStudentStmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                $insertStudentStmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                if (!$insertStudentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to insert student #' . ($index + 1) . ': ' . $insertStudentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $newStudentId = $conn->insert_id;
                $processedStudentIds[] = $newStudentId;
                $data['updatedStudentIds'][] = $newStudentId;

                // Link new student to booking
                $linkStudentStmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $linkStudentStmt->bind_param("ii", $bookingId, $newStudentId);

                if (!$linkStudentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ' to booking: ' . $linkStudentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
            }
        }

        // 8. Remove any students that weren't processed
        foreach ($data['existingStudentIds'] as $studentId) {
            if (!in_array($studentId, $processedStudentIds)) {
                // Unlink student
                $unlinkStudentStmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ? AND student_id = ?");
                $unlinkStudentStmt->bind_param("ii", $bookingId, $studentId);

                if (!$unlinkStudentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to unlink student: ' . $unlinkStudentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                // Delete student
                $deleteStudentStmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                $deleteStudentStmt->bind_param("i", $studentId);

                if (!$deleteStudentStmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Failed to delete student: ' . $deleteStudentStmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $data['removedStudentIds'][] = $studentId;
            }
        }

        // Verify we have at least one student
        if (empty($processedStudentIds)) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'At least one student is required';
            $errorInfo['code'] = 400;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        // 9. Update extras
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';

        $updateExtrasStmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?");
        $updateExtrasStmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $bookingId);

        if (!$updateExtrasStmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update extras: ' . $updateExtrasStmt->error;
            $errorInfo['code'] = 500;
            performRollback($conn, $data);
            echo json_encode($errorInfo);
            return;
        }

        // Commit all changes
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

function performRollback($conn, $data) {
    try {
        $conn->rollback();
    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());
    }
}
?>