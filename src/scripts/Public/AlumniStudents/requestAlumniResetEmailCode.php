<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniResetHelpers.php';
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
    $ctx       = alumni_reset_context($lang);

    $stmt = $conn->prepare(
        "SELECT c.user_id, u.email
         FROM alumni_password_reset_challenges c
         JOIN alumni_students u ON u.id = c.user_id
         WHERE c.id = ? AND c.expires_at > NOW()"
    );
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset session", "code" => 401]);
        exit;
    }

    $row    = $result->fetch_assoc();
    $userId = (int)$row['user_id'];
    $email  = trim((string)$row['email']);

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Email verification is not available on this account. Use another method.", "code" => 400]);
        exit;
    }

    $state = pwreset_send_state($conn, $ctx, $ownerKey);
    if (!$state['allowed']) {
        $message = $state['reason'] === 'window_limit'
            ? 'You have requested too many codes. Please wait before trying again, or use another method.'
            : 'Please wait a moment before requesting another code.';
        echo json_encode([
            "success"    => false,
            "message"    => $message,
            "retryAfter" => (int)$state['retry_after'],
            "code"       => 429
        ]);
        exit;
    }

    pwreset_record_send($conn, $ctx, $ownerKey, $userId);
    $code = pwreset_issue_email_code($conn, $ctx, $ownerKey, $userId, $email);
    $sent = pwreset_send_code_email($ctx, $email, $code);

    if (!$sent) {
        echo json_encode(["success" => false, "message" => "Could not send the reset email. Please try another method.", "code" => 500]);
        exit;
    }

    $after = pwreset_send_state($conn, $ctx, $ownerKey);

    echo json_encode([
        "success"     => true,
        "message"     => "Code sent",
        "maskedEmail" => pwreset_mask_email($email),
        "retryAfter"  => (int)$after['retry_after'],
        "code"        => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
