<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniResetHelpers.php';
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

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
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
    $ctx         = alumni_reset_context('en');

    if ($resetToken === '' || !in_array($method, ['email', 'passkey'], true)) {
        echo json_encode(["success" => false, "message" => "Bad request", "code" => 400]);
        exit;
    }

    $policyError = alumni_validate_password($newPassword);
    if ($policyError !== null) {
        echo json_encode(["success" => false, "message" => $policyError, "code" => 400]);
        exit;
    }

    $resetHash = hash('sha256', $resetToken);
    $ownerKey  = pwreset_owner_key_for_token($resetToken);

    $stmt = $conn->prepare(
        "SELECT user_id, attempts, webauthn_challenge
         FROM alumni_password_reset_challenges
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

    $row    = $result->fetch_assoc();
    $userId = (int)$row['user_id'];
    $maxAttempts = alumni_reset_max_attempts();

    if (pwreset_attempts_exceeded($row['attempts'], $maxAttempts)) {
        $stmt = $conn->prepare("DELETE FROM alumni_password_reset_challenges WHERE id = ?");
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();
        pwreset_invalidate_codes($conn, $ctx, $ownerKey);
        log_alumni_event($conn, $userId, 'login_fail');

        echo json_encode(["success" => false, "message" => "Too many attempts. Please start the reset again.", "code" => 429]);
        exit;
    }

    $ok = false;

    if ($method === 'email') {
        $ok = pwreset_consume_email_code($conn, $ctx, $ownerKey, $code) !== null;

    } elseif ($method === 'passkey') {
        $credentialIdB64   = (string)($data['id'] ?? '');
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

        $stmt = $conn->prepare("SELECT id, public_key, sign_count FROM alumni_passkeys WHERE user_id = ? AND credential_id = ?");
        $stmt->bind_param("is", $userId, $credentialIdB64);
        $stmt->execute();
        $pkResult = $stmt->get_result();
        $stmt->close();

        if ($pkResult->num_rows > 0) {
            $pkRow    = $pkResult->fetch_assoc();
            $webauthn = get_webauthn_instance();
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
                $newCount = (int)$webauthn->getSignatureCounter();
                if ($newCount > 0) {
                    $stmt = $conn->prepare("UPDATE alumni_passkeys SET sign_count = ? WHERE id = ?");
                    $stmt->bind_param("ii", $newCount, $pkRow['id']);
                    $stmt->execute();
                    $stmt->close();
                }
            }
        }
    }

    if (!$ok) {
        $stmt = $conn->prepare(
            "UPDATE alumni_password_reset_challenges SET attempts = attempts + 1, webauthn_challenge = NULL WHERE id = ?"
        );
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();
        log_alumni_event($conn, $userId, 'login_fail');

        $attemptsLeft = max(0, $maxAttempts - ((int)$row['attempts'] + 1));
        echo json_encode([
            "success"      => false,
            "message"      => $method === 'passkey' ? "Passkey verification failed" : "Incorrect code",
            "attemptsLeft" => $attemptsLeft,
            "code"         => 401
        ]);
        exit;
    }

    // Success -> update password (bcrypt), clear challenge, sign out everywhere.
    $stmt = $conn->prepare("DELETE FROM alumni_password_reset_challenges WHERE id = ?");
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $stmt->close();

    pwreset_invalidate_codes($conn, $ctx, $ownerKey);

    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE alumni_students SET password_hash = ? WHERE id = ?");
    $stmt->bind_param("si", $hash, $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM alumni_sessions WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Your password has been updated and all devices were signed out. You can now log in with your new password.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
