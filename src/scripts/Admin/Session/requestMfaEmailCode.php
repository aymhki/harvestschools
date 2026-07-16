<?php
require_once '../../headers.php';
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

    $data     = json_decode(file_get_contents('php://input'), true);
    $mfaToken = is_array($data) ? (string)($data['mfa_token'] ?? '') : '';

    if ($mfaToken === '') {
        echo json_encode(["success" => false, "message" => "Missing MFA token", "code" => 400]);
        exit;
    }

    $mfaHash  = hash('sha256', $mfaToken);
    $ownerKey = mfa_owner_key_for_token($mfaToken);

    $stmt = $conn->prepare(
        "SELECT c.user_id, u.email, u.email_verified_at
         FROM admin_mfa_challenges c
         JOIN admin_users u ON u.id = c.user_id
         WHERE c.id = ? AND c.expires_at > NOW()"
    );
    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired MFA session",
            "code"    => 401
        ]);
        exit;
    }

    $row    = $result->fetch_assoc();
    $userId = (int)$row['user_id'];

    if (empty($row['email'])) {
        echo json_encode(["success" => false, "message" => "No email on file", "code" => 400]);
        exit;
    }

    if (empty($row['email_verified_at'])) {
        echo json_encode([
            "success" => false,
            "message" => "The email on this account has not been verified yet. Use another method.",
            "code"    => 400
        ]);
        exit;
    }

    $state = mfa_send_state($conn, 'login', $ownerKey);

    if (!$state['allowed']) {
        $message = $state['reason'] === 'window_limit'
            ? 'You have requested too many codes. Please wait before trying again, or use another method.'
            : 'Please wait a moment before requesting another code.';

        http_response_code(200);
        echo json_encode([
            "success"    => false,
            "message"    => $message,
            "retryAfter" => (int)$state['retry_after'],
            "reason"     => $state['reason'],
            "code"       => 429
        ]);
        exit;
    }

    mfa_record_send($conn, 'login', $ownerKey, $userId);

    $code = mfa_issue_email_code($conn, 'login', $ownerKey, $userId, $row['email']);
    $sent = mfa_send_code_email($row['email'], $code, 'login');

    if (!$sent) {
        echo json_encode([
            "success" => false,
            "message" => "Could not send the verification email. Please try another method.",
            "code"    => 500
        ]);
        exit;
    }

    $after = mfa_send_state($conn, 'login', $ownerKey);

    echo json_encode([
        "success"        => true,
        "message"        => "Code sent",
        "maskedEmail"    => mask_email($row['email']),
        "retryAfter"     => (int)$after['retry_after'],
        "sendsRemaining" => (int)$after['remaining'],
        "activeCodes"    => mfa_active_code_count($conn, 'login', $ownerKey),
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
