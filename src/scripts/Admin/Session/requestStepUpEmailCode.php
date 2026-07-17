<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
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

    $data  = json_decode(file_get_contents('php://input'), true);
    $token = is_array($data) ? (string)($data['step_up_token'] ?? '') : '';
    $row   = step_up_load($conn, $token);

    if (!$row || (int)$row['user_id'] !== $userId) {
        echo json_encode(["success" => false, "message" => "This request expired. Start again.", "code" => 401]);
        exit;
    }

    $stmt = $conn->prepare("SELECT email, email_verified_at FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (empty($user['email']) || empty($user['email_verified_at'])) {
        echo json_encode(["success" => false, "message" => "No verified email on this account", "code" => 400]);
        exit;
    }

    $send = step_up_send_email_code($conn, $userId, $token, $user['email']);

    if (!$send['sent']) {
        echo json_encode([
            "success"    => false,
            "message"    => "Please wait before requesting another code.",
            "retryAfter" => $send['retryAfter'],
            "code"       => 429
        ]);
        exit;
    }

    echo json_encode([
        "success"     => true,
        "message"     => "Code sent",
        "maskedEmail" => mask_email($user['email']),
        "retryAfter"  => $send['retryAfter'],
        "code"        => 200
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
