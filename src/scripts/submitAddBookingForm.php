<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $conn = null;
    try {
        // Create connection
        $conn = new mysqli($servername, $username, $password, $dbname);

        // Check connection
        if ($conn->connect_error) {
            throw new Exception('Database connection failed: ' . $conn->connect_error);
        }

        // Begin transaction
        $conn->begin_transaction();

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

        // 1. Create Authentication Record
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

        // Insert authentication record
        $stmt = $conn->prepare("INSERT INTO booking_auth_credentials (username, password_hash) VALUES (?, SHA2(?, 256))");
        $stmt->bind_param("ss", $bookingUsername, $bookingPassword);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create authentication record: ' . $stmt->error);
        }
        $authId = $conn->insert_id;

        // 2. Create Booking Record
        $stmt = $conn->prepare("INSERT INTO bookings (auth_id) VALUES (?)");
        $stmt->bind_param("i", $authId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create booking record: ' . $stmt->error);
        }
        $bookingId = $conn->insert_id;

        // 3. Add First Parent
        $firstParentName = $formData['First Parent Name'];
        $firstParentEmail = $formData['First Parent Email'];
        $firstParentPhone = $formData['First Parent Phone Number'];

        $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);
        if (!$stmt->execute()) {
            throw new Exception('Failed to add first parent: ' . $stmt->error);
        }
        $firstParentId = $conn->insert_id;

        // Link parent to booking
        $isPrimary = 1;
        $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $bookingId, $firstParentId, $isPrimary);
        if (!$stmt->execute()) {
            throw new Exception('Failed to link first parent to booking: ' . $stmt->error);
        }

        // 4. Add Second Parent (if provided)
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

            // Link second parent to booking
            $isPrimary = 0;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $bookingId, $secondParentId, $isPrimary);
            if (!$stmt->execute()) {
                throw new Exception('Failed to link second parent to booking: ' . $stmt->error);
            }
        }

        // 5. Add Students
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

                // Link student to booking
                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                $stmt->bind_param("ii", $bookingId, $studentId);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to link student to booking: ' . $stmt->error);
                }
            }
        }

        // 6. Create extras record
        $stmt = $conn->prepare("INSERT INTO booking_extras (booking_id) VALUES (?)");
        $stmt->bind_param("i", $bookingId);
        if (!$stmt->execute()) {
            throw new Exception('Failed to create extras record: ' . $stmt->error);
        }

        // If we got this far, commit the transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
        // Only attempt to rollback if we have a valid connection
        if ($conn !== null && !$conn->connect_error) {
            $conn->rollback();
        }

        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    } finally {
        // Close the connection if it was successfully established
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
?>