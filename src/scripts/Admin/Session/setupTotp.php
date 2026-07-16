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

    $stmt = $conn->prepare("SELECT username FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $uname = $result->fetch_assoc()['username'];


    $secret = base32_encode_bytes(random_bytes(20));

    $stmt = $conn->prepare("UPDATE admin_users SET totp_secret_pending = ? WHERE id = ?");
    $stmt->bind_param("si", $secret, $userId);
    $stmt->execute();
    $stmt->close();

    $uri = "otpauth://totp/Harvest%20Admin:" . rawurlencode($uname) . "?secret={$secret}&issuer=Harvest%20Admin&digits=6&period=30";

    echo json_encode([
        "success"    => true,
        "code"       => 200,
        "secret"     => $secret,
        "otpauthUri" => $uri
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