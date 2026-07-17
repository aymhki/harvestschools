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

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare(
        "SELECT name, username, email, email_verified_at, pending_email, preferred_mfa, logins_without_mfa,
                (totp_secret IS NOT NULL AND totp_secret <> '') AS has_totp,
                (totp_secret_pending IS NOT NULL AND totp_secret_pending <> ''
                 AND totp_secret_pending_at > (NOW() - INTERVAL ? SECOND)) AS totp_pending
         FROM admin_users WHERE id = ?"
    );
    $totpPendingTtl = (int)mfa_config('totp_pending_ttl_seconds');
    $stmt->bind_param("ii", $totpPendingTtl, $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $passkeys = [];

    $stmt = $conn->prepare(
        "SELECT id, label,
                DATE_FORMAT(created_at, '%b %e, %Y') AS created_label,
                DATE_FORMAT(last_used,  '%b %e, %Y') AS last_used_label
         FROM admin_passkeys WHERE user_id = ?
         ORDER BY created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();

    while ($pkRow = $pkResult->fetch_assoc()) {
        $passkeys[] = [
            "id"        => (int)$pkRow['id'],
            "label"     => $pkRow['label'],
            "createdAt" => $pkRow['created_label'],
            "lastUsed"  => $pkRow['last_used_label'],
        ];
    }

    $emailVerified = !empty($row['email']) && !empty($row['email_verified_at']);
    $mfaInfo = get_available_mfa_methods($conn, $userId);
    $verifySendState = null;

    if (!empty($row['pending_email'])) {
        $ownerKey        = mfa_owner_key_for_user($userId);
        $state           = mfa_send_state($conn, 'email_verify', $ownerKey);
        $verifySendState = [
            "retryAfter"     => (int)$state['retry_after'],
            "sendsRemaining" => (int)$state['remaining'],
        ];
    }

    echo json_encode(["success" => true, "code" => 200, "account" => [
        "name"             => $row['name'],
        "username"         => $row['username'],
        "email"            => $row['email'],
        "emailVerified"    => $emailVerified,
        "pendingEmail"     => $row['pending_email'],
        "preferredMfa"     => $row['preferred_mfa'],
        "effectiveMfa"     => $mfaInfo['preferred'],
        "availableMethods" => $mfaInfo['methods'],
        "hasTotp"          => (bool)$row['has_totp'],
        "totpSetupPending" => (bool)$row['totp_pending'],
        "passkeyCount"     => count($passkeys),
        "passkeys"         => $passkeys,
        "verifySendState"  => $verifySendState,
        "mfaMode"          => mfa_config('mfa_mode'),
        "graceUsed"        => (int)$row['logins_without_mfa'],
        "graceAllowed"     => (int)mfa_config('mfa_setup_grace_logins'),
        "gateClosed"       => empty($mfaInfo['methods']) && (int)$row['logins_without_mfa'] >= (int)mfa_config('mfa_setup_grace_logins'),
    ]]);

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