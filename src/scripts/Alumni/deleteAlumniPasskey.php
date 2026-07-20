<?php
require_once '../headers.php';
require_once 'alumniAuthHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_alumni_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $passkeyId = (int)($data['passkey_id'] ?? 0);

    if ($passkeyId <= 0) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing passkey id", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM alumni_passkeys WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $passkeyId, $userId);
    $stmt->execute();
    $deleted = $stmt->affected_rows > 0;
    $stmt->close();

    if (!$deleted) {
        echo json_encode(["success" => false, "message" => "Passkey not found", "code" => 404]);
        exit;
    }

    echo json_encode(["success" => true, "message" => "Passkey removed", "code" => 200]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
