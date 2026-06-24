<?php
require_once '../../headers.php';
set_cors_headers();
$dbConfig = require '../../dbConfig.php';
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

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing session_id",
            "code" => 400
        ]);
        exit;
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            "success" => false,
            "message" => "Database connection failed",
            "code" => 500
        ]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $sessionId = $data['session_id'];
    $stmt = $conn->prepare("SELECT admin_sessions.username, admin_users.name FROM admin_sessions LEFT JOIN admin_users ON LOWER(admin_sessions.username) = LOWER(admin_users.username) WHERE admin_sessions.id = ?");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Database statement preparation failed",
            "code" => 500
        ]);
        exit;
    }

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

    echo json_encode([
        "success" => true,
        "message" => "Session is valid",
        "code" => 200,
        "username" => $result->fetch_assoc()['name']
    ]);

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