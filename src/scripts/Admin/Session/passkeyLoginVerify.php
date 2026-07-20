<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
require_once '../../webauthnHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

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

    $data = json_decode(file_get_contents('php://input'), true);

    $mfaToken          = $data['mfa_token'] ?? '';
    $credentialIdB64   = $data['id'] ?? '';
    $clientDataJSON    = base64_decode($data['clientDataJSON'] ?? '', true);
    $authenticatorData = base64_decode($data['authenticatorData'] ?? '', true);
    $signature         = base64_decode($data['signature'] ?? '', true);

    if (!$mfaToken || !$credentialIdB64 || $clientDataJSON === false || $authenticatorData === false || $signature === false
        || empty($clientDataJSON) || empty($authenticatorData) || empty($signature)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing credential data", "code" => 400]);
        exit;
    }

    $mfaHash = hash('sha256', $mfaToken);

    $stmt = $conn->prepare(
        "SELECT user_id, attempts, fingerprint_hash, webauthn_challenge
         FROM admin_mfa_challenges
         WHERE id = ? AND purpose = 'login' AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired MFA session", "code" => 401]);
        exit;
    }

    $challengeRow = $result->fetch_assoc();
    $userId       = (int)$challengeRow['user_id'];

    if ((int)$challengeRow['attempts'] >= 5) {
        $stmt = $conn->prepare("DELETE FROM admin_mfa_challenges WHERE id = ?");
        $stmt->bind_param("s", $mfaHash);
        $stmt->execute();
        $stmt->close();
        log_admin_event($conn, $userId, 'mfa_fail', $challengeRow['fingerprint_hash']);
        echo json_encode(["success" => false, "message" => "Too many attempts. Log in again.", "code" => 429]);
        exit;
    }

    if (empty($challengeRow['webauthn_challenge'])) {
        echo json_encode(["success" => false, "message" => "No pending passkey challenge. Please try again.", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, public_key, sign_count FROM admin_passkeys WHERE user_id = ? AND credential_id = ?");
    $stmt->bind_param("is", $userId, $credentialIdB64);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();

    $verified  = false;
    $pkRow     = null;
    $webauthn  = get_admin_webauthn_instance();
    $failMessage = "Passkey verification failed";

    if ($pkResult->num_rows > 0) {
        $pkRow = $pkResult->fetch_assoc();
        try {
            $verified = $webauthn->processGet(
                $clientDataJSON,
                $authenticatorData,
                $signature,
                $pkRow['public_key'],
                base64_decode($challengeRow['webauthn_challenge']),
                (int)$pkRow['sign_count'],
                true,
                true
            );
        } catch (lbuchs\WebAuthn\WebAuthnException $e) {
            $verified = false;
            $failMessage = "Passkey verification failed: " . $e->getMessage();
        }
    } else {
        $failMessage = "Unknown passkey for this account";
    }

    if (!$verified) {
        $stmt = $conn->prepare("UPDATE admin_mfa_challenges SET attempts = attempts + 1, webauthn_challenge = NULL WHERE id = ?");
        $stmt->bind_param("s", $mfaHash);
        $stmt->execute();
        $stmt->close();
        log_admin_event($conn, $userId, 'mfa_fail', $challengeRow['fingerprint_hash']);
        echo json_encode(["success" => false, "message" => $failMessage, "code" => 401]);
        exit;
    }


    $newCounter = $webauthn->getSignatureCounter();
    if (!is_int($newCounter)) { $newCounter = (int)$pkRow['sign_count']; }

    $stmt = $conn->prepare("UPDATE admin_passkeys SET sign_count = ?, last_used = NOW() WHERE id = ?");
    $stmt->bind_param("ii", $newCounter, $pkRow['id']);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM admin_mfa_challenges WHERE id = ?");
    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE admin_users SET mfa_verified_once = 1 WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    record_login_without_mfa($conn, $userId, true);

    $session = issue_admin_session($conn, $userId, $challengeRow['fingerprint_hash']);
    log_admin_event($conn, $userId, 'mfa_pass', $challengeRow['fingerprint_hash']);
    log_admin_event($conn, $userId, 'login_success', $challengeRow['fingerprint_hash']);

    echo json_encode([
        "success"       => true,
        "code"          => 200,
        "sessionToken"  => $session['token'],
        "deviceSecret"  => $session['deviceSecret'],
        "bindingMode"   => $session['bindingMode'],
        "promptPasskey" => false
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => 500
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}