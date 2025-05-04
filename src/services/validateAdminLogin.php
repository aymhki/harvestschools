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

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        throw new Exception("Bad Request: Missing username or password", 405);
    }

    $user = $conn->real_escape_string($data['username']);
    $pass = $conn->real_escape_string($data['password']);

    $sql = "SELECT password FROM users WHERE username = '$user'";
    $result = $conn->query($sql);

    if ($result->num_rows == 0) {
        throw new Exception("Username not found", 404);
    }

    $row = $result->fetch_assoc();

    if ($pass !== $row['password']) {
        throw new Exception("Incorrect password", 401);
    }

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code($e->getCode());
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    $conn->close();
}
?>