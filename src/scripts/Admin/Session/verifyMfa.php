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

    $data     = json_decode(file_get_contents('php://input'), true);
    $mfaToken = $data['mfa_token'] ?? '';
    $method   = $data['method'] ?? '';
    $code     = trim($data['code'] ?? '');
    if (!$mfaToken || !in_array($method, ['email', 'totp'], true)) {
        echo json_encode(["success" => false, "message" => "Bad request", "code" => 400]); exit;
    }
    $mfaHash = hash('sha256', $mfaToken);

    $stmt = $conn->prepare(
        "SELECT c.user_id, c.email_code_hash, c.attempts, c.fingerprint_hash, u.totp_secret
         FROM admin_mfa_challenges c JOIN admin_users u ON u.id = c.user_id
         WHERE c.id = ? AND c.expires_at > NOW()"
    );
    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    if ($result->num_rows === 0) { echo json_encode(["success" => false, "message" => "Invalid or expired MFA session", "code" => 401]); exit; }
    $row    = $result->fetch_assoc();
    $userId = (int)$row['user_id'];

    if ((int)$row['attempts'] >= 5) {
        $conn->query("DELETE FROM admin_mfa_challenges WHERE id = '" . $conn->real_escape_string($mfaHash) . "'");
        log_admin_event($conn, $userId, 'mfa_fail', $row['fingerprint_hash']);
        echo json_encode(["success" => false, "message" => "Too many attempts. Log in again.", "code" => 429]); exit;
    }

    $ok = false;
    if ($method === 'email' && !empty($row['email_code_hash']) && strlen($code) === 6) {
        $ok = hash_equals($row['email_code_hash'], hash('sha256', $code));
    } elseif ($method === 'totp' && !empty($row['totp_secret'])) {
        $ok = totp_verify($row['totp_secret'], $code);
    }

    if (!$ok) {
        $stmt = $conn->prepare("UPDATE admin_mfa_challenges SET attempts = attempts + 1 WHERE id = ?");
        $stmt->bind_param("s", $mfaHash);
        $stmt->execute();
        $stmt->close();
        log_admin_event($conn, $userId, 'mfa_fail', $row['fingerprint_hash']);
        echo json_encode(["success" => false, "message" => "Incorrect code", "code" => 401]); exit;
    }

    $stmt = $conn->prepare("DELETE FROM admin_mfa_challenges WHERE id = ?");
    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE admin_users SET mfa_verified_once = 1, preferred_mfa = ? WHERE id = ?");
    $stmt->bind_param("si", $method, $userId);
    $stmt->execute();
    $stmt->close();

    $sessionToken = issue_admin_session($conn, $userId, $row['fingerprint_hash']);
    log_admin_event($conn, $userId, 'mfa_pass', $row['fingerprint_hash']);
    log_admin_event($conn, $userId, 'login_success', $row['fingerprint_hash']);

    $stmt = $conn->prepare("SELECT passkey_prompt_declined, (SELECT COUNT(*) FROM admin_passkeys WHERE user_id = ?) AS pk FROM admin_users WHERE id = ?");
    $stmt->bind_param("ii", $userId, $userId);
    $stmt->execute();
    $flags = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    echo json_encode([
        "success"       => true,
        "code"          => 200,
        "sessionToken"  => $sessionToken,
        "promptPasskey" => ((int)$flags['pk'] === 0 && !(int)$flags['passkey_prompt_declined']),
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false, "message" => $e->getMessage(), "code" => 500
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
