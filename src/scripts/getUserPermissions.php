<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method Not Allowed", 405);
    }
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (!isset($data['session_id'])) {
        throw new Exception("Bad Request: Missing session_id", 400);
    }
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }
    $sessionId = $conn->real_escape_string($data['session_id']);
    $sql = "SELECT u.permission_level 
            FROM admin_sessions s
            JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
            WHERE s.id = '$sessionId'";
    $result = $conn->query($sql);
    if ($result->num_rows == 0) {
        throw new Exception("Invalid session", 404);
    }
    $row = $result->fetch_assoc();

    $cleanPermissionLevels = [];

    if ($row['permission_level'] === "0") {
        $cleanPermissionLevels = [0];
    }
    elseif ($row['permission_level'] !== "" && $row['permission_level'] !== null) {
        $permissionLevels = explode(',', $row['permission_level']);
        $cleanPermissionLevels = [];
        foreach ($permissionLevels as $level) {
            $trimmedLevel = trim($level);
            if ($trimmedLevel !== "") {
                $cleanPermissionLevels[] = intval($trimmedLevel);
            }
        }
    }

    echo json_encode($cleanPermissionLevels);
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>