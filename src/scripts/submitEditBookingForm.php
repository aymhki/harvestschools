<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
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
        'oldStudentIds' => [],
        'newStudentIds' => [],
        'extrasId' => null,
        'oldFirstParentName' => null,
        'oldFirstParentEmail' => null,
        'oldFirstParentPhone' => null,
        'oldSecondParentName' => null,
        'oldSecondParentEmail' => null,
        'oldSecondParentPhone' => null,
        'oldUsername' => null,
        'oldCdCount' => null,
        'oldAdditionalAttendeesCount' => null,
        'oldPaymentStatus' => null,
        'oldStudentsInfo' => [[]],
        'haveSuccessfullyUpdatedParents' => false,
        'haveSuccessfullyUpdatedStudents' => false,
        'haveSuccessfullyUpdatedExtras' => false,
        'haveSuccessfullyUpdatedAuth' => false,
        'newPasswordUpdated' => false,
        'haveSuccessfullyUpdatedBooking' => false
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
            } else {
                $formData[$key] = $value;
            }
        }

        $conn->autocommit(false);

        if (isset($formData['bookingId'])) {
            $data['bookingId'] = $formData['bookingId'];
            $stmt = $conn->prepare("SELECT auth_id FROM bookings WHERE booking_id = ?");

            if (!$stmt) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Prepare getting auth_id failed: ' . $conn->error;
                $errorInfo['code'] = 500;
                echo json_encode($errorInfo);
                return;
            }

            $stmt->bind_param("s", $data['bookingId']);

            if (!$stmt->execute()) {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                $errorInfo['code'] = 500;
                echo json_encode($errorInfo);
                return;
            }

            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $data['authId'] = $row['auth_id'];
                $stmt = $conn->prepare("SELECT parent_id FROM booking_parents_linker WHERE booking_id = ?");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Prepare getting parent_id failed: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("s", $data['bookingId']);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $result = $stmt->get_result();
                $parentIds = [];

                if ($result->num_rows === 0) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'No parents found for the booking';
                    $errorInfo['code'] = 404;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                while ($row = $result->fetch_assoc()) {
                    $parentIds[] = $row['parent_id'];
                }

                $data['firstParentId'] = $parentIds[0];
                $data['secondParentId'] = $parentIds[1] ?? null;

                $stmt = $conn->prepare("SELECT name, email, phone_number FROM booking_parents WHERE parent_id = ?");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Prepare getting parents info from booking parents failed: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("s", $data['firstParentId']);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $data['oldFirstParentName'] = $row['name'];
                    $data['oldFirstParentEmail'] = $row['email'];
                    $data['oldFirstParentPhone'] = $row['phone_number'];
                }

                if ($data['secondParentId'] !== null) {
                    $stmt = $conn->prepare("SELECT name, email, phone_number FROM booking_parents WHERE parent_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare getting parents info from booking parents failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("s", $data['secondParentId']);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $result = $stmt->get_result();

                    if ($result->num_rows > 0) {
                        $row = $result->fetch_assoc();
                        $data['oldSecondParentName'] = $row['name'];
                        $data['oldSecondParentEmail'] = $row['email'];
                        $data['oldSecondParentPhone'] = $row['phone_number'];
                    }
                }

                $stmt = $conn->prepare("SELECT student_id FROM booking_students_linker WHERE booking_id = ?");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Prepare getting student id from booking students failed: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("s", $data['bookingId']);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $result = $stmt->get_result();

                if ($result->num_rows === 0) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'No students found for the booking';
                    $errorInfo['code'] = 404;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                while ($row = $result->fetch_assoc()) {
                    $data['oldStudentIds'][] = $row['student_id'];
                }

                foreach ($data['oldStudentIds'] as $studentId) {
                    $stmt = $conn->prepare("SELECT name, school_division, grade FROM booking_students WHERE student_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare get student info from booking students failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("s", $studentId);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $result = $stmt->get_result();

                    if ($result->num_rows > 0) {
                        while ($row = $result->fetch_assoc()) {
                            $data['oldStudentsInfo'][$studentId] = [
                                'name' => $row['name'],
                                'school_division' => $row['school_division'],
                                'grade' => $row['grade']
                            ];
                        }
                    }
                }


                $stmt = $conn->prepare("SELECT extra_id, cd_count, additional_attendees, payment_status FROM booking_extras WHERE booking_id = ?");

                if (!$stmt) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Prepare select extra id from booking extras failed: ' . $conn->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $stmt->bind_param("s", $data['bookingId']);

                if (!$stmt->execute()) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                    $errorInfo['code'] = 500;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }

                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $data['extrasId'] = $row['extra_id'];
                    $data['oldCdCount'] = $row['cd_count'];
                    $data['oldAdditionalAttendeesCount'] = $row['additional_attendees'];
                    $data['oldPaymentStatus'] = $row['payment_status'];
                    $firstParentName = $formData['First Parent Name'] ?? '';
                    $firstParentEmail = $formData['First Parent Email'] ?? '';
                    $firstParentPhone = $formData['First Parent Phone Number'] ?? '';
                    $secondParentName = $formData['Second Parent Name'] ?? '';
                    $secondParentEmail = $formData['Second Parent Email'] ?? '';
                    $secondParentPhone = $formData['Second Parent Phone Number'] ?? '';

                    if ($data['firstParentId'] !== null && $data['secondParentId'] !== null) {
                        if (empty($secondParentName) && empty($secondParentEmail) && empty($secondParentPhone)) {
                            $stmt = $conn->prepare("DELETE FROM booking_parents_linker WHERE parent_id = ? AND booking_id = ? AND is_primary = 0");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare delete booking parents linker failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ss", $data['secondParentId'], $data['bookingId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare delete booking parents failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("s", $data['secondParentId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                        } else {
                            if (empty($firstParentName)) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'First parent fields cannot be empty';
                                $errorInfo['code'] = 400;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare update booking parents failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ssss", $firstParentName, $firstParentEmail, $firstParentPhone, $data['firstParentId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare update booking parents failed failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ssss", $secondParentName, $secondParentEmail, $secondParentPhone, $data['secondParentId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }
                        }
                    } else  if ($data['firstParentId'] !== null && $data['secondParentId'] === null) {
                        if (!empty($secondParentName) ) {
                            $stmt = $conn->prepare("INSERT INTO booking_parents (name, email, phone_number) VALUES (?, ?, ?)");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare insert booking parents failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("sss", $secondParentName, $secondParentEmail, $secondParentPhone);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $secondParentId = $stmt->insert_id;

                            $stmt = $conn->prepare("INSERT INTO booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, 0)");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare insert booking parents linker failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ss", $data['bookingId'], $secondParentId);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $data['secondParentId'] = $secondParentId;

                            if (empty($firstParentName)) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'First parent fields cannot be empty';
                                $errorInfo['code'] = 400;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare update booking parents failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ssss", $firstParentName, $firstParentEmail, $firstParentPhone, $data['firstParentId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }
                        } else {
                            if (empty($firstParentName)) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'First parent fields cannot be empty';
                                $errorInfo['code'] = 400;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare update booking parents failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ssss", $firstParentName, $firstParentEmail, $firstParentPhone, $data['firstParentId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }
                        }
                    } else {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'No parent IDs found for the booking';
                        $errorInfo['code'] = 404;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $data['haveSuccessfullyUpdatedParents'] = true;
                    $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE booking_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare delete booking students linker failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("s", $data['bookingId']);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    foreach ($data['oldStudentIds'] as $studentId) {
                        $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");

                        if (!$stmt) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Prepare delete booking students failed: ' . $conn->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

                        $stmt->bind_param("s", $studentId);

                        if (!$stmt->execute()) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }
                    }

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
                            $data['newStudentIds'][] = $studentId;
                            $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Database error preparing statement: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("ii", $data['bookingId'], $studentId);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Failed to link student #' . ($index + 1) . ' to booking: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }
                        } else {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Student Name cannot be empty: ' . $studentData['Student Grade'] . ' - ' . $studentData['Student School Division'];
                            $errorInfo['code'] = 400;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
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

                    $data['haveSuccessfullyUpdatedStudents'] = true;
                    $newCdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : -1;
                    $newAdditionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : -1;
                    $newPaymentStatus = $formData['Extras Payment Status'] ?? '';

                    if ($newCdCount < 0 || $newAdditionalAttendees < 0 || $newPaymentStatus === '') {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'CD Count and Additional Attendees must be greater than or equal to 0';
                        $errorInfo['code'] = 400;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE extra_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare update booking extras failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("iisi", $newCdCount, $newAdditionalAttendees, $newPaymentStatus, $data['extrasId']);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $data['haveSuccessfullyUpdatedExtras'] = true;
                    $newUsername = $formData['Booking Username'] ?? '';
                    $newPassword = $formData['Booking Password'] ?? '';

                    if (empty($newUsername)) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Username';
                        $errorInfo['code'] = 400;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM booking_auth_credentials WHERE username = ? AND auth_id != ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare count the number of booking auths with the same username failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("si", $newUsername, $data['authId']);

                    if (!$stmt->execute()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $result = $stmt->get_result();
                    $row = $result->fetch_assoc();

                    if ($row['count'] > 0) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Username already in use';
                        $errorInfo['code'] = 400;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }


                    if ($newPassword === '') {
                        $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ? WHERE auth_id = ?");

                        if (!$stmt) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Prepare update booking auth credentials failed: ' . $conn->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

                        $stmt->bind_param("si", $newUsername, $data['authId']);

                        if (!$stmt->execute()) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }
                    } else {
                        $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ?, password_hash = SHA2(?, 256) WHERE auth_id = ?");

                        if (!$stmt) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Prepare update booking auth credentials failed: ' . $conn->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

                        $stmt->bind_param("ssi", $newUsername, $newPassword, $data['authId']);

                        if (!$stmt->execute()) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

                        $data['newPasswordUpdated'] = true;
                    }

                    $data['haveSuccessfullyUpdatedAuth'] = true;

                    if (!$conn->commit()) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    if ($data['haveSuccessfullyUpdatedParents'] && $data['haveSuccessfullyUpdatedStudents'] && $data['haveSuccessfullyUpdatedExtras'] && $data['haveSuccessfullyUpdatedAuth']) {
                        $data['haveSuccessfullyUpdatedBooking'] = true;
                    }

                    echo json_encode([
                        'success' => true,
                        'message' => 'Booking updated successfully',
                        'code' => 200,
                        'allData' => $data
                    ]);

                } else {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'No extras found for the booking';
                    $errorInfo['code'] = 404;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }
            } else {
                $errorInfo['success'] = false;
                $errorInfo['message'] = 'No booking found with the provided ID';
                $errorInfo['code'] = 404;
                echo json_encode($errorInfo);
                return;
            }
        } else {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking ID is missing';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }
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

    // if there is a bookingId and new password updated is false then successfully proceed

    // if there is parent 1 or 2 id and parents data have updated successfully and old corressponding parent data is not null or empty, then rollback the changes

    // if there is newStudentIds and oldStudentIds and students data have updated successfully and old students data is not null or empty, then rollback the changes

    // if there is extrasId and extras data have updated successfully and old extras data is not null or empty, then rollback the changes

    // if there is authId and auth data have updated successfully and old auth data is not null or empty, then rollback the changes

    if ($data['haveSuccessfullyUpdatedParents'] && $data['haveSuccessfullyUpdatedStudents'] && $data['haveSuccessfullyUpdatedExtras'] && $data['haveSuccessfullyUpdatedAuth']) {
        return;
    }

    if ($data['bookingId'] === null || $data['newPasswordUpdated'] === true) {
        return;
    }

    return;

    try {
        if (!$conn->begin_transaction()) {
            error_log("Failed to begin transaction for rollback");
        }


        if (!$conn->commit()) {
            error_log("Failed to commit rollback transaction: " . $conn->error);
            performFinalCleanup($conn, $data);
        }

    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());

        try {
            $conn->rollback();
            performFinalCleanup($conn, $data);
        } catch (Exception $innerEx) {
            error_log("Critical error during rollback: " . $innerEx->getMessage());
        }
    }
}

function performFinalCleanup($conn, $data) {

}