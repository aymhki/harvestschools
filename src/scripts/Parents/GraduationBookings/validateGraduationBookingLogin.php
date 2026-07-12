<?php
require_once '../../headers.php';
set_cors_headers();
$dbConfig = require '../../../../configs/dbConfig.php';
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

    $conn->set_charset("utf8mb4");
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['username']) || !isset($data['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or password",
            "code" => 400
        ]);
        exit;
    }

    $user          = $data['username'];
    $plainPassword = $data['password'];
    $stmt = $conn->prepare("SELECT * FROM graduation_booking_auth_credentials WHERE username = ? AND password_hash = SHA2(?, 256)");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed: " . $conn->error,
            "code" => 500
        ]);
        exit;
    }

    $stmt->bind_param("ss", $user, $plainPassword);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "code" => 200,
            "id" => $result->fetch_assoc()['auth_id'],
        ]);
    } else {
        $stmt = $conn->prepare("SELECT * FROM graduation_booking_auth_credentials WHERE username = ?");
        $stmt->bind_param("s", $user);
        $stmt->execute();
        $userResult = $stmt->get_result();
        $stmt->close();

        if ($userResult->num_rows > 0) {
            echo json_encode([
                "success" => false,
                "message" => "Incorrect password",
                "code" => 401
            ]);
            exit;
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Username not found",
                "code" => 404
            ]);
            exit;
        }
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500
    ]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>