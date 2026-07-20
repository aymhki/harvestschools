<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
require_once '../../webauthnHelpers.php';
require_once 'accountActions.php';
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

    $data   = json_decode(file_get_contents('php://input'), true);
    $token  = is_array($data) ? (string)($data['step_up_token'] ?? '') : '';
    $method = is_array($data) ? (string)($data['method'] ?? '') : '';
    $row    = step_up_load($conn, $token);

    if (!$row || (int)$row['user_id'] !== $userId) {
        echo json_encode(["success" => false, "message" => "This request expired. Start again.", "code" => 401]);
        exit;
    }

    $maxAttempts = (int)mfa_config('max_verify_attempts');

    if ((int)$row['attempts'] >= $maxAttempts) {
        step_up_delete($conn, $row['id']);
        log_admin_event($conn, $userId, 'step_up_fail', null);
        echo json_encode(["success" => false, "message" => "Too many attempts. Start again.", "code" => 429]);
        exit;
    }

    $ok = false;

    if ($method === 'email') {
        $ok = mfa_consume_email_code($conn, 'step_up', mfa_owner_key_for_token($token), (string)($data['code'] ?? '')) !== null;

    } elseif ($method === 'totp') {
        $stmt = $conn->prepare("SELECT totp_secret, last_totp_slice FROM admin_users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (empty($user['totp_secret'])) {
            echo json_encode(["success" => false, "message" => "No authenticator app is set up on this account", "code" => 400]);
            exit;
        }

        $ok = totp_verify_for_user($conn, $userId, $user, (string)($data['code'] ?? ''));

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

    } else {
        echo json_encode(["success" => false, "message" => "Unknown method", "code" => 400]);
        exit;
    }

    if (!$ok) {
        step_up_bump_attempts($conn, $row['id']);
        log_admin_event($conn, $userId, 'step_up_fail', null);

        echo json_encode([
            "success"      => false,
            "message"      => "Incorrect code",
            "attemptsLeft" => max(0, $maxAttempts - ((int)$row['attempts'] + 1)),
            "code"         => 401
        ]);
        exit;
    }

    $payload = json_decode((string)$row['payload'], true);
    if (!is_array($payload)) { $payload = []; }

    step_up_delete($conn, $row['id']);

    $stmt = $conn->prepare("UPDATE admin_mfa_codes SET consumed_at = NOW() WHERE purpose = 'step_up' AND owner_key = ? AND consumed_at IS NULL");
    $ownerKey = mfa_owner_key_for_token($token);
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'step_up_pass', null);

    $result = execute_step_up_action($conn, $userId, (string)$row['action'], $payload);
    $result['action'] = (string)$row['action'];

    echo json_encode($result);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}