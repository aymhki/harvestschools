<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$dbConfig = require '../../../../configs/dbConfig.php';
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

    global $ADMIN_USER_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $conn->begin_transaction();
    $authStatus = check_admin_user_permission($conn, $ADMIN_USER_MANAGEMENT);

    if (!$authStatus['success']) {
        $conn->rollback();
        echo json_encode($authStatus);
        exit;
    }

    $newUsername = $data['new_admin_username'] ?? '';
    $newAdminName = $data['new_admin_name'] ?? '';
    $newAdminPassword = $data['new_admin_password']  ?? '';
    $newAdminConfirmPassword = $data['new_admin_confirm_password'] ?? '';
    $newAdminPermissionLevel = $data['new_admin_permissions'] ?? '';

    if (strlen($newUsername) < 3 ||
        strlen($newUsername) > 20 ||
        (!preg_match('/^[a-zA-Z0-9_]+$/', $newUsername))
    ) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Username must be between 3 and 20 characters long and contain only letters, numbers, and underscores", "code" => 400]);
        exit;
    }

    $sql = "SELECT id FROM admin_users WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $newUsername);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]);
        exit;
    }

    if ($newAdminPassword !== $newAdminConfirmPassword) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Passwords do not match", "code" => 400]);
        exit;
    }

    if (strlen($newAdminPassword) < 8 ||
        !preg_match('/[A-Z]/', $newAdminPassword) ||
        !preg_match('/[a-z]/', $newAdminPassword) ||
        !preg_match('/[0-9]/', $newAdminPassword) ||
        !preg_match('/[^a-zA-Z0-9]/', $newAdminPassword)
    ) {
        $conn->rollback();
        echo json_encode(
            [
                "success" => false,
                "message" => "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                "code" => 400
            ]
        );

        exit;
    }

    $permissionLevels = preg_split('/\s*,\s*/', $newAdminPermissionLevel, -1, PREG_SPLIT_NO_EMPTY);

    foreach ($permissionLevels as $level) {
        if (!is_numeric($level) ) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Invalid permission level", "code" => 400]);
            exit;
        }
    }

    $availablePermissions = $conn->query("SELECT permission_id FROM available_permissions");
    $permissionIds = array_map('intval', $permissionLevels);
    $invalidPermissionIds = array_diff($permissionIds, array_column($availablePermissions->fetch_all(MYSQLI_ASSOC), 'permission_id'));

    if (!empty($invalidPermissionIds)) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Invalid permission level", "code" => 400]);
        exit;
    }


    $sql = "INSERT INTO admin_users (username, name, password_hash, permission_level) VALUES (?, ?, SHA2(?, 256), ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $newUsername, $newAdminName, $newAdminPassword, $newAdminPermissionLevel);
    $stmt->execute();

    $conn->commit();

    echo json_encode(["success" => true, "message" => "Admin user created successfully", "code" => 200]);

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) ) {
        $conn->close();
    }
}
