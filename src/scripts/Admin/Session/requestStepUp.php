<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
require_once '../../accountActions.php';
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

    $data    = json_decode(file_get_contents('php://input'), true);
    $action  = is_array($data) ? (string)($data['action'] ?? '') : '';
    $payload = is_array($data) && isset($data['payload']) && is_array($data['payload']) ? $data['payload'] : [];

    if (!in_array($action, step_up_actions(), true)) {
        echo json_encode(["success" => false, "message" => "Unknown action", "code" => 400]);
        exit;
    }

    $mfaInfo = get_available_mfa_methods($conn, $userId);

    $removing = ['remove_email' => 'email', 'remove_totp' => 'totp', 'remove_passkey' => 'passkey'];

    if (isset($removing[$action])) {
        $mfaInfo['methods'] = array_values(array_diff($mfaInfo['methods'], [$removing[$action]]));

        if (!in_array($mfaInfo['preferred'], $mfaInfo['methods'], true)) {
            $mfaInfo['preferred'] = $mfaInfo['methods'][0] ?? null;
        }
    }

    if (empty($mfaInfo['methods'])) {
        echo json_encode([
            "success"          => false,
            "message"          => "Set up a login verification method before changing your account details.",
            "mfaSetupRequired" => true,
            "code"             => 428
        ]);
        exit;
    }

    $invalid = validate_step_up_action($conn, $userId, $action, $payload);
    if ($invalid !== null) { echo json_encode($invalid); exit; }

    $token = step_up_create($conn, $userId, $action, $payload);

    $emailSent  = false;
    $retryAfter = 0;

    if ($mfaInfo['preferred'] === 'email') {
        $stmt = $conn->prepare("SELECT email FROM admin_users WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $email = (string)($stmt->get_result()->fetch_assoc()['email'] ?? '');
        $stmt->close();

        $send       = step_up_send_email_code($conn, $userId, $token, $email);
        $emailSent  = $send['sent'];
        $retryAfter = $send['retryAfter'];
    }

    echo json_encode([
        "success"     => true,
        "code"        => 200,
        "stepUpToken" => $token,
        "action"      => $action,
        "methods"     => $mfaInfo['methods'],
        "preferred"   => $mfaInfo['preferred'],
        "maskedEmail" => $mfaInfo['masked_email'],
        "emailSent"   => $emailSent,
        "retryAfter"  => $retryAfter,
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}