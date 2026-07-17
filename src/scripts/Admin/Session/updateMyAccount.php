<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);

    if (is_array($data) && ($data['action'] ?? '') === 'dismiss_passkey_prompt') {
        $stmt = $conn->prepare("UPDATE admin_users SET passkey_prompt_declined = 1 WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "code" => 200]);
        exit;
    }

    echo json_encode([
        "success"        => false,
        "message"        => "Verifying your identity is required to change your account details.",
        "stepUpRequired" => true,
        "stepUpAction"   => "update_profile",
        "code"           => 403
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}