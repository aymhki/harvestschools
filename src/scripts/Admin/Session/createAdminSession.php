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
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['username']) || !isset($input['user_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or user_id",
            "code" => 405
        ]);
        exit;
    }

    $user = $input['username'];
    $sessionId = get_bearer_token();
    $userId = $input['user_id'];

    $stmt = $conn->prepare("SELECT id FROM admin_sessions WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $checkResult = $stmt->get_result();
    $stmt->close();


    if ($checkResult->num_rows > 0) {
        $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ?");
        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {
            echo json_encode([
                "success" => false,
                "message" => "Internal Server Error: " . $conn->error,
                "code" => 500
            ]);
            exit;
        }

        $stmt->close();
    }

    $stmt = $conn->prepare("INSERT INTO admin_sessions (id, user_id) VALUES (?, ?)");
    $stmt->bind_param("si", $sessionId, $userId);

    if (!$stmt->execute()) {
        echo json_encode([
            "success" => false,
            "message" => "Internal Server Error: " . $conn->error,
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