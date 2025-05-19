<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = null;
    $errorInfo = [
        'success' => true,
        'message' => '',
        'code' => 0
    ];

    try {
        // Check for session
        if (!isset($_COOKIE['harvest_schools_admin_session_id'])) {
            throw new Exception('Unauthorized: No session found', 401);
        }

        $sessionId = $_COOKIE['harvest_schools_admin_session_id'];

        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            throw new Exception('Database connection failed: ' . $conn->connect_error, 500);
        }

        // Validate session and permissions
        $stmt = $conn->prepare("SELECT u.permission_level
                              FROM admin_sessions s
                              JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                              WHERE s.id = ?");

        if (!$stmt) {
            throw new Exception('Database error preparing statement: ' . $conn->error, 500);
        }

        $stmt->bind_param("s", $sessionId);
        $stmt->execute();
        $permissionResult = $stmt->get_result();
        $stmt->close();

        if ($permissionResult->num_rows == 0) {
            throw new Exception('Invalid session', 401);
        }

        $permissionRow = $permissionResult->fetch_assoc();
        $permissionLevels = explode(',', $permissionRow['permission_level']);

        $cleanPermissionLevels = array_map(function($level) {
            return intval(trim($level));
        }, $permissionLevels);
        $hasPermission = in_array(1, $cleanPermissionLevels);

        if (!$hasPermission) {
            throw new Exception('Permission denied', 403);
        }

        // Parse form data
        $formData = [];
        $studentSections = [];
        $bookingId = null;

        // First extract booking ID which should be passed as a hidden field
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($_POST[$labelKey]) && $_POST[$labelKey] === 'booking-id') {
                    $bookingId = intval($value);
                    break;
                }
            }
        }

        if (!$bookingId) {
            throw new Exception('Booking ID is required', 400);
        }

        // Continue parsing other form data
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

        // Start transaction
        $conn->autocommit(false);

        // Get existing booking data
        $existingBookingData = getExistingBookingData($conn, $bookingId);

        if (!$existingBookingData) {
            throw new Exception('Booking not found', 404);
        }

        $authId = $existingBookingData['auth_id'];
        $oldUsername = $existingBookingData['username'];

        // 1. Update auth credentials if needed
        $bookingUsername = $formData['Booking Username'];
        $bookingPassword = $formData['Booking Password'] ?? '';

        // Check if username is being changed and if so, ensure it's not already taken
        if ($bookingUsername !== $oldUsername) {
            $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");
            $stmt->bind_param("si", $bookingUsername, $authId);
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();

            if ($result->num_rows > 0) {
                throw new Exception('Username already exists. Please choose a different username.', 409);
            }

            // Update username
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");
            $stmt->bind_param("si", $bookingUsername, $authId);

            if (!$stmt->execute()) {
                throw new Exception('Failed to update username: ' . $stmt->error, 500);
            }
            $stmt->close();
        }

        // Update password only if provided
        if (!empty($bookingPassword)) {
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET password_hash = SHA2(?, 256) WHERE auth_id = ?");
            $stmt->bind_param("si", $bookingPassword, $authId);

            if (!$stmt->execute()) {
                throw new Exception('Failed to update password: ' . $stmt->error, 500);
            }
            $stmt->close();
        }

        // 2. Update parents
        $existingParents = $existingBookingData['parents'];
        $firstParentName = $formData['First Parent Name'] ?? '';
        $firstParentEmail = $formData['First Parent Email'] ?? '';
        $firstParentPhone = $formData['First Parent Phone Number'] ?? '';
        $secondParentName = $formData['Second Parent Name'] ?? '';
        $secondParentEmail = $formData['Second Parent Email'] ?? '';
        $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

        // Check if first parent info is complete (required)
        if (empty($firstParentName)) {
            throw new Exception('First parent name is required', 400);
        }

        // Handle first parent (always required)
        if (!empty($existingParents) && isset($existingParents[0])) {
            // Update existing first parent
            $firstParentId = $existingParents[0]['parent_id'];

            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
            $stmt->bind_param("sssi", $firstParentName, $firstParentEmail, $firstParentPhone, $firstParentId);

            if (!$stmt->execute()) {
                throw new Exception('Failed to update first parent: ' . $stmt->error, 500);
            }
            $stmt->close();
        } else {
            // Insert new first parent (shouldn't happen normally)
            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);

            if (!$stmt->execute()) {
                throw new Exception('Failed to add first parent: ' . $stmt->error, 500);
            }

            $firstParentId = $conn->insert_id;
            $stmt->close();

            $isPrimary = 1;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $bookingId, $firstParentId, $isPrimary);

            if (!$stmt->execute()) {
                throw new Exception('Failed to link first parent to booking: ' . $stmt->error, 500);
            }
            $stmt->close();
        }

        // Handle second parent (optional)
        if (!empty($secondParentName)) {
            // Second parent provided in form
            if (!empty($existingParents) && isset($existingParents[1])) {
                // Update existing second parent
                $secondParentId = $existingParents[1]['parent_id'];

                $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");
                $stmt->bind_param("sssi", $secondParentName, $secondParentEmail, $secondParentPhone, $secondParentId);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to update second parent: ' . $stmt->error, 500);
                }
                $stmt->close();
            } else {
                // Insert new second parent
                $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to add second parent: ' . $stmt->error, 500);
                }

                $secondParentId = $conn->insert_id;
                $stmt->close();

                $isPrimary = 0;
                $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
                $stmt->bind_param("iii", $bookingId, $secondParentId, $isPrimary);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to link second parent to booking: ' . $stmt->error, 500);
                }
                $stmt->close();
            }
        } else if (!empty($existingParents) && isset($existingParents[1])) {
            // Second parent was removed, delete the record
            $secondParentId = $existingParents[1]['parent_id'];

            // First remove from linker table
            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ? AND parent_id = ?");
            $stmt->bind_param("ii", $bookingId, $secondParentId);

            if (!$stmt->execute()) {
                throw new Exception('Failed to unlink second parent: ' . $stmt->error, 500);
            }
            $stmt->close();

            // Then delete the parent record
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $secondParentId);

            if (!$stmt->execute()) {
                throw new Exception('Failed to delete second parent: ' . $stmt->error, 500);
            }
            $stmt->close();
        }

        // 3. Handle students
        $existingStudents = $existingBookingData['students'];
        $existingStudentCount = count($existingStudents);
        $newStudentCount = count($studentSections);

        // We need at least one student
        if ($newStudentCount === 0) {
            throw new Exception('At least one student is required', 400);
        }

        // Process each student section
        foreach ($studentSections as $index => $studentData) {
            if (empty($studentData['Student Name'])) {
                throw new Exception('Student name is required for all students', 400);
            }

            $studentName = $studentData['Student Name'];
            $schoolDivision = $studentData['Student School Division'] ?? 'Other';
            $grade = $studentData['Student Grade'] ?? '';
            $studentId = $studentData['Student Section'] ?? null; // This field should contain student_id

            if ($studentId && $index < $existingStudentCount) {
                // Update existing student
                $stmt = $conn->prepare("UPDATE booking_students SET name = ?, school_division = ?, grade = ? WHERE student_id = ?");
                $stmt->bind_param("sssi", $studentName, $schoolDivision, $grade, $studentId);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to update student #' . ($index + 1) . ': ' . $stmt->error, 500);
                }
                $stmt->close();
            } else {
                // Create new student
                $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to add student #' . ($index + 1) . ': ' . $stmt->error, 500);
                }

                $studentId = $conn->insert_id;
                $stmt->close();

                // Link student to booking
                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $bookingId, $studentId);

                if (!$stmt->execute()) {
                    throw new Exception('Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error, 500);
                }
                $stmt->close();
            }
        }

        // Remove students that were deleted from the form
        if ($newStudentCount < $existingStudentCount) {
            $studentIdsToKeep = [];

            foreach ($studentSections as $studentData) {
                if (isset($studentData['Student Section']) && is_numeric($studentData['Student Section'])) {
                    $studentIdsToKeep[] = intval($studentData['Student Section']);
                }
            }

            foreach ($existingStudents as $student) {
                $studentId = $student['student_id'];

                if (!in_array($studentId, $studentIdsToKeep)) {
                    // Remove from linker first
                    $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ? AND student_id = ?");
                    $stmt->bind_param("ii", $bookingId, $studentId);

                    if (!$stmt->execute()) {
                        throw new Exception('Failed to unlink removed student: ' . $stmt->error, 500);
                    }
                    $stmt->close();

                    // Then delete the student
                    $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                    $stmt->bind_param("i", $studentId);

                    if (!$stmt->execute()) {
                        throw new Exception('Failed to delete removed student: ' . $stmt->error, 500);
                    }
                    $stmt->close();
                }
            }
        }

        // 4. Update extras
        $cdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : 0;
        $additionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : 0;
        $paymentStatus = $formData['Extras Payment Status'] ?? 'Not Signed Up';

        $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE booking_id = ?");
        $stmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $bookingId);

        if (!$stmt->execute()) {
            throw new Exception('Failed to update extras: ' . $stmt->error, 500);
        }
        $stmt->close();

        // Commit all changes
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Booking updated successfully',
            'code' => 200,
            'booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
        if ($conn !== null && !$conn->connect_error) {
            $conn->rollback();
        }

        $errorInfo['success'] = false;
        $errorInfo['message'] = $e->getMessage();
        $errorInfo['code'] = $e->getCode() ?: 500;
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
 * Get all existing booking data including related records
 */
function getExistingBookingData($conn, $bookingId) {
    $data = [
        'booking_id' => $bookingId,
        'auth_id' => null,
        'username' => null,
        'parents' => [],
        'students' => [],
        'extras' => []
    ];

    // Get booking and auth info
    $stmt = $conn->prepare("
        SELECT b.booking_id, b.auth_id, b.status, b.notes, a.username 
        FROM bookings b
        JOIN booking_auth_credentials a ON b.auth_id = a.auth_id
        WHERE b.booking_id = ?
    ");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return null;
    }

    $row = $result->fetch_assoc();
    $data['auth_id'] = $row['auth_id'];
    $data['username'] = $row['username'];
    $data['status'] = $row['status'];
    $data['notes'] = $row['notes'];
    $stmt->close();

    // Get parents
    $stmt = $conn->prepare("
        SELECT p.parent_id, p.name, p.email, p.phone_number, pl.is_primary
        FROM booking_parents p
        JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
        WHERE pl.booking_id = ?
        ORDER BY pl.is_primary DESC
    ");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $data['parents'][] = $row;
    }
    $stmt->close();

    // Get students
    $stmt = $conn->prepare("
        SELECT s.student_id, s.name, s.school_division, s.grade
        FROM booking_students s
        JOIN booking_students_linker sl ON s.student_id = sl.student_id
        WHERE sl.booking_id = ?
    ");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $data['students'][] = $row;
    }
    $stmt->close();

    // Get extras
    $stmt = $conn->prepare("
        SELECT cd_count, additional_attendees, payment_status
        FROM booking_extras
        WHERE booking_id = ?
    ");
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $data['extras'] = $result->fetch_assoc();
    }
    $stmt->close();

    return $data;
}
?>