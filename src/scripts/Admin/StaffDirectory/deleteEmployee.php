<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/staffDirectoryHelpers.php';
require_once __DIR__ . '/../BorrowingSystem/borrowingHelpers.php';
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

    $employeeCode = staff_trim($data['employee_code'] ?? '', 32);

    if ($employeeCode === '') {
        echo json_encode(["success" => false, "message" => "Missing the employee to delete.", "code" => 400]);
        exit;
    }

    $borrowing = borrowing_on_employee_removed($conn, $employeeCode);

    if (!$borrowing['success']) {
        echo json_encode($borrowing);
        exit;
    }

    $stmt = $conn->prepare("SELECT name_en, position_en FROM staff_employees WHERE employee_code = ?");
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $employeeBefore = $stmt->get_result()->fetch_assoc() ?: [];
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM staff_employees WHERE employee_code = ?");
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $deletedRows = $stmt->affected_rows;
    $stmt->close();

    if ($deletedRows === 0) {
        echo json_encode(["success" => false, "message" => "That employee no longer exists.", "code" => 404]);
        exit;
    }

    admin_log_action($conn, 'Deleted employee ' . $employeeCode . ' ("' . (string)($employeeBefore['name_en'] ?? '') . '", ' . (string)($employeeBefore['position_en'] ?? '') . ') from the staff directory.');
    echo json_encode([
        "success" => true,
        "message" => trim("Employee deleted successfully. " . $borrowing['message']),
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
