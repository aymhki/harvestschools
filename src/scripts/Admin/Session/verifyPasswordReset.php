<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
require_once '../../webauthnHelpers.php';
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

    $data        = json_decode(file_get_contents('php://input'), true);
    $resetToken  = is_array($data) ? (string)($data['reset_token'] ?? '') : '';
    $method      = is_array($data) ? (string)($data['method'] ?? '') : '';
    $code        = is_array($data) ? trim((string)($data['code'] ?? '')) : '';
    $newPassword = is_array($data) ? (string)($data['new_password'] ?? '') : '';

    if ($resetToken === '' || !in_array($method, ['email', 'totp', 'passkey'], true)) {
        echo json_encode(["success" => false, "message" => "Bad request", "code" => 400]);
        exit;
    }

    if (strlen($newPassword) < 8 ||
        !preg_match('/[A-Z]/', $newPassword) ||
        !preg_match('/[a-z]/', $newPassword) ||
        !preg_match('/[0-9]/', $newPassword) ||
        !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
        echo json_encode([
            "success" => false,
            "message" => "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
            "code"    => 400
        ]);
        exit;
    }

    $resetHash = hash('sha256', $resetToken);
    $ownerKey  = mfa_owner_key_for_token($resetToken);

    $stmt = $conn->prepare(
        "SELECT c.user_id, c.attempts, c.fingerprint_hash, c.webauthn_challenge,
                u.totp_secret, u.last_totp_slice
         FROM admin_mfa_challenges c
         JOIN admin_users u ON u.id = c.user_id
         WHERE c.id = ? AND c.purpose = 'reset' AND c.expires_at > NOW()"
    );
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired reset session",
            "code"    => 401
        ]);
        exit;
    }

    $row    = $result->fetch_assoc();
    $userId = (int)$row['user_id'];

    $maxAttempts = (int)mfa_config('max_verify_attempts');

    if ((int)$row['attempts'] >= $maxAttempts) {
        $stmt = $conn->prepare("DELETE FROM admin_mfa_challenges WHERE id = ?");
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("UPDATE admin_mfa_codes SET consumed_at = NOW() WHERE purpose = 'reset' AND owner_key = ?");
        $stmt->bind_param("s", $ownerKey);
        $stmt->execute();
        $stmt->close();

        log_admin_event($conn, $userId, 'reset_fail', $row['fingerprint_hash']);
        echo json_encode([
            "success" => false,
            "message" => "Too many attempts. Start the reset again.",
            "code"    => 429
        ]);
        exit;
    }

    $ok = false;

    if ($method === 'email') {
        $ok = mfa_consume_email_code($conn, 'reset', $ownerKey, $code) !== null;

    } elseif ($method === 'totp') {
        if (empty($row['totp_secret'])) {
            echo json_encode([
                "success" => false,
                "message" => "No authenticator app is set up on this account",
                "code"    => 400
            ]);
            exit;
        }

        $ok = totp_verify_for_user($conn, $userId, $row, $code);

    } elseif ($method === 'passkey') {
        $credentialIdB64   = $data['id'] ?? '';
        $clientDataJSON    = base64_decode($data['clientDataJSON'] ?? '', true);
        $authenticatorData = base64_decode($data['authenticatorData'] ?? '', true);
        $signature         = base64_decode($data['signature'] ?? '', true);

        if (!$credentialIdB64 || empty($clientDataJSON) || empty($authenticatorData) || empty($signature)) {
            echo json_encode(["success" => false, "message" => "Bad Request: Missing credential data", "code" => 400]);
            exit;
        }

        if (empty($row['webauthn_challenge'])) {
            echo json_encode(["success" => false, "message" => "No pending passkey challenge. Please try again.", "code" => 400]);
            exit;
        }

        $stmt = $conn->prepare("SELECT id, public_key, sign_count FROM admin_passkeys WHERE user_id = ? AND credential_id = ?");
        $stmt->bind_param("is", $userId, $credentialIdB64);
        $stmt->execute();
        $pkResult = $stmt->get_result();
        $stmt->close();

        if ($pkResult->num_rows > 0) {
            $pkRow    = $pkResult->fetch_assoc();
            $webauthn = get_admin_webauthn_instance();

            try {
                $ok = $webauthn->processGet(
                    $clientDataJSON,
                    $authenticatorData,
                    $signature,
                    $pkRow['public_key'],
                    base64_decode($row['webauthn_challenge']),
                    (int)$pkRow['sign_count'],
                    true,
                    true
                );
            } catch (lbuchs\WebAuthn\WebAuthnException $e) {
                $ok = false;
            }

            if ($ok) {
                $newCounter = $webauthn->getSignatureCounter();
                if (!is_int($newCounter)) { $newCounter = (int)$pkRow['sign_count']; }

                $stmt = $conn->prepare("UPDATE admin_passkeys SET sign_count = ?, last_used = NOW() WHERE id = ?");
                $stmt->bind_param("ii", $newCounter, $pkRow['id']);
                $stmt->execute();
                $stmt->close();
            }
        }
    }

    if (!$ok) {
        $stmt = $conn->prepare(
            "UPDATE admin_mfa_challenges SET attempts = attempts + 1, webauthn_challenge = NULL WHERE id = ?"
        );
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();

        log_admin_event($conn, $userId, 'reset_fail', $row['fingerprint_hash']);

        $attemptsLeft = max(0, $maxAttempts - ((int)$row['attempts'] + 1));

        echo json_encode([
            "success"      => false,
            "message"      => $method === 'passkey' ? "Passkey verification failed" : "Incorrect code",
            "attemptsLeft" => $attemptsLeft,
            "code"         => 401
        ]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM admin_mfa_challenges WHERE id = ?");
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare(
        "UPDATE admin_mfa_codes SET consumed_at = NOW()
         WHERE purpose = 'reset' AND owner_key = ? AND consumed_at IS NULL"
    );
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $stmt->close();

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
    $stmt->bind_param("si", $hash, $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'password_reset', $row['fingerprint_hash']);

    echo json_encode([
        "success" => true,
        "message" => "Your password has been updated and all devices were signed out. You can now log in with your new password.",
        "code"    => 200
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
