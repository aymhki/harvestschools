<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$dbConfig = require '../../dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];




try {
    $input = file_get_contents('php://input', true);
    $data = json_decode($input, true);

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $conn->begin_transaction();

    global $ADMIN_USER_MANAGEMENT;
    $authStatus = check_admin_user_permission($conn, $ADMIN_USER_MANAGEMENT);
    if (!$authStatus['success']) {
        $conn->rollback();
        echo json_encode($authStatus);
        exit;
    }

    $adminUserToDeleteId = $data['delete_admin_user_id'] ?? '';

    if (empty($adminUserToDeleteId) || !is_numeric($adminUserToDeleteId)) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Valid Admin ID is required", "code" => 400]);
    }

    $sql = "DELETE FROM admin_sessions WHERE user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $adminUserToDeleteId);
    $stmt->execute();

    $sql = "DELETE FROM admin_users WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $adminUserToDeleteId);
    $stmt->execute();

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Admin user deleted successfully", "code" => 200]);


} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }

    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}








?>