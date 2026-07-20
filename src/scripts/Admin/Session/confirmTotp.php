<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
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

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);

    if (is_array($data) && ($data['action'] ?? '') === 'cancel') {
        $stmt = $conn->prepare(
            "UPDATE admin_users SET totp_secret_pending = NULL, totp_secret_pending_at = NULL WHERE id = ?"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Setup cancelled", "code" => 200]);
        exit;
    }

    $code = is_array($data) ? trim((string)($data['code'] ?? '')) : '';

    if (!preg_match('/^[0-9]{6}$/', $code)) {
        echo json_encode(["success" => false, "message" => "A 6-digit code is required", "code" => 400]);
        exit;
    }

    $ttl = (int)mfa_config('totp_pending_ttl_seconds');

    $stmt = $conn->prepare(
        "SELECT totp_secret_pending,
                (totp_secret_pending_at IS NULL
                 OR totp_secret_pending_at < (NOW() - INTERVAL ? SECOND)) AS expired
         FROM admin_users WHERE id = ?"
    );
    $stmt->bind_param("ii", $ttl, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $row           = $result->fetch_assoc();
    $pendingSecret = $row['totp_secret_pending'];

    if (empty($pendingSecret)) {
        echo json_encode([
            "success" => false,
            "message" => "No authenticator setup in progress. Start setup first.",
            "code"    => 400
        ]);
        exit;
    }

    if ((int)$row['expired'] === 1) {
        $stmt = $conn->prepare(
            "UPDATE admin_users SET totp_secret_pending = NULL, totp_secret_pending_at = NULL WHERE id = ?"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => false,
            "message" => "That setup expired. Start again to get a fresh QR code.",
            "code"    => 400
        ]);
        exit;
    }

    $slice = totp_match_slice($pendingSecret, $code);

    if ($slice === null) {
        echo json_encode([
            "success" => false,
            "message" => "Incorrect code. Check your authenticator app and try again.",
            "code"    => 401
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE admin_users
         SET totp_secret = totp_secret_pending,
             totp_secret_pending = NULL,
             totp_secret_pending_at = NULL,
             last_totp_slice = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ii", $slice, $userId);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'totp_enabled', null);

    $mfaInfo = get_available_mfa_methods($conn, $userId);

    echo json_encode([
        "success"      => true,
        "message"      => "Authenticator app enabled",
        "effectiveMfa" => $mfaInfo['preferred'],
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