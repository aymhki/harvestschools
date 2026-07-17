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

    $stmt = $conn->prepare("SELECT username, name FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $userRow = $result->fetch_assoc();

    $excludeIds = [];
    $stmt = $conn->prepare("SELECT credential_id FROM admin_passkeys WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();

    while ($pkRow = $pkResult->fetch_assoc()) {
        $decoded = base64_decode($pkRow['credential_id'], true);
        if ($decoded !== false) { $excludeIds[] = $decoded; }
    }

    $webauthn = get_webauthn_instance();

    $args = $webauthn->getCreateArgs(
        (string)$userId,
        $userRow['username'],
        $userRow['name'] ?: $userRow['username'],
        240,
        true,
        'required',
        null,
        $excludeIds
    );


    $challenge = base64_encode($webauthn->getChallenge()->getBinaryString());
    $tokenHash = get_bearer_token_hash();

    $stmt = $conn->prepare("UPDATE admin_sessions SET webauthn_challenge = ? WHERE id = ?");
    $stmt->bind_param("ss", $challenge, $tokenHash);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "options" => $args]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey setup failed: " . $e->getMessage(), "code" => 400]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn)) { $conn->close(); }
}
