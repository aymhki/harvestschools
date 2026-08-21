<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/staffDirectoryHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $STAFF_DIRECTORY_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $STAFF_DIRECTORY_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $codeWasTyped = trim((string)($data['employee_code'] ?? '')) !== '';
    $attemptsRemaining = $codeWasTyped ? 1 : 4;
    $employeeCode = null;

    while ($attemptsRemaining > 0 && $employeeCode === null) {
        $attemptsRemaining--;

        $validation = staff_validate_employee($conn, $data, true);

        if (!$validation['success']) {
            echo json_encode($validation);
            exit;
        }

        $employee = $validation['employee'];

        $stmt = $conn->prepare(
            "INSERT INTO staff_employees
                (employee_code, sort_order, name_en, name_ar, position_en, position_ar,
                 subject_en, subject_ar, departments, display_style, is_public,
                 email, phone, hire_date, notes, degree_en, degree_ar, fingerprint_code, classification, graduation_year,
                 national_id, insurance_number, birth_date, address, basic_salary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->bind_param(
            "sisssssssssssss" . "sssssssss" . "d",
            $employee['employee_code'],
            $employee['sort_order'],
            $employee['name_en'],
            $employee['name_ar'],
            $employee['position_en'],
            $employee['position_ar'],
            $employee['subject_en'],
            $employee['subject_ar'],
            $employee['departments'],
            $employee['display_style'],
            $employee['is_public'],
            $employee['email'],
            $employee['phone'],
            $employee['hire_date'],
            $employee['notes'],
            $employee['degree_en'],
            $employee['degree_ar'],
            $employee['fingerprint_code'],
            $employee['classification'],
            $employee['graduation_year'],
            $employee['national_id'],
            $employee['insurance_number'],
            $employee['birth_date'],
            $employee['address'],
            $employee['basic_salary']
        );

        try {
            $stmt->execute();
            $employeeCode = $employee['employee_code'];
        } catch (mysqli_sql_exception $insertError) {
            if ($conn->errno !== 1062) {
                $stmt->close();
                throw $insertError;
            }

            if ($codeWasTyped) {
                $stmt->close();
                echo json_encode(["success" => false, "message" => "That employee ID is already in use.", "code" => 400]);
                exit;
            }
        }

        $stmt->close();
    }

    if ($employeeCode === null) {
        echo json_encode(["success" => false, "message" => "Could not allocate an employee ID. Please try again.", "code" => 500]);
        exit;
    }

    echo json_encode([
        "success"      => true,
        "message"      => "Employee added successfully.",
        "code"         => 200,
        "employeeCode" => $employeeCode
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
