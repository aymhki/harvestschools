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
        'firstParentId' => null,
        'secondParentId' => null,
        'studentIds' => [],
        'extrasId' => null
    ];

    try {
        // Initialize database connection
        $conn = new mysqli($servername, $username, $password, $dbname);
        if ($conn->connect_error) {
            throw new Exception('Database connection failed: ' . $conn->connect_error);
        }

        // Process form data
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

        // Start a single transaction for the entire process
        $conn->autocommit(false);

        // 1. Insert auth credentials
        $bookingUsername = $formData['Booking Username'];
        $bookingPassword = $formData['Booking Password'];

        // Check if username already exists
        $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ?");
        $stmt->bind_param("s", $bookingUsername);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            throw new Exception('Username already exists. Please choose a different username.');
        }

        // Insert auth credentials
        $stmt = $conn->prepare("INSERT INTO booking_auth_credentials (username, password_hash) VALUES (?, SHA2(?, 256))");
        $stmt->bind_param("ss", $bookingUsername, $bookingPassword);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create authentication record: ' . $stmt->error);
        }
        $data['authId'] = $conn->insert_id;

        // 2. Insert booking
        $stmt = $conn->prepare("INSERT INTO bookings (auth_id) VALUES (?)");
        $stmt->bind_param("i", $data['authId']);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create booking record: ' . $stmt->error);
        }
        $data['bookingId'] = $conn->insert_id;

        // 3. Insert first parent
        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'];
        $firstParentPhone = $formData['First Parent Phone Number'];

        $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);
        if (!$stmt->execute()) {
            throw new Exception('Failed to add first parent: ' . $stmt->error);
        }
        $data['firstParentId'] = $conn->insert_id;

        // 4. Link first parent to booking
        $isPrimary = 1;
        $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $data['bookingId'], $data['firstParentId'], $isPrimary);
        if (!$stmt->execute()) {
            throw new Exception('Failed to link first parent to booking: ' . $stmt->error);
        }

        // 5. Insert second parent if provided
        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);
            if (!$stmt->execute()) {
                throw new Exception('Failed to add second parent: ' . $stmt->error);
            }
            $data['secondParentId'] = $conn->insert_id;

            // 6. Link second parent to booking
            $isPrimary = 0;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $data['bookingId'], $data['secondParentId'], $isPrimary);
            if (!$stmt->execute()) {
                throw new Exception('Failed to link second parent to booking: ' . $stmt->error);
            }
        }

        // 7. Insert students
        foreach ($studentSections as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                $grade = $studentData['Student Grade'] ?? '';

                $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add student #' . ($index + 1) . ': ' . $stmt->error);
                }
                $studentId = $conn->insert_id;
                $data['studentIds'][] = $studentId;

                // 8. Link student to booking
                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $data['bookingId'], $studentId);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error);
                }
            }
        }

        // 9. Insert extras
        $stmt = $conn->prepare("INSERT INTO booking_extras (booking_id) VALUES (?)");
        $stmt->bind_param("i", $data['bookingId']);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create extras record: ' . $stmt->error);
        }
        $data['extrasId'] = $conn->insert_id;

        // If everything is successful, commit the transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking_id' => $data['bookingId']
        ]);

    } catch (Exception $e) {
        // If any error occurs, rollback all changes
        if ($conn !== null && !$conn->connect_error) {
            performRollback($conn, $data);
        }

        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    } finally {
        if ($conn !== null && !$conn->connect_error) {
            $conn->close();
        }
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}

/**
 * Performs a complete rollback of all inserted records in the correct order
 * to respect foreign key constraints
 *
 * @param mysqli $conn Database connection
 * @param array $data Array containing all inserted IDs
 */
function performRollback($conn, $data) {
    try {
        $conn->begin_transaction();

        // 1. First delete the extras (depends on booking)
        if ($data['extrasId']) {
            $stmt = $conn->prepare("DELETE FROM booking_extras WHERE booking_id = ?");
            $stmt->bind_param("i", $data['bookingId']);
            $stmt->execute();
        }

        // 2. Delete student linkers (depends on booking and students)
        if ($data['bookingId']) {
            $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
            $stmt->bind_param("i", $data['bookingId']);
            $stmt->execute();
        }

        // 3. Delete students
        foreach ($data['studentIds'] as $studentId) {
            $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
            $stmt->bind_param("i", $studentId);
            $stmt->execute();
        }

        // 4. Delete parent linkers (depends on booking and parents)
        if ($data['bookingId']) {
            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
            $stmt->bind_param("i", $data['bookingId']);
            $stmt->execute();
        }

        // 5. Delete parents
        if ($data['firstParentId']) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $data['firstParentId']);
            $stmt->execute();
        }

        if ($data['secondParentId']) {
            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
            $stmt->bind_param("i", $data['secondParentId']);
            $stmt->execute();
        }

        // 6. Delete booking (depends on auth)
        if ($data['bookingId']) {
            $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
            $stmt->bind_param("i", $data['bookingId']);
            $stmt->execute();
        }

        // 7. Delete auth credentials
        if ($data['authId']) {
            $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
            $stmt->bind_param("i", $data['authId']);
            $stmt->execute();
        }

        $conn->commit();
    } catch (Exception $e) {
        // If rollback fails, attempt one more time
        try {
            $conn->rollback();
            performFinalCleanup($conn, $data);
        } catch (Exception $innerEx) {
            // At this point there's not much we can do
            // Log the error or notify administrator
            error_log("Critical error during rollback: " . $innerEx->getMessage());
        }
    }
}

/**
 * Last resort cleanup function that tries individual deletions
 * without transaction to clean up any remaining records
 *
 * @param mysqli $conn Database connection
 * @param array $data Array containing all inserted IDs
 */
function performFinalCleanup($conn, $data) {
    // Try to delete everything individually as a last resort
    try {
        if ($data['bookingId']) {
            $conn->query("DELETE FROM booking_extras WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM booking_students_linker WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM booking_parents_linker WHERE booking_id = {$data['bookingId']}");
            $conn->query("DELETE FROM bookings WHERE booking_id = {$data['bookingId']}");
        }

        foreach ($data['studentIds'] as $studentId) {
            $conn->query("DELETE FROM booking_students WHERE student_id = $studentId");
        }

        if ($data['firstParentId']) {
            $conn->query("DELETE FROM booking_parents WHERE parent_id = {$data['firstParentId']}");
        }

        if ($data['secondParentId']) {
            $conn->query("DELETE FROM booking_parents WHERE parent_id = {$data['secondParentId']}");
        }

        if ($data['authId']) {
            $conn->query("DELETE FROM booking_auth_credentials WHERE auth_id = {$data['authId']}");
        }
    } catch (Exception $e) {
        error_log("Final cleanup failed: " . $e->getMessage());
    }
}
?>