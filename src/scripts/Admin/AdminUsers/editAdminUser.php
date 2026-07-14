<?php

require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
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
    global $JACK_OF_ALL_TRADES;
    $authStatus = check_admin_user_permission($conn, $ADMIN_USER_MANAGEMENT);
    if (!$authStatus['success']) {
        $conn->rollback();
        echo json_encode($authStatus);
        exit;
    }

    $adminId = $data['edit_admin_id'] ?? '';
    $editUsername = $data['edit_admin_username'] ?? '';
    $editAdminName = $data['edit_admin_name'] ?? '';
    $editAdminPassword = $data['edit_admin_password']  ?? '';
    $editAdminConfirmPassword = $data['edit_admin_confirm_password'] ?? '';
    $editAdminPermissionLevel = $data['edit_admin_permissions'] ?? '';
    $theCurrentUserEditingId = $data['the_current_user_editing_id'] ?? '';

    if (empty($adminId) || !is_numeric($adminId)) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Valid Admin ID is required", "code" => 400]);
        exit;
    }

    if (strlen($editUsername) < 3 ||
        strlen($editUsername) > 20 ||
        (!preg_match('/^[a-zA-Z0-9_]+$/', $editUsername))
    ) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Username must be between 3 and 20 characters long and contain only letters, numbers, and underscores", "code" => 400]);
        exit;
    }

    $sql = "SELECT id FROM admin_users WHERE username = ? AND id != ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $editUsername, $adminId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]);
        exit;
    }

    $updatePassword = false;

    if (!empty($editAdminPassword)) {

        if ($editAdminPassword !== $editAdminConfirmPassword) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Passwords do not match", "code" => 400]);
            exit;
        }

        if (strlen($editAdminPassword) < 8 ||
            !preg_match('/[A-Z]/', $editAdminPassword) ||
            !preg_match('/[a-z]/', $editAdminPassword) ||
            !preg_match('/[0-9]/', $editAdminPassword) ||
            !preg_match('/[^a-zA-Z0-9]/', $editAdminPassword)
        ) {
            $conn->rollback();
            echo json_encode([
                "success" => false,
                "message" => "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                "code" => 400
            ]);
            exit;
        }
        $updatePassword = true;
    }

    if (is_array($editAdminPermissionLevel)) {
        $stmtPerms = $conn->prepare("SELECT permission_level_id FROM admin_users_permissions_linker WHERE admin_user_id = ?");
        $stmtPerms->bind_param("i", $adminId);
        $stmtPerms->execute();
        $currentPerms = array_column($stmtPerms->get_result()->fetch_all(MYSQLI_ASSOC), 'permission_level_id');
        $stmtPerms->close();

        $wasAdmin = in_array($ADMIN_USER_MANAGEMENT, $currentPerms);
        $wasJack = in_array($JACK_OF_ALL_TRADES, $currentPerms);
        $isAdmin = in_array($ADMIN_USER_MANAGEMENT, $editAdminPermissionLevel);
        $isJack = in_array($JACK_OF_ALL_TRADES, $editAdminPermissionLevel);

        if ($isAdmin && !$wasAdmin) $isJack = true;
        if ($isJack && !$wasJack) $isAdmin = true;
        if (!$isAdmin && $wasAdmin) $isJack = false;
        if (!$isJack && $wasJack) $isAdmin = false;

        $editAdminPermissionLevel = array_filter($editAdminPermissionLevel, fn($p) => $p != $ADMIN_USER_MANAGEMENT && $p != $JACK_OF_ALL_TRADES);
        if ($isAdmin) $editAdminPermissionLevel[] = $ADMIN_USER_MANAGEMENT;
        if ($isJack) $editAdminPermissionLevel[] = $JACK_OF_ALL_TRADES;
        $editAdminPermissionLevel = array_values($editAdminPermissionLevel);
    }

    $availablePermissions = $conn->query("SELECT permission_id FROM available_permissions")->fetch_all(MYSQLI_ASSOC);
    $permissionIds = array_map(fn($n) => (string)$n, array_column($availablePermissions, 'permission_id'));
    $invalidPermissionIds = array_diff($editAdminPermissionLevel, $permissionIds);

    if (!empty($invalidPermissionIds)) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Invalid permission level provided", "code" => 400]);
        exit;
    }

    if ($updatePassword) {
        $sql = "UPDATE admin_users SET username = ?, name = ?, password_hash = SHA2(?, 256) WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi", $editUsername, $editAdminName, $editAdminPassword, $adminId);
    } else {
        $sql = "UPDATE admin_users SET username = ?, name = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssi", $editUsername, $editAdminName, $adminId);
    }

    $stmt->execute();

    if ($stmt->affected_rows === 0 && $stmt->error === "") {
        $checkUser = $conn->query("SELECT id FROM admin_users WHERE id = " . intval($adminId));

        if ($checkUser->num_rows === 0) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "Admin user not found.", "code" => 404]);
            exit;
        }
    }

    $sql = "DELETE FROM admin_users_permissions_linker WHERE admin_user_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $adminId);
    $stmt->execute();

    foreach ($editAdminPermissionLevel as $permissionId) {
        $sql = "INSERT INTO admin_users_permissions_linker (admin_user_id, permission_level_id) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $adminId, $permissionId);
        $stmt->execute();
    }

    if ($updatePassword && $theCurrentUserEditingId == $adminId) {
        $deleteUserSessions = "DELETE FROM admin_sessions WHERE user_id = ?";
        $stmt = $conn->prepare($deleteUserSessions);
        $stmt->bind_param("i", $adminId);
        $stmt->execute();
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Admin user updated successfully", "code" => 200]);

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