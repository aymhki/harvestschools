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
            "message" => "Database connection failed",
            "code" => 500
        ]);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or password",
            "code" => 400
        ]);
        exit;
    }

    $user = $conn->real_escape_string($data['username']);
    $plainPassword = $conn->real_escape_string($data['password']);
    $sql = "SELECT * FROM admin_users WHERE username = '$user' AND password_hash = SHA2('$plainPassword', 256)";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "code" => 200
        ]);
    } else {
        $userCheckSql = "SELECT * FROM admin_users WHERE username = '$user'";
        $userResult = $conn->query($userCheckSql);

        if ($userResult->num_rows > 0) {
            echo json_encode([
                "success" => false,
                "message" => "Incorrect password",
                "code" => 401
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Username not found",
                "code" => 404
            ]);
        }
    }
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