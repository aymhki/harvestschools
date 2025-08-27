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
        'firstParentDataHaveChanged' => false,
        'secondParentDataHaveChanged' => false,
        'oldUsername' => null,
        'oldPasswordHash' => null,
        'oldCdCount' => null,
        'oldAdditionalAttendeesCount' => null,
        'oldPaymentStatus' => null,
        'oldStudentsInfo' => [],
        'studentsInfoHaveChanged' => false,
        'authDataHaveChanged' => false,
        'extrasDataHaveChanged' => false,
        'haveSuccessfullyUpdatedParents' => false,
        'haveSuccessfullyUpdatedStudents' => false,
        'haveSuccessfullyUpdatedExtras' => false,
        'haveSuccessfullyUpdatedAuth' => false,
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
        $studentFieldMappings = [
            14 => ['section' => 1, 'field' => 'Student Name'],
            15 => ['section' => 1, 'field' => 'Student School Division'],
            16 => ['section' => 1, 'field' => 'Student Grade'],
            18 => ['section' => 2, 'field' => 'Student Name'],
            19 => ['section' => 2, 'field' => 'Student School Division'],
            20 => ['section' => 2, 'field' => 'Student Grade'],
            22 => ['section' => 3, 'field' => 'Student Name'],
            23 => ['section' => 3, 'field' => 'Student School Division'],
            24 => ['section' => 3, 'field' => 'Student Grade'],
            26 => ['section' => 4, 'field' => 'Student Name'],
            27 => ['section' => 4, 'field' => 'Student School Division'],
            28 => ['section' => 4, 'field' => 'Student Grade'],
            30 => ['section' => 5, 'field' => 'Student Name'],
            31 => ['section' => 5, 'field' => 'Student School Division'],
            32 => ['section' => 5, 'field' => 'Student Grade'],
        ];
        $studentSections = [];

        for ($i = 1; $i <= 5; $i++) {
            $studentSections[$i] = [];
        }

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = (int)substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($studentFieldMappings[$fieldId])) {
                    $mapping = $studentFieldMappings[$fieldId];
                    $sectionNumber = $mapping['section'];
                    $fieldName = $mapping['field'];
                    $studentSections[$sectionNumber][$fieldName] = $value;
                } else if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;
                } else {
                    $formData[$key] = $value;
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
                $stmt = $conn->prepare("SELECT parent_id, is_primary FROM booking_parents_linker WHERE booking_id = ?");

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

                    if ($row['is_primary'] == 1) {
                        $data['firstParentId'] = $row['parent_id'];
                    } else {
                        $data['secondParentId'] = $row['parent_id'];
                    }

                }

                if ($data['firstParentId'] === null) {
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'No primary parent found for the booking';
                    $errorInfo['code'] = 404;
                    performRollback($conn, $data);
                    echo json_encode($errorInfo);
                    return;
                }


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
                        $row = $result->fetch_assoc();
                        $data['oldStudentsInfo'][$studentId] = [
                            'name' => $row['name'],
                            'school_division' => $row['school_division'],
                            'grade' => $row['grade']
                        ];
                    }
                }

                $thereIsNewStudentInfo = false;

                if (count($data['oldStudentsInfo']) !== count($studentSections)) {
                    $thereIsNewStudentInfo = true;
                } else {
                    foreach ($studentSections as $index => $studentData) {
                        if (
                            (!empty($studentData['Student Name'])) ||
                            (
                                empty($studentData['Student Name']) &&
                                empty($studentData['Student School Division']) &&
                                empty($studentData['Student Grade'])
                            )
                        ) {
                            $studentName = $studentData['Student Name'];
                            $schoolDivision = $studentData['Student School Division'] ?? 'Other';
                            $grade = $studentData['Student Grade'] ?? '';

                            $found = false;

                            foreach ($data['oldStudentsInfo'] as $oldStudentId => $oldStudentData) {
                                if ($oldStudentData['name'] === $studentName && $oldStudentData['school_division'] === $schoolDivision && $oldStudentData['grade'] === $grade) {
                                    $found = true;
                                    break;
                                }
                            }

                            if (!$found) {
                                $thereIsNewStudentInfo = true;
                                break;
                            }
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


                    if ($data['oldFirstParentName'] !== $firstParentName || $data['oldFirstParentEmail'] !== $firstParentEmail || $data['oldFirstParentPhone'] !== $firstParentPhone) {
                        $data['firstParentDataHaveChanged'] = true;
                    }

                    if ($data['oldSecondParentName'] !== $secondParentName || $data['oldSecondParentEmail'] !== $secondParentEmail || $data['oldSecondParentPhone'] !== $secondParentPhone) {
                        $data['secondParentDataHaveChanged'] = true;
                    }

                    if ($data['firstParentDataHaveChanged'] || $data['secondParentDataHaveChanged']) {
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

                                if ($data['firstParentDataHaveChanged']) {
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

                                if ($data['secondParentDataHaveChanged']) {

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
                            }
                        } else if ($data['firstParentId'] !== null && $data['secondParentId'] === null) {
                            if (!empty($secondParentName)) {
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

                                if ($data['firstParentDataHaveChanged']) {
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
                            }
                        } else {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'No parent IDs found for the booking';
                            $errorInfo['code'] = 404;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }
                    }

                    $data['haveSuccessfullyUpdatedParents'] = true;

                    $data['studentsInfoHaveChanged'] = $thereIsNewStudentInfo;

                    if ($thereIsNewStudentInfo) {

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
                            if (
                                (!empty($studentData['Student Name'])) ||
                                (
                                    empty($studentData['Student Name']) &&
                                    empty($studentData['Student School Division']) &&
                                    empty($studentData['Student Grade'])
                                )
                            ) {

                                if (empty($studentData['Student Name']) && empty($studentData['Student School Division']) && empty($studentData['Student Grade']) ) {
                                    continue;
                                } else if (empty($studentData['Student Name'])) {
                                    $errorInfo['success'] = false;
                                    $errorInfo['message'] = 'Student Name cannot be empty: ' . $studentData['Student Grade'] . ' - ' . $studentData['Student School Division'];
                                    $errorInfo['code'] = 400;
                                    performRollback($conn, $data);
                                    echo json_encode($errorInfo);
                                    return;
                                }

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
                    }

                    $data['haveSuccessfullyUpdatedStudents'] = true;


                    $newCdCount = isset($formData['CD Count']) ? intval($formData['CD Count']) : -1;
                    $newAdditionalAttendees = isset($formData['Additional Attendees']) ? intval($formData['Additional Attendees']) : -1;
                    $newPaymentStatus = $formData['Extras Payment Status'] ?? '';



                    if ($newCdCount < 0 || $newAdditionalAttendees < 0 || $newPaymentStatus === '') {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'CD Count and Additional Attendees must be greater than or equal to 0 and Payment Status cannot be empty';
                        $errorInfo['code'] = 400;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt = $conn->prepare("SELECT cd_count, additional_attendees, payment_status FROM booking_extras WHERE booking_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare select booking extras failed: ' . $conn->error;
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
                        $data['oldCdCount'] = $row['cd_count'];
                        $data['oldAdditionalAttendeesCount'] = $row['additional_attendees'];
                        $data['oldPaymentStatus'] = $row['payment_status'];
                    } else {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'No extras found for the booking';
                        $errorInfo['code'] = 404;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    if ($data['oldCdCount'] !== $newCdCount || $data['oldAdditionalAttendeesCount'] !== $newAdditionalAttendees || $data['oldPaymentStatus'] !== $newPaymentStatus) {
                        $data['extrasDataHaveChanged'] = true;
                    }

                    if ($data['extrasDataHaveChanged']) {
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

                    $stmt = $conn->prepare("SELECT username, password_hash FROM booking_auth_credentials WHERE auth_id = ?");

                    if (!$stmt) {
                        $errorInfo['success'] = false;
                        $errorInfo['message'] = 'Prepare get booking auth credentials failed: ' . $conn->error;
                        $errorInfo['code'] = 500;
                        performRollback($conn, $data);
                        echo json_encode($errorInfo);
                        return;
                    }

                    $stmt->bind_param("i", $data['authId']);

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
                        $data['oldUsername'] = $row['username'];
                        $data['oldPasswordHash'] = $row['password_hash'];
                    }

                    $usernameHasChanged = $data['oldUsername'] !== $newUsername;

                    if ($usernameHasChanged) {
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

                    }

                    if ($newPassword === '') {

                        if ($usernameHasChanged) {
                            $data['authDataHaveChanged'] = true;
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

                        }
                    } else {
                        if ($usernameHasChanged) {
                            $data['authDataHaveChanged'] = true;
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
                        } else {
                            $data['authDataHaveChanged'] = true;
                            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET password_hash = SHA2(?, 256) WHERE auth_id = ?");

                            if (!$stmt) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Prepare update booking auth credentials failed: ' . $conn->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }

                            $stmt->bind_param("si", $newPassword, $data['authId']);

                            if (!$stmt->execute()) {
                                $errorInfo['success'] = false;
                                $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                                $errorInfo['code'] = 500;
                                performRollback($conn, $data);
                                echo json_encode($errorInfo);
                                return;
                            }
                        }
                    }

                    if ($usernameHasChanged  || $newPassword !== '') {

                        $stmt = $conn->prepare("DELETE FROM booking_sessions WHERE username = ?");

                        if (!$stmt) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Prepare delete booking sessions failed: ' . $conn->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

                        $stmt->bind_param("s", $data['oldUsername']);

                        if (!$stmt->execute()) {
                            $errorInfo['success'] = false;
                            $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
                            $errorInfo['code'] = 500;
                            performRollback($conn, $data);
                            echo json_encode($errorInfo);
                            return;
                        }

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

    if ($conn === null || $conn->connect_error) {
        return;
    }

    if ($data['bookingId'] === null) {
        return;
    }

    try {
        if (!$conn->begin_transaction()) {
            error_log("Failed to begin transaction for rollback");
        }

        if ($data['firstParentDataHaveChanged'] && $data['firstParentId'] !== null) {
            $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

            if (!$stmt) {
                error_log("Prepare update booking parents failed: " . $conn->error);
            }

            $firstParentName = $data['oldFirstParentName'] ?? '';
            $firstParentEmail = $data['oldFirstParentEmail'] ?? '';
            $firstParentPhone = $data['oldFirstParentPhone'] ?? '';

            $stmt->bind_param("ssss", $firstParentName, $firstParentEmail, $firstParentPhone, $data['firstParentId']);

            if (!$stmt->execute()) {
                error_log("Execute failed: " . $stmt->error);
            }
        }

        if ($data['secondParentDataHaveChanged'] && $data['secondParentId'] !== null) {

            if ($data['oldSecondParentName'] === null) {

                $stmt = $conn->prepare("UPDATE booking_parents SET name = ?, email = ?, phone_number = ? WHERE parent_id = ?");

                if (!$stmt) {
                    error_log("Prepare update booking parents failed: " . $conn->error);
                }

                $secondParentName = $data['oldSecondParentName'] ?? '';
                $secondParentEmail = $data['oldSecondParentEmail'] ?? '';
                $secondParentPhone = $data['oldSecondParentPhone'] ?? '';

                $stmt->bind_param("ssss", $secondParentName , $secondParentEmail, $secondParentPhone, $data['secondParentId']);

                if (!$stmt->execute()) {
                    error_log("Execute failed: " . $stmt->error);
                }

            } else {
                $stmt = $conn->prepare("DELETE FROM booking_parents WHERE parent_id = ?");

                if (!$stmt) {
                    error_log("Prepare delete booking parents failed: " . $conn->error);
                }

                $stmt->bind_param("s", $data['secondParentId']);

                if (!$stmt->execute()) {
                    error_log("Execute failed: " . $stmt->error);
                }
            }
        }

        if ($data['studentsInfoHaveChanged'] && $data['oldStudentIds'] !== null && $data['newStudentIds'] !== null && $data['oldStudentsInfo'] !== null) {
            foreach ($data['newStudentIds'] as $studentId) {
                $stmt = $conn->prepare("DELETE FROM booking_students_linker WHERE student_id = ?");

                if (!$stmt) {
                    error_log("Prepare delete booking students linker failed: " . $conn->error);
                }

                $stmt->bind_param("s", $studentId);

                if (!$stmt->execute()) {
                    error_log("Execute failed: " . $stmt->error);
                }

                $stmt = $conn->prepare("DELETE FROM booking_students WHERE student_id = ?");

                if (!$stmt) {
                    error_log("Prepare delete booking students failed: " . $conn->error);
                }

                $stmt->bind_param("s", $studentId);

                if (!$stmt->execute()) {
                    error_log("Execute failed: " . $stmt->error);
                }
            }

            foreach ($data['oldStudentIds'] as $index => $studentId) {
                $studentName = $data['oldStudentsInfo'][$studentId]['name'];
                $schoolDivision = $data['oldStudentsInfo'][$studentId]['school_division'];
                $grade = $data['oldStudentsInfo'][$studentId]['grade'];

                if (empty($studentName) || $studentName === null ) {
                    error_log("Student Name cannot be empty");
                }

                $stmt = $conn->prepare("INSERT INTO booking_students (student_id, name, school_division, grade) VALUES (?, ?, ?, ?)");

                if (!$stmt) {
                    error_log("Database error preparing statement: " . $conn->error);
                }

                $stmt->bind_param("ssss", $studentId, $studentName, $schoolDivision, $grade);

                if (!$stmt->execute()) {
                    error_log("Failed to add student: " . $stmt->error);
                }


                $stmt = $conn->prepare("INSERT INTO booking_students_linker (booking_id, student_id) VALUES (?, ?)");

                if (!$stmt) {
                    error_log("Database error preparing statement: " . $conn->error);
                }

                $stmt->bind_param("ss", $data['bookingId'], $studentId);

                if (!$stmt->execute()) {
                    error_log("Failed to link student to booking: " . $stmt->error);
                }
            }
        }

        if ($data['extrasDataHaveChanged'] && $data['extrasId'] !== null) {
            $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE extra_id = ?");

            if (!$stmt) {
                error_log("Prepare update booking extras failed: " . $conn->error);
            }

            $cdCount = $data['oldCdCount'] ?? 0;
            $additionalAttendees = $data['oldAdditionalAttendeesCount'] ?? 0;
            $paymentStatus = $data['oldPaymentStatus'] ?? '';

            $stmt->bind_param("iisi", $cdCount, $additionalAttendees, $paymentStatus, $data['extrasId']);

            if (!$stmt->execute()) {
                error_log("Execute failed: " . $stmt->error);
            }
        }

        if ($data['authDataHaveChanged'] && $data['authId'] !== null) {
            $stmt = $conn->prepare("UPDATE booking_auth_credentials SET username = ?, password_hash = SHA2(?, 256) WHERE auth_id = ?");

            if (!$stmt) {
                error_log("Prepare update booking auth credentials failed: " . $conn->error);
            }

            $username = $data['oldUsername'] ?? '';
            $passwordHash = $data['oldPasswordHash'] ?? '';

            $stmt->bind_param("ssi", $username, $passwordHash, $data['authId']);

            if (!$stmt->execute()) {
                error_log("Execute failed: " . $stmt->error);
            }
        }


        if (!$conn->commit()) {
            error_log("Failed to commit rollback transaction: " . $conn->error);
        }

    } catch (Exception $e) {
        error_log("Error during rollback: " . $e->getMessage());

        try {
            $conn->rollback();
        } catch (Exception $innerEx) {
            error_log("Critical error during rollback: " . $innerEx->getMessage());
        }
    }
}
