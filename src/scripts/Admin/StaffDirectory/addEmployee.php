<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../csvImportHelpers.php';
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

    $result = staff_add_employees($conn, [$data]);

    if ($result['failed'] !== []) {
        $first = $result['failed'][0];

        echo json_encode(["success" => false, "message" => $first['message'], "code" => 400]);
        exit;
    }

    $employeeCode = $result['codes'][0] ?? null;

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
