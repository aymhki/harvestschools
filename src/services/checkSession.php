<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "harvest_admin";
$password = "Hkibrahim@3";
$dbname = "harvest_schools";

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

    $sql = "SELECT username FROM sessions WHERE id = '$sessionId'";
    $result = $conn->query($sql);

    if ($result->num_rows == 0) {
        throw new Exception("Invalid session", 404);
    }

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    http_response_code($e->getCode());
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>
