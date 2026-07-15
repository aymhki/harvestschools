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

    $stmt = $conn->prepare("SELECT * FROM admin_users WHERE username = ? AND password_hash = SHA2(?, 256)");

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
        $userId = $result->fetch_assoc()['id'];

        $fingerprint = isset($data['fingerprint']) && is_string($data['fingerprint'])
            ? substr($data['fingerprint'], 0, 64)
            : null;

        $sessionToken = bin2hex(random_bytes(32));
        $tokenHash    = hash('sha256', $sessionToken);

        $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ? AND last_seen < (NOW() - INTERVAL 12 HOUR)");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare(
            "DELETE FROM admin_sessions WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (
                SELECT id FROM admin_sessions WHERE user_id = ? ORDER BY last_seen DESC LIMIT 4
            ) keep
        )"
        );
        $stmt->bind_param("ii", $userId, $userId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("INSERT INTO admin_sessions (id, user_id, fingerprint_hash) VALUES (?, ?, ?)");
        $stmt->bind_param("sis", $tokenHash, $userId, $fingerprint);
        if (!$stmt->execute()) {
            echo json_encode(["success" => false, "message" => "Could not create session", "code" => 500]);
            exit;
        }
        $stmt->close();

        echo json_encode([
            "success"      => true,
            "message"      => "Login successful",
            "code"         => 200,
            "id"           => $userId,
            "sessionToken" => $sessionToken,
        ]);
    } else {
        $stmt = $conn->prepare("SELECT * FROM admin_users WHERE username = ?");
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