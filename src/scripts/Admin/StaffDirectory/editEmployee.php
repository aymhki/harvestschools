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

    $validation = staff_validate_employee($conn, $data, false);

    if (!$validation['success']) {
        echo json_encode($validation);
        exit;
    }

    $employee = $validation['employee'];


    $stmt = $conn->prepare("SELECT employee_code FROM staff_employees WHERE employee_code = ?");
    $stmt->bind_param("s", $employee['employee_code']);
    $stmt->execute();
    $employeeExists = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if (!$employeeExists) {
        echo json_encode(["success" => false, "message" => "That employee no longer exists.", "code" => 404]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT sort_order, name_en, name_ar, position_en, position_ar, subject_en, subject_ar, departments,
                display_style, is_public, email, phone, hire_date, notes, degree_en, degree_ar, fingerprint_code,
                classification, graduation_year, national_id, insurance_number, birth_date, address, basic_salary
         FROM staff_employees WHERE employee_code = ?"
    );
    $stmt->bind_param("s", $employee['employee_code']);
    $stmt->execute();
    $employeeBefore = $stmt->get_result()->fetch_assoc() ?: [];
    $stmt->close();

    $stmt = $conn->prepare(
        "UPDATE staff_employees
         SET sort_order = ?, name_en = ?, name_ar = ?, position_en = ?, position_ar = ?,
             subject_en = ?, subject_ar = ?, departments = ?, display_style = ?, is_public = ?,
             email = ?, phone = ?, hire_date = ?, notes = ?, degree_en = ?, degree_ar = ?, fingerprint_code = ?, classification = ?,
             graduation_year = ?, national_id = ?, insurance_number = ?, birth_date = ?, address = ?, basic_salary = ?
         WHERE employee_code = ?"
    );

    $stmt->bind_param(
        "issssssssissss" . "sssssssss" . "ds",
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
        $employee['basic_salary'],
        $employee['employee_code']
    );

    $stmt->execute();
    $stmt->close();

    admin_log_action($conn, 'Edited the staff directory entry for "' . $employee['name_en'] . '" (' . $employee['employee_code'] . '): ' . admin_changes_summary(
        ['Sort order' => $employeeBefore['sort_order'] ?? null, 'Name (EN)' => $employeeBefore['name_en'] ?? null, 'Name (AR)' => $employeeBefore['name_ar'] ?? null, 'Position (EN)' => $employeeBefore['position_en'] ?? null, 'Position (AR)' => $employeeBefore['position_ar'] ?? null, 'Subject (EN)' => $employeeBefore['subject_en'] ?? null, 'Subject (AR)' => $employeeBefore['subject_ar'] ?? null, 'Departments' => $employeeBefore['departments'] ?? null, 'Display style' => $employeeBefore['display_style'] ?? null, 'Email' => $employeeBefore['email'] ?? null, 'Phone' => $employeeBefore['phone'] ?? null, 'Hire date' => $employeeBefore['hire_date'] ?? null, 'Notes' => $employeeBefore['notes'] ?? null, 'Degree (EN)' => $employeeBefore['degree_en'] ?? null, 'Degree (AR)' => $employeeBefore['degree_ar'] ?? null, 'Fingerprint code' => $employeeBefore['fingerprint_code'] ?? null, 'Classification' => $employeeBefore['classification'] ?? null, 'Graduation year' => $employeeBefore['graduation_year'] ?? null, 'National ID' => $employeeBefore['national_id'] ?? null, 'Insurance number' => $employeeBefore['insurance_number'] ?? null, 'Birth date' => $employeeBefore['birth_date'] ?? null, 'Address' => $employeeBefore['address'] ?? null, 'Basic salary' => $employeeBefore['basic_salary'] ?? null, 'Shown on the website' => isset($employeeBefore['is_public']) ? (int)$employeeBefore['is_public'] === 1 : null],
        ['Sort order' => $employee['sort_order'], 'Name (EN)' => $employee['name_en'], 'Name (AR)' => $employee['name_ar'], 'Position (EN)' => $employee['position_en'], 'Position (AR)' => $employee['position_ar'], 'Subject (EN)' => $employee['subject_en'], 'Subject (AR)' => $employee['subject_ar'], 'Departments' => $employee['departments'], 'Display style' => $employee['display_style'], 'Email' => $employee['email'], 'Phone' => $employee['phone'], 'Hire date' => $employee['hire_date'], 'Notes' => $employee['notes'], 'Degree (EN)' => $employee['degree_en'], 'Degree (AR)' => $employee['degree_ar'], 'Fingerprint code' => $employee['fingerprint_code'], 'Classification' => $employee['classification'], 'Graduation year' => $employee['graduation_year'], 'National ID' => $employee['national_id'], 'Insurance number' => $employee['insurance_number'], 'Birth date' => $employee['birth_date'], 'Address' => $employee['address'], 'Basic salary' => $employee['basic_salary'], 'Shown on the website' => (int)$employee['is_public'] === 1]
    ) . '.', ADMIN_ACTION_CATEGORY_STAFF_DIRECTORY);
    echo json_encode([
        "success" => true,
        "message" => "Employee updated successfully.",
        "code"    => 200
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
