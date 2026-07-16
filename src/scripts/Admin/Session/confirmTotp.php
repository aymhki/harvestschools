<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
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

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $code = trim($data['code'] ?? '');

    if (!preg_match('/^[0-9]{6}$/', $code)) {
        echo json_encode(["success" => false, "message" => "A 6-digit code is required", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT totp_secret_pending FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $pendingSecret = $result->fetch_assoc()['totp_secret_pending'];

    if (empty($pendingSecret)) {
        echo json_encode(["success" => false, "message" => "No authenticator setup in progress. Start setup first.", "code" => 400]);
        exit;
    }

    if (!totp_verify($pendingSecret, $code)) {
        echo json_encode(["success" => false, "message" => "Incorrect code. Check your authenticator app and try again.", "code" => 401]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE admin_users SET totp_secret = totp_secret_pending, totp_secret_pending = NULL WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Authenticator app enabled", "code" => 200]);

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