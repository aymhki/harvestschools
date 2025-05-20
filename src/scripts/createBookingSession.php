<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

$conn = null;

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            "success" => false,
            "message" => "Connection failed: " . $conn->connect_error,
            "code" => 500
        ]);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['username']) || !isset($input['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or session_id",
            "code" => 400
        ]);
        exit;
    }

    $user = $conn->real_escape_string($input['username']);
    $sessionId = $conn->real_escape_string($input['session_id']);
    $checkSql = "SELECT id FROM booking_sessions WHERE username = '$user'";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        $deleteSql = "DELETE FROM booking_sessions WHERE username = '$user'";

        if (!$conn->query($deleteSql)) {
            echo json_encode([
                "success" => false,
                "message" => "Internal Server Error: " . $conn->error,
                "code" => 500
            ]);
            exit;
        }
    }

    $insertSql = "INSERT INTO booking_sessions (username, id) VALUES ('$user', '$sessionId')";

    if (!$conn->query($insertSql)) {
        echo json_encode([
            "success" => false,
            "message" => "Internal Server Error: " . $conn->error,
            "code" => 500
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Session created successfully",
        "code" => 200
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500,
    ]);
} finally {
    $conn->close();
}
?>