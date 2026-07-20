<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
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
    $username = is_array($data) ? trim((string)($data['username'] ?? '')) : '';

    $fingerprint = is_array($data) && isset($data['fingerprint']) && is_string($data['fingerprint'])
        ? substr($data['fingerprint'], 0, 64)
        : null;

    if ($username === '') {
        echo json_encode(["success" => false, "message" => "Please enter your username", "code" => 400]);
        exit;
    }

    $requestOwnerKey = hash('sha256', 'reset_request:' . strtolower($username));
    $state = mfa_send_state($conn, 'reset_request', $requestOwnerKey);

    if (!$state['allowed']) {
        echo json_encode([
            "success"    => false,
            "message"    => "Too many reset requests for this account. Please wait before trying again.",
            "retryAfter" => (int)$state['retry_after'],
            "code"       => 429
        ]);
        exit;
    }

    mfa_record_send($conn, 'reset_request', $requestOwnerKey, 0);

    $noMfaResponse = [
        "success"       => true,
        "adminNotified" => true,
        "message"       => "This account has no verification methods set up, so it cannot be reset automatically. "
            . "An email has been sent to a site administrator who will reach out to help you regain access.",
        "code"          => 200
    ];

    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Username not found",
            "code"    => 404
        ]);
        exit;
    }

    $userId  = (int)$result->fetch_assoc()['id'];
    $mfaInfo = get_available_mfa_methods($conn, $userId);

    if (empty($mfaInfo['methods'])) {
        mfa_send_admin_reset_notice($conn, $userId, $username);
        log_admin_event($conn, $userId, 'reset_admin_notified', $fingerprint);
        echo json_encode($noMfaResponse);
        exit;
    }

    $stmt = $conn->prepare(
        "DELETE FROM admin_mfa_challenges
         WHERE (user_id = ? AND purpose = 'reset') OR expires_at < NOW()"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $resetToken = bin2hex(random_bytes(32));
    $resetHash  = hash('sha256', $resetToken);
    $ttl        = (int)mfa_config('challenge_ttl_seconds');
    $purpose    = 'reset';

    $stmt = $conn->prepare(
        "INSERT INTO admin_mfa_challenges (id, user_id, fingerprint_hash, purpose, expires_at)
         VALUES (?, ?, ?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("sissi", $resetHash, $userId, $fingerprint, $purpose, $ttl);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'reset_requested', $fingerprint);

    echo json_encode([
        "success"      => true,
        "mfa_required" => true,
        "resetToken"   => $resetToken,
        "methods"      => $mfaInfo['methods'],
        "preferred"    => $mfaInfo['preferred'],
        "maskedEmail"  => $mfaInfo['masked_email'],
        "code"         => 200,
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code"    => $e->getCode() ?: 500,
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
