<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
$dbConfig = require 'dbConfig.php';
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
            "message" => "Connection failed: " . $conn->connect_error,
            "code" => 500
        ]);
        exit;
    }

    $sessionId = $conn->real_escape_string($data['session_id']);
    $sql = "SELECT username FROM booking_sessions WHERE id = '$sessionId'";
    $result = $conn->query($sql);

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
        "code" => 200
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