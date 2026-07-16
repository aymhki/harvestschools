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

    $conn = new mysqli(
        $dbConfig['db_host'],
        $dbConfig['db_username'],
        $dbConfig['db_password'],
        $dbConfig['db_name']
    );

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare("SELECT pending_email FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $pendingEmail = $row['pending_email'] ?? '';

    if (empty($pendingEmail)) {
        echo json_encode([
            "success" => false,
            "message" => "There is no email address waiting to be verified.",
            "code"    => 400
        ]);
        exit;
    }

    $ownerKey = mfa_owner_key_for_user($userId);
    $state    = mfa_send_state($conn, 'email_verify', $ownerKey);

    if (!$state['allowed']) {
        $message = $state['reason'] === 'window_limit'
            ? 'You have requested too many codes. Please wait before trying again.'
            : 'Please wait a moment before requesting another code.';

        echo json_encode([
            "success"    => false,
            "message"    => $message,
            "retryAfter" => (int)$state['retry_after'],
            "reason"     => $state['reason'],
            "code"       => 429
        ]);
        exit;
    }

    mfa_record_send($conn, 'email_verify', $ownerKey, $userId);

    $code = mfa_issue_email_code($conn, 'email_verify', $ownerKey, $userId, $pendingEmail);
    $sent = mfa_send_code_email($pendingEmail, $code, 'email_verify');

    if (!$sent) {
        echo json_encode([
            "success" => false,
            "message" => "Could not send the verification email. Check the address and try again.",
            "code"    => 500
        ]);
        exit;
    }

    $after = mfa_send_state($conn, 'email_verify', $ownerKey);

    echo json_encode([
        "success"        => true,
        "message"        => "Verification code sent to " . $pendingEmail,
        "maskedEmail"    => mask_email($pendingEmail),
        "retryAfter"     => (int)$after['retry_after'],
        "sendsRemaining" => (int)$after['remaining'],
        "activeCodes"    => mfa_active_code_count($conn, 'email_verify', $ownerKey),
        "code"           => 200
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => 500
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
