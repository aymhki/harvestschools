<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
    if ($conn->connect_error) { echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]); exit; }
    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);

    if (($data['action'] ?? '') === 'dismiss_passkey_prompt') {
        $stmt = $conn->prepare("UPDATE admin_users SET passkey_prompt_declined = 1 WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => true, "code" => 200]); exit;
    }

    $currentPassword = $data['current_password'] ?? '';
    $stmt = $conn->prepare("SELECT password_hash FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $storedHash = $stmt->get_result()->fetch_assoc()['password_hash'];
    $stmt->close();
    if (!password_verify($currentPassword, $storedHash) && !hash_equals($storedHash, hash('sha256', $currentPassword))) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect", "code" => 401]); exit;
    }

    $newName     = trim($data['name'] ?? '');
    $newUsername = trim($data['username'] ?? '');
    $newEmail    = trim($data['email'] ?? '');
    $newPassword = $data['new_password'] ?? '';

    if (strlen($newUsername) < 3 || strlen($newUsername) > 20 || !preg_match('/^[a-zA-Z0-9_]+$/', $newUsername)) {
        echo json_encode(["success" => false, "message" => "Invalid username", "code" => 400]); exit;
    }
    if ($newEmail !== '' && !preg_match('/^[A-Za-z0-9._%+-]+@(harvestschools|alfajralbasem)\.com$/', $newEmail)) {
        echo json_encode(["success" => false, "message" => "Email must be @harvestschools.com or @alfajralbasem.com", "code" => 400]); exit;
    }
    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?");
    $stmt->bind_param("si", $newUsername, $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) { $stmt->close(); echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]); exit; }
    $stmt->close();

    if ($newPassword !== '') {
        if (strlen($newPassword) < 8 || !preg_match('/[A-Z]/', $newPassword) || !preg_match('/[a-z]/', $newPassword) ||
            !preg_match('/[0-9]/', $newPassword) || !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
            echo json_encode(["success" => false, "message" => "Password does not meet requirements", "code" => 400]); exit;
        }
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE admin_users SET name = ?, username = ?, email = NULLIF(?, ''), password_hash = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $newName, $newUsername, $newEmail, $hash, $userId);
        $stmt->execute();
        $stmt->close();
        $currentTokenHash = get_bearer_token_hash();
        $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ? AND id != ?");
        $stmt->bind_param("is", $userId, $currentTokenHash);
        $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("UPDATE admin_users SET name = ?, username = ?, email = NULLIF(?, '') WHERE id = ?");
        $stmt->bind_param("sssi", $newName, $newUsername, $newEmail, $userId);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Account updated",
        "code" => 200
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => 500
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}