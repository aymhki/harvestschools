<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
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

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);

    $clientDataJSON    = base64_decode($data['clientDataJSON'] ?? '', true);
    $attestationObject = base64_decode($data['attestationObject'] ?? '', true);
    $label             = mb_substr(trim($data['label'] ?? ''), 0, 100);

    if ($clientDataJSON === false || $attestationObject === false || empty($clientDataJSON) || empty($attestationObject)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing credential data", "code" => 400]);
        exit;
    }

    $tokenHash = get_bearer_token_hash();
    $stmt = $conn->prepare("SELECT webauthn_challenge FROM admin_sessions WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $challengeB64 = $result->num_rows > 0 ? $result->fetch_assoc()['webauthn_challenge'] : null;

    $stmt = $conn->prepare("UPDATE admin_sessions SET webauthn_challenge = NULL WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();

    if (empty($challengeB64)) {
        echo json_encode(["success" => false, "message" => "No pending passkey registration. Please start again.", "code" => 400]);
        exit;
    }

    $webauthn = get_webauthn_instance();

    $credentialData = $webauthn->processCreate(
        $clientDataJSON,
        $attestationObject,
        base64_decode($challengeB64),
        true,
        true
    );

    $credentialIdB64 = base64_encode($credentialData->credentialId);
    $publicKeyPem    = $credentialData->credentialPublicKey;
    $signCount       = (int)$credentialData->signatureCounter;

    $stmt = $conn->prepare("SELECT id FROM admin_passkeys WHERE credential_id = ?");
    $stmt->bind_param("s", $credentialIdB64);
    $stmt->execute();
    $dupResult = $stmt->get_result();
    $stmt->close();

    if ($dupResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "This passkey is already registered", "code" => 400]);
        exit;
    }

    if ($label === '') { $label = 'Passkey added ' . date('M j, Y'); }

    $stmt = $conn->prepare("INSERT INTO admin_passkeys (user_id, credential_id, public_key, sign_count, label) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issis", $userId, $credentialIdB64, $publicKeyPem, $signCount, $label);

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Could not save the passkey", "code" => 500]);
        exit;
    }

    $stmt->close();

    $stmt = $conn->prepare("UPDATE admin_users SET passkey_prompt_declined = 1 WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Passkey registered", "code" => 200]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey verification failed: " . $e->getMessage(), "code" => 400]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn)) { $conn->close(); }
}