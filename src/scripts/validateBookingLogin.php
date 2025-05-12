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
    $plainPassword = $conn->real_escape_string($data['password']);

    $sql = "SELECT * FROM booking_auth_credentials WHERE username = '$user' AND password_hash = SHA2('$plainPassword', 256)";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        echo json_encode(["success" => true]);
    } else {
        $userCheckSql = "SELECT * FROM booking_auth_credentials WHERE username = '$user'";
        $userResult = $conn->query($userCheckSql);

        if ($userResult->num_rows > 0) {
            throw new Exception("Incorrect password", 401);
        } else {
            throw new Exception("Username not found", 404);
        }
    }
} catch (Exception $e) {
    http_response_code($e->getCode());
    echo json_encode(["message" => $e->getMessage()]);
} finally {
    $conn->close();
}

?>