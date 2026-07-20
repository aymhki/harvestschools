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

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data  = json_decode(file_get_contents('php://input'), true);
    $token = is_array($data) ? (string)($data['step_up_token'] ?? '') : '';
    $row   = step_up_load($conn, $token);

    if (!$row || (int)$row['user_id'] !== $userId) {
        echo json_encode(["success" => false, "message" => "This request expired. Start again.", "code" => 401]);
        exit;
    }

    $credentialIds = [];
    $stmt = $conn->prepare("SELECT credential_id FROM admin_passkeys WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();

    while ($pkRow = $pkResult->fetch_assoc()) {
        $decoded = base64_decode($pkRow['credential_id'], true);
        if ($decoded !== false) { $credentialIds[] = $decoded; }
    }

    if (empty($credentialIds)) {
        echo json_encode(["success" => false, "message" => "No passkeys registered for this account", "code" => 400]);
        exit;
    }

    $webauthn = get_admin_webauthn_instance();
    $args     = $webauthn->getGetArgs($credentialIds, 240, true, true, true, true, true, 'required');
    $challenge = base64_encode($webauthn->getChallenge()->getBinaryString());

    $stmt = $conn->prepare("UPDATE admin_step_up_challenges SET webauthn_challenge = ? WHERE id = ?");
    $stmt->bind_param("ss", $challenge, $row['id']);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "options" => $args]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey verification failed: " . $e->getMessage(), "code" => 400]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}