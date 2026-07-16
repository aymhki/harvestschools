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

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data   = json_decode(file_get_contents('php://input'), true);
    $method = is_array($data) ? (string)($data['method'] ?? '') : '';

    if (!in_array($method, ['passkey', 'totp', 'email', 'auto'], true)) {
        echo json_encode(["success" => false, "message" => "Unknown method", "code" => 400]);
        exit;
    }


    if ($method === 'auto') {
        $stmt = $conn->prepare("UPDATE admin_users SET preferred_mfa = NULL WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        $mfaInfo = get_available_mfa_methods($conn, $userId);

        echo json_encode([
            "success"      => true,
            "message"      => "Preferred method cleared. The strongest available method will be offered first.",
            "preferredMfa" => null,
            "effectiveMfa" => $mfaInfo['preferred'],
            "code"         => 200
        ]);
        exit;
    }

    $mfaInfo = get_available_mfa_methods($conn, $userId);

    if (!in_array($method, $mfaInfo['methods'], true)) {
        $reason = [
            'passkey' => 'You have not registered a passkey yet.',
            'totp'    => 'You have not set up an authenticator app yet.',
            'email'   => 'You do not have a verified email address yet.',
        ][$method] ?? 'That method is not available on this account.';

        echo json_encode(["success" => false, "message" => $reason, "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE admin_users SET preferred_mfa = ? WHERE id = ?");
    $stmt->bind_param("si", $method, $userId);
    $stmt->execute();
    $stmt->close();

    $label = [
        'passkey' => 'Passkey',
        'totp'    => 'Authenticator app',
        'email'   => 'Email code',
    ][$method];

    echo json_encode([
        "success"      => true,
        "message"      => "{$label} will now be offered first when you log in.",
        "preferredMfa" => $method,
        "effectiveMfa" => $method,
        "code"         => 200
    ]);

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
