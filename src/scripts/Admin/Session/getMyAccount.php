<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
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

    $stmt = $conn->prepare(
        "SELECT u.name, u.username, u.email, u.preferred_mfa,
                (u.totp_secret IS NOT NULL) AS has_totp,
                (SELECT COUNT(*) FROM admin_passkeys p WHERE p.user_id = u.id) AS passkey_count
         FROM admin_users u WHERE u.id = ?"
    );

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "account" => [
        "name"         => $row['name'],
        "username"     => $row['username'],
        "email"        => $row['email'],
        "preferredMfa" => $row['preferred_mfa'],
        "hasTotp"      => (bool)$row['has_totp'],
        "passkeyCount" => (int)$row['passkey_count'],
    ]]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false, "message" => $e->getMessage(), "code" => 500
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}