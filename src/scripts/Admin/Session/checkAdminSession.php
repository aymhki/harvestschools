<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
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

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare("SELECT name, username, id FROM admin_users WHERE id = ?");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Database statement preparation failed",
            "code"    => 500
        ]);
        exit;
    }

    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid session", "code" => 404]);
        exit;
    }

    $resultUser = $result->fetch_assoc();

    echo json_encode([
        "success"  => true,
        "message"  => "Session is valid",
        "code"     => 200,
        "name"     => $resultUser['name'],
        "username" => $resultUser['username'],
        "id"       => (int)$resultUser['id']
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code"    => $e->getCode() ?: 500,
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}