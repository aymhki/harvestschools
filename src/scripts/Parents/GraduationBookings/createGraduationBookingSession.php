<?php
require_once '../../headers.php';
set_cors_headers();
$dbConfig = require '../../dbConfig.php';
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
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['username']) || !isset($input['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or session_id",
            "code" => 400
        ]);
        exit;
    }

    $user      = $input['username'];
    $sessionId = $input['session_id'];

    $stmt = $conn->prepare("SELECT id FROM graduation_booking_sessions WHERE username = ?");
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $checkResult = $stmt->get_result();
    $stmt->close();

    if ($checkResult->num_rows > 0) {
        $stmt = $conn->prepare("DELETE FROM graduation_booking_sessions WHERE username = ?");
        $stmt->bind_param("s", $user);
        if (!$stmt->execute()) {
            echo json_encode([
                "success" => false,
                "message" => "Failed to delete existing session: " . $stmt->error,
                "code" => 500
            ]);
            exit;
        }
        $stmt->close();
    }

    $stmt = $conn->prepare("INSERT INTO graduation_booking_sessions (username, id) VALUES (?, ?)");
    $stmt->bind_param("ss", $user, $sessionId);
    if (!$stmt->execute()) {
        echo json_encode([
            "success" => false,
            "message" => "Failed to create session: " . $stmt->error,
            "code" => 500
        ]);
        exit;
    }
    $stmt->close();

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
    if ($conn) {
        $conn->close();
    }
}
?>