<?php

header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = null;
    $authId = null;
    $bookingId = null;
    $firstParentId = null;
    $secondParentId = null;
    $studentIds = [];
    $extrasId = null;

    try {
        $conn = new mysqli($servername, $username, $password, $dbname);
        if ($conn->connect_error) {
            throw new Exception('Database connection failed: ' . $conn->connect_error);
        }

        $conn->autocommit(false);

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
                            // Use the complete instanceId as the key instead of just the number
                            // This prevents issues with non-sequential section numbering
                            if (!isset($studentSections[$instanceId])) {
                                $studentSections[$instanceId] = [];
                            }
                            $studentSections[$instanceId][$label] = $value;
                        }
                    }
                }
            }
        }

        $processedStudents = [];
        foreach ($studentSections as $sectionData) {
            if (!empty($sectionData['Student Name'])) {
                $processedStudents[] = $sectionData;
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
        $conn->commit();

        try {
            $conn->begin_transaction();
            $stmt = $conn->prepare("INSERT INTO bookings (auth_id) VALUES (?)");
            $stmt->bind_param("i", $authId);
            if (!$stmt->execute()) {
                throw new Exception('Failed to create booking record: ' . $stmt->error);
            }
            $bookingId = $conn->insert_id;
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            if ($authId) {
                $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
                $stmt->bind_param("i", $authId);
                $stmt->execute();
            }
            throw new Exception($e->getMessage());
        }

        try {
            $conn->begin_transaction();
            $firstParentName = $formData['First Parent Name'];
            $firstParentEmail = $formData['First Parent Email'];
            $firstParentPhone = $formData['First Parent Phone Number'];

            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $firstParentName, $firstParentEmail, $firstParentPhone);
            if (!$stmt->execute()) {
                throw new Exception('Failed to add first parent: ' . $stmt->error);
            }
            $firstParentId = $conn->insert_id;
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            if ($bookingId) {
                $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
                $stmt->bind_param("i", $bookingId);
                $stmt->execute();
            }
            if ($authId) {
                $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
                $stmt->bind_param("i", $authId);
                $stmt->execute();
            }
            throw new Exception($e->getMessage());
        }

        try {
            $conn->begin_transaction();
            $isPrimary = 1;
            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $bookingId, $firstParentId, $isPrimary);
            if (!$stmt->execute()) {
                throw new Exception('Failed to link first parent to booking: ' . $stmt->error);
            }
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            if ($firstParentId) {
                $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
                $stmt->bind_param("i", $firstParentId);
                $stmt->execute();
            }
            if ($bookingId) {
                $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
                $stmt->bind_param("i", $bookingId);
                $stmt->execute();
            }
            if ($authId) {
                $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
                $stmt->bind_param("i", $authId);
                $stmt->execute();
            }
            throw new Exception($e->getMessage());
        }

        if (!empty($formData['Second Parent Name'])) {
            try {
                $conn->begin_transaction();
                $secondParentName = $formData['Second Parent Name'];
                $secondParentEmail = $formData['Second Parent Email'] ?? '';
                $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

                $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add second parent: ' . $stmt->error);
                }
                $secondParentId = $conn->insert_id;
                $conn->commit();
            } catch (Exception $e) {
                $conn->rollback();
                cleanupAllRecords($conn, $firstParentId, null, $bookingId, $authId, []);
                throw new Exception($e->getMessage());
            }

            try {
                $conn->begin_transaction();
                $isPrimary = 0;
                $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
                $stmt->bind_param("iii", $bookingId, $secondParentId, $isPrimary);
                if (!$stmt->execute()) {
                    throw new Exception('Failed to link second parent to booking: ' . $stmt->error);
                }
                $conn->commit();
            } catch (Exception $e) {
                $conn->rollback();
                if ($secondParentId) {
                    $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
                    $stmt->bind_param("i", $secondParentId);
                    $stmt->execute();
                }
                cleanupAllRecords($conn, $firstParentId, null, $bookingId, $authId, []);
                throw new Exception($e->getMessage());
            }
        }

        foreach ($processedStudents as $index => $studentData) {
            if (!empty($studentData['Student Name'])) {
                try {
                    $conn->begin_transaction();
                    $studentName = $studentData['Student Name'];
                    $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                    $grade = $studentData['Student Grade'] ?? '';

                    $stmt = $conn->prepare("INSERT INTO booking_students (name, school_division, grade) VALUES (?, ?, ?)");
                    $stmt->bind_param("sss", $studentName, $schoolDivision, $grade);
                    if (!$stmt->execute()) {
                        throw new Exception('Failed to add student #' . ($index + 1) . ': ' . $stmt->error);
                    }
                    $studentId = $conn->insert_id;
                    $studentIds[] = $studentId;
                    $conn->commit();
                } catch (Exception $e) {
                    $conn->rollback();
                    foreach ($studentIds as $id) {
                        $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                        $stmt->bind_param("i", $id);
                        $stmt->execute();
                    }
                    cleanupAllRecords($conn, $firstParentId, $secondParentId, $bookingId, $authId, []);
                    throw new Exception($e->getMessage());
                }

                try {
                    $conn->begin_transaction();
                    $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");
                    $stmt->bind_param("ii", $bookingId, $studentId);
                    if (!$stmt->execute()) {
                        throw new Exception('Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error);
                    }
                    $conn->commit();
                } catch (Exception $e) {
                    $conn->rollback();
                    foreach ($studentIds as $id) {
                        $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                        $stmt->bind_param("i", $id);
                        $stmt->execute();
                    }
                    cleanupAllRecords($conn, $firstParentId, $secondParentId, $bookingId, $authId, []);
                    throw new Exception($e->getMessage());
                }
            }
        }

        try {
            $conn->begin_transaction();
            $stmt = $conn->prepare("INSERT INTO booking_extras (booking_id) VALUES (?)");
            $stmt->bind_param("i", $bookingId);
            if (!$stmt->execute()) {
                throw new Exception('Failed to create extras record: ' . $stmt->error);
            }
            $extrasId = $conn->insert_id;
            $conn->commit();
        } catch (Exception $e) {
            $conn->rollback();
            foreach ($studentIds as $id) {
                $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE student_id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();

                $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
            }
            cleanupAllRecords($conn, $firstParentId, $secondParentId, $bookingId, $authId, []);
            throw new Exception($e->getMessage());
        }

        echo json_encode([
            'success' => true,
            'message' => 'Booking created successfully',
            'booking_id' => $bookingId
        ]);

    } catch (Exception $e) {
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


function cleanupAllRecords($conn, $firstParentId, $secondParentId, $bookingId, $authId, $studentIds) {
    if ($bookingId) {
        $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);
        $stmt->execute();
    }

    if ($firstParentId) {
        $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
        $stmt->bind_param("i", $firstParentId);
        $stmt->execute();
    }

    if ($secondParentId) {
        $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");
        $stmt->bind_param("i", $secondParentId);
        $stmt->execute();
    }

    if ($bookingId) {
        $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);
        $stmt->execute();
    }

    foreach ($studentIds as $studentId) {
        $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
    }

    if ($bookingId) {
        $stmt = $conn->prepare("DELETE FROM booking_extras WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);
        $stmt->execute();
    }

    if ($bookingId) {
        $stmt = $conn->prepare("DELETE FROM bookings WHERE booking_id = ?");
        $stmt->bind_param("i", $bookingId);
        $stmt->execute();
    }

    if ($authId) {
        $stmt = $conn->prepare("DELETE FROM booking_auth_credentials WHERE auth_id = ?");
        $stmt->bind_param("i", $authId);
        $stmt->execute();
    }
}
?>