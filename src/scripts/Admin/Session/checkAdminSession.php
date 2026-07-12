<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            "success" => false,
            "message" => "Method Not Allowed",
            "code" => 405
        ]);
        exit;
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $stmt = $conn->prepare("SELECT admin_users.name, admin_users.username, admin_users.id FROM admin_users JOIN admin_sessions ON admin_sessions.user_id = admin_users.id WHERE admin_sessions.id = ?");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Database statement preparation failed",
            "code" => 500
        ]);
        exit;
    }

    $sessionId = get_bearer_token();
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid session",
            "code" => 404
        ]);
        exit;
    }

    $resultUser = $result->fetch_assoc();

    $toReturn = [
        "success" => true,
        "message" => "Session is valid",
        "code" => 200,
        "name" => $resultUser['name'],
        "username" => $resultUser['username'],
        "id" => $resultUser['id']
    ];

    echo json_encode($toReturn);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500,
    ]);

} finally {
    if ($conn) {
        $conn->close();
    }
}
?>