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

function moveColumnFirst(array $data, string $columnHeader): array {
    $headerRow = $data[0];
    $colIndex = array_search($columnHeader, $headerRow);
    if ($colIndex === false) {
        return $data;
    }
    foreach ($data as &$row) {
        $value = array_splice($row, $colIndex, 1);
        array_unshift($row, $value[0]);
    }
    unset($row);
    return $data;
}

try {
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

    $headers = [
        "Employee ID", "Name (EN)", "Name (AR)", "Position (EN)", "Position (AR)",
        "Subject (EN)", "Subject (AR)", "Degree (EN)", "Degree (AR)", "Departments",
        "Display", "Public", "Classification", "Fingerprint Code", "Email", "Phone",
        "Address", "Birth Date", "Hire Date", "Graduation Year", "National ID",
        "Insurance Number", "Notes", "Basic Salary", "Last Updated", "ID"
    ];
    $rows = [];

    $result = $conn->query(
        "SELECT employee_code, sort_order, name_en, name_ar, position_en, position_ar,
                subject_en, subject_ar, degree_en, degree_ar, departments, display_style,
                is_public, classification, fingerprint_code, email, phone, address,
                birth_date, hire_date, graduation_year, national_id, insurance_number, notes,
                basic_salary,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS updated_label
         FROM staff_employees
         ORDER BY sort_order ASC"
    );

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            (string)$row['employee_code'],
            (string)$row['name_en'],
            (string)$row['name_ar'],
            (string)$row['position_en'],
            (string)$row['position_ar'],
            (string)$row['subject_en'],
            (string)$row['subject_ar'],
            (string)$row['degree_en'],
            (string)$row['degree_ar'],
            staff_departments_label($row['departments']),
            staff_display_style_label($row['display_style']),
            staff_int_to_yes_no($row['is_public']),
            (string)$row['classification'],
            (string)$row['fingerprint_code'],
            (string)$row['email'],
            (string)$row['phone'],
            (string)$row['address'],
            (string)($row['birth_date'] ?? ''),
            (string)($row['hire_date'] ?? ''),
            (string)$row['graduation_year'],
            (string)$row['national_id'],
            (string)$row['insurance_number'],
            (string)($row['notes'] ?? ''),
            (string)$row['basic_salary'],
            (string)$row['updated_label'],
            (string)$row['sort_order'],
        ];
    }

    $employees = moveColumnFirst(array_merge([$headers], $rows), "ID");

    $departments = [["key" => STAFF_ALL_DEPARTMENTS, "name" => staff_department_name(STAFF_ALL_DEPARTMENTS)]];

    foreach (staff_department_keys() as $departmentKey) {
        $departments[] = ["key" => $departmentKey, "name" => staff_department_name($departmentKey)];
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code"    => 200,
        "data"    => [
            "employees"     => $employees,
            "departments"   => $departments,
            "displayStyles" => array_values(STAFF_DISPLAY_STYLE_LABELS),
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
