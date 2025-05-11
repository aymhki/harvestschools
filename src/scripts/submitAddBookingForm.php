<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

// Set up error logging
ini_set('display_errors', 0);
error_log("Starting booking process at " . date('Y-m-d H:i:s'));

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $conn = null;
    $authId = null;
    $bookingId = null;
    $firstParentId = null;
    $secondParentId = null;
    $createdStudentIds = [];

    try {
        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            throw new Exception('Database connection failed: ' . $conn->connect_error);
        }

        // IMPORTANT: Set the proper transaction isolation level
        $conn->query("SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        $conn->autocommit(false);

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

        $bookingUsername = $formData['Booking Username'];
        $bookingPassword = $formData['Booking Password'];

        $stmt = $conn->prepare("SELECT auth_id FROM booking_auth_credentials WHERE username = ?");
        $stmt->bind_param("s", $bookingUsername);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            throw new Exception('Username already exists. Please choose a different username.');
        }

        $stmt = $conn->prepare("INSERT INTO booking_auth_credentials (username, password_hash) VALUES (?, SHA2(?, 256))");
        $stmt->bind_param("ss", $bookingUsername, $bookingPassword);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create authentication record: ' . $stmt->error);
        }
        $authId = $conn->insert_id;
        error_log("Created auth record with ID: " . $authId);

        $stmt = $conn->prepare("INSERT INTO bookings (auth_id) VALUES (?)");
        $stmt->bind_param("i", $authId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create booking record: ' . $stmt->error);
        }
        $bookingId = $conn->insert_id;
        error_log("Created booking record with ID: " . $bookingId);

        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'];
        $firstParentPhone = $formData['First Parent Phone Number'];

        $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);
        if (!$stmt->execute()) {
            throw new Exception('Failed to add first parent: ' . $stmt->error);
        }
        $firstParentId = $conn->insert_id;
        error_log("Created first parent with ID: " . $firstParentId);

        $isPrimary = 1;
        $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $bookingId, $firstParentId, $isPrimary);
        if (!$stmt->execute()) {
            throw new Exception('Failed to link first parent to booking: ' . $stmt->error);
        }
        error_log("Linked first parent to booking");

        if (!empty($formData['Second Parent Name'])) {
            $secondParentName = $formData['Second Parent Name'];
            $secondParentEmail = $formData['Second Parent Email'] ?? '';
            $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);
            if (!$stmt->execute()) {
                throw new Exception('Failed to add second parent: ' . $stmt->error);
            }
            $secondParentId = $conn->insert_id;
            error_log("Created second parent with ID: " . $secondParentId);

            $isPrimary = 0;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $bookingId, $secondParentId, $isPrimary);
            if (!$stmt->execute()) {
                throw new Exception('Failed to link second parent to booking: ' . $stmt->error);
            }
            error_log("Linked second parent to booking");
        }

        foreach ($studentSections as $studentData) {
            if (!empty($studentData['Student Name'])) {
                $studentName = $studentData['Student Name'];
                $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                $grade = $studentData['Student Grade'] ?? '';

                $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add student: ' . $stmt->error);
                }
                $studentId = $conn->insert_id;
                $createdStudentIds[] = $studentId;
                error_log("Created student with ID: " . $studentId);

                // Link student to booking
                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $bookingId, $studentId);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to link student to booking: ' . $stmt->error);
                }
                error_log("Linked student to booking");
            }
        }

        $stmt = $conn->prepare("INSERT INTO booking_extras (booking_id) VALUES (?)");
        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create extras record: ' . $stmt->error);
        }
        error_log("Created extras record for booking");

        $conn->commit();
        error_log("Transaction committed successfully");

        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
        error_log("Error occurred: " . $e->getMessage());

        if ($conn !== null && !$conn->connect_error) {
            try {
                error_log("Attempting rollback...");
                $conn->rollback();
                error_log("Rollback complete");

                // Always perform manual cleanup
                error_log("Starting manual cleanup");

                // 1. Delete booking_extras
                if ($bookingId !== null) {
                    error_log("Attempting to delete booking_extras for booking_id: $bookingId");
                    if (!$conn->query("DELETE FROM booking_extras WHERE booking_id = $bookingId")) {
                        error_log("Error deleting booking_extras: " . $conn->error);
                    } else {
                        error_log("Successfully deleted booking_extras");
                    }
                }

                // 2. Delete student links and students
                if ($bookingId !== null) {
                    error_log("Fetching students for booking_id: $bookingId");
                    $studentResult = $conn->query("SELECT student_id FROM booking_students_linker WHERE booking_id = $bookingId");
                    if ($studentResult) {
                        while ($row = $studentResult->fetch_assoc()) {
                            $studentId = $row['student_id'];
                            error_log("Attempting to delete student with ID: $studentId");
                            if (!$conn->query("DELETE FROM booking_students WHERE id = $studentId")) {
                                error_log("Error deleting student: " . $conn->error);
                            } else {
                                error_log("Successfully deleted student");
                            }
                        }
                    } else {
                        error_log("Error fetching students: " . $conn->error);
                    }

                    error_log("Attempting to delete student links for booking_id: $bookingId");
                    if (!$conn->query("DELETE FROM booking_students_linker WHERE booking_id = $bookingId")) {
                        error_log("Error deleting student links: " . $conn->error);
                    } else {
                        error_log("Successfully deleted student links");
                    }
                }

                // 3. Delete parent links and parents
                if ($bookingId !== null) {
                    error_log("Fetching parents for booking_id: $bookingId");
                    $parentResult = $conn->query("SELECT parent_id FROM booking_parents_linker WHERE booking_id = $bookingId");
                    if ($parentResult) {
                        $parentCount = $parentResult->num_rows;
                        error_log("Found $parentCount parents to delete");
                        while ($row = $parentResult->fetch_assoc()) {
                            $parentId = $row['parent_id'];
                            error_log("Attempting to delete parent with ID: $parentId");
                            if (!$conn->query("DELETE FROM booking_parents WHERE id = $parentId")) {
                                error_log("Error deleting parent: " . $conn->error);
                            } else {
                                error_log("Successfully deleted parent with ID: $parentId");
                            }
                        }
                    } else {
                        error_log("Error fetching parents: " . $conn->error);
                    }

                    error_log("Attempting to delete parent links for booking_id: $bookingId");
                    if (!$conn->query("DELETE FROM booking_parents_linker WHERE booking_id = $bookingId")) {
                        error_log("Error deleting parent links: " . $conn->error);
                    } else {
                        error_log("Successfully deleted parent links");
                    }
                }

                // 4. Delete booking record
                if ($bookingId !== null) {
                    error_log("Attempting to delete booking with ID: $bookingId");
                    if (!$conn->query("DELETE FROM bookings WHERE id = $bookingId")) {
                        error_log("Error deleting booking: " . $conn->error);
                    } else {
                        error_log("Successfully deleted booking");
                    }
                }

                // 5. Delete auth record
                if ($authId !== null) {
                    error_log("Attempting to delete auth record with ID: $authId");
                    if (!$conn->query("DELETE FROM booking_auth_credentials WHERE auth_id = $authId")) {
                        error_log("Error deleting auth credentials: " . $conn->error);
                    } else {
                        error_log("Successfully deleted auth credentials");
                    }
                }

                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage() . ' (Manual cleanup performed)'
                ]);

            } catch (Exception $cleanupError) {
                error_log("Cleanup error: " . $cleanupError->getMessage());
                echo json_encode([
                    'success' => false,
                    'message' => $e->getMessage() . ' (Initial error). Additional error during cleanup: ' . $cleanupError->getMessage()
                ]);
            }
        } else {
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    } finally {
        if ($conn !== null && !$conn->connect_error) {
            $conn->close();
            error_log("Database connection closed");
        }
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>