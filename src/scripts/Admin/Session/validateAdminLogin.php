<?php
require_once '../../headers.php';
set_cors_headers();
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
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

    $stmt = $conn->prepare("SELECT id, password_hash FROM admin_users WHERE username = ?");

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Prepare failed", "code" => 500]);
        exit;
    }

    $stmt->bind_param("s", $user);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $genericFail = ["success" => false, "message" => "Invalid username or password", "code" => 401];

    if ($result->num_rows === 0) {
        echo json_encode($genericFail);
        exit;
    }

    $userRow    = $result->fetch_assoc();
    $userId     = (int)$userRow['id'];
    $storedHash = $userRow['password_hash'];
    $passwordOk = false;

    if (password_verify($plainPassword, $storedHash)) {
        $passwordOk = true;

        if (password_needs_rehash($storedHash, PASSWORD_DEFAULT)) {
            $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
            $up = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
            $up->bind_param("si", $newHash, $userId);
            $up->execute();
            $up->close();
        }

    } elseif (hash_equals($storedHash, hash('sha256', $plainPassword))) {
        $passwordOk = true;
        $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $up = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
        $up->bind_param("si", $newHash, $userId);
        $up->execute();
        $up->close();
    }

    if (!$passwordOk) {
        echo json_encode($genericFail);
        exit;
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