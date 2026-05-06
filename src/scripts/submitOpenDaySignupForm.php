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

        $conn->set_charset("utf8mb4");
        $formData = [];

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = (int)substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;
                } else {
                    $formData[$key] = $value;
                }

            } else {
                $formData[$key] = $value;
            }
        }

        $parentName = $formData['Parent Name'] ?? null;
        $parentPhone = $formData['Parent Phone Number'] ?? null;
        $numberOfChildrenAttending = $formData['numberOfAttendees'] ?? 1;

        $children = [];

        for ($i = 0; $i <= $numberOfChildrenAttending; $i++) {
            $childNameKey = "Child Name $i";
            $childAgeKey = "Child Age $i";

            if (isset($formData[$childNameKey]) && isset($formData[$childAgeKey])) {
                $children[] = [
                    'name' => $formData[$childNameKey],
                    'age' => (int)$formData[$childAgeKey]
                ];
            }
        }

        if (empty($parentName) || empty($parentPhone) || empty($children)) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Missing required fields: parent name, parent phone, or child information.';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $totalChildren = count($children);
        $totalCost = 150 * $totalChildren;
        $paymentStatus = 'Pending Payment';

        $conn->begin_transaction();

        $stmt = $conn->prepare("SELECT registration_id FROM open_day_registrations WHERE parent_name = ? AND parent_phone = ?");
        $stmt->bind_param("ss", $parentName, $parentPhone);
        $stmt->execute();
        $result = $stmt->get_result();

        $registrationId = null;

        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $registrationId = $row['id'];

            $checkStmt = $conn->prepare("SELECT child_id FROM open_day_children WHERE registration_id = ? AND child_name = ? AND age = ?");

            foreach ($children as $child) {
                $childName = $child['name'];
                $childAge = $child['age'];

                $checkStmt->bind_param("isi", $registrationId, $childName, $childAge);
                $checkStmt->execute();

                if ($checkStmt->get_result()->num_rows > 0) {
                    $conn->rollback();
                    $errorInfo['success'] = false;
                    $errorInfo['message'] = 'Child already exists under this registration.';
                    $errorInfo['code'] = 409;
                    echo json_encode($errorInfo);
                    return;
                }

            }

            $updStmt = $conn->prepare("UPDATE open_day_registrations SET total_children = total_children + ?, total_cost = total_cost + ? WHERE registration_id = ?");
            $updStmt->bind_param("idi", $totalChildren, $totalCost, $registrationId);
            $updStmt->execute();
        } else {
            $insertStmt = $conn->prepare("INSERT INTO open_day_registrations (parent_name, parent_phone, total_children, total_cost, payment_status) VALUES (?, ?, ?, ?, ?)");
            $insertStmt->bind_param("ssids", $parentName, $parentPhone, $totalChildren, $totalCost, $paymentStatus);
            $insertStmt->execute();
            $registrationId = $conn->insert_id;
        }

        $stmt = $conn->prepare("INSERT INTO open_day_children (registration_id, child_name, age) VALUES (?, ?, ?)");

        foreach ($children as $child) {
            $childName = $child['name'];
            $childAge = $child['age'];
            $stmt->bind_param("isi", $registrationId, $childName, $childAge);
            $stmt->execute();
        }

        $conn->commit();

        $errorInfo['success'] = true;
        $errorInfo['message'] = 'Submission Successful';
        $errorInfo['code'] = 200;
        echo json_encode($errorInfo);

    } catch (Exception $e) {
        $errorInfo['success'] = false;
        $errorInfo['message'] = 'An unexpected error occurred: ' . $e->getMessage();
        $errorInfo['code'] = 500;
        echo json_encode($errorInfo);
    } finally {
        if ($conn !== null && !$conn->connect_error) {
            $conn->close();
        }
    }
}