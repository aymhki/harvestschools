<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

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

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $passkeyId = $data['passkey_id'] ?? '';

    if (empty($passkeyId) || !is_numeric($passkeyId)) {
        echo json_encode(["success" => false, "message" => "Valid passkey ID is required", "code" => 400]);
        exit;
    }

    $passkeyId = (int)$passkeyId;

    $stmt = $conn->prepare("DELETE FROM admin_passkeys WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $passkeyId, $userId);
    $stmt->execute();
    $deleted = $stmt->affected_rows;
    $stmt->close();

    if ($deleted === 0) {
        echo json_encode(["success" => false, "message" => "Passkey not found", "code" => 404]);
        exit;
    }

    $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM admin_passkeys WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $remaining = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($remaining === 0) {
        $stmt = $conn->prepare("UPDATE admin_users SET preferred_mfa = NULL WHERE id = ? AND preferred_mfa = 'passkey'");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode(["success" => true, "message" => "Passkey removed", "code" => 200]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn)) { $conn->close(); }
}