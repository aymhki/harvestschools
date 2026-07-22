<?php
require_once '../../headers.php';
require_once 'graduationBookingAuthHelpers.php';
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

    $data       = json_decode(file_get_contents('php://input'), true);
    $resetToken = is_array($data) ? (string)($data['reset_token'] ?? '') : '';
    $lang       = (is_array($data) && ($data['lang'] ?? '') === 'ar') ? 'ar' : 'en';

    if ($resetToken === '') {
        echo json_encode(["success" => false, "message" => "Missing reset token", "code" => 400]);
        exit;
    }

    $resetHash = hash('sha256', $resetToken);
    $ownerKey  = pwreset_owner_key_for_token($resetToken);
    $ctx       = gb_reset_context($lang);

    $stmt = $conn->prepare(
        "SELECT auth_id FROM graduation_booking_password_reset_challenges
         WHERE id = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset session", "code" => 401]);
        exit;
    }

    $authId = (int)$result->fetch_assoc()['auth_id'];
    $emails = gb_parent_emails_for_auth($conn, $authId);

    if (empty($emails)) {
        echo json_encode(["success" => false, "message" => "No email is available on this booking.", "code" => 400]);
        exit;
    }

    $state = pwreset_send_state($conn, $ctx, $ownerKey);
    if (!$state['allowed']) {
        $message = $state['reason'] === 'window_limit'
            ? 'You have requested too many codes. Please wait before trying again.'
            : 'Please wait a moment before requesting another code.';
        echo json_encode([
            "success"    => false,
            "message"    => $message,
            "retryAfter" => (int)$state['retry_after'],
            "code"       => 429
        ]);
        exit;
    }

    pwreset_record_send($conn, $ctx, $ownerKey, $authId);

    $destinationLabel = implode(',', $emails);
    $code = pwreset_issue_email_code($conn, $ctx, $ownerKey, $authId, $destinationLabel);

    $sentAny = false;
    foreach ($emails as $email) {
        if (pwreset_send_code_email($ctx, $email, $code)) { $sentAny = true; }
    }

    if (!$sentAny) {
        echo json_encode(["success" => false, "message" => "Could not send the reset email. Please try again later.", "code" => 500]);
        exit;
    }

    $after  = pwreset_send_state($conn, $ctx, $ownerKey);
    $masked = array_map('pwreset_mask_email', $emails);

    echo json_encode([
        "success"      => true,
        "message"      => "Code sent",
        "maskedEmails" => $masked,
        "retryAfter"   => (int)$after['retry_after'],
        "code"         => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
