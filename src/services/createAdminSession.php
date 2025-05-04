<?php
header('Content-Type: application/json');

$dbConfig = require 'dbConfig.php';

$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['username']) || !isset($input['session_id'])) {
        throw new Exception("Bad Request: Missing username or session_id", 405);
    }

    $user = $conn->real_escape_string($input['username']);
    $sessionId = $conn->real_escape_string($input['session_id']);

    // Check and delete existing sessions for the username
    $checkSql = "SELECT id FROM sessions WHERE username = '$user'";
    $checkResult = $conn->query($checkSql);

    if ($checkResult->num_rows > 0) {
        $deleteSql = "DELETE FROM sessions WHERE username = '$user'";
        if (!$conn->query($deleteSql)) {
            throw new Exception("Internal Server Error: " . $conn->error, 500);
        }
    }

    // Insert the new session
    $insertSql = "INSERT INTO sessions (username, id) VALUES ('$user', '$sessionId')";
    if (!$conn->query($insertSql)) {
        throw new Exception("Internal Server Error: " . $conn->error, 500);
    }

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code($e->getCode());
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    $conn->close();
}
?>
