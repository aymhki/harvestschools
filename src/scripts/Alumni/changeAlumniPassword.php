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

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $userId = $sessionCheck['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);

    $currentPassword    = (string)($data['current_password'] ?? '');
    $newPassword        = (string)($data['new_password'] ?? '');
    $confirmNewPassword = (string)($data['confirm_new_password'] ?? '');

    if ($currentPassword === '' || $newPassword === '') {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing password fields", "code" => 400]);
        exit;
    }

    if ($newPassword !== $confirmNewPassword) {
        echo json_encode(["success" => false, "message" => "Passwords do not match", "code" => 400]);
        exit;
    }

    $passwordError = alumni_validate_password($newPassword);
    if ($passwordError !== null) {
        echo json_encode(["success" => false, "message" => $passwordError, "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT password_hash FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    $storedHash = (string)$result->fetch_assoc()['password_hash'];

    if ($storedHash === '' || !password_verify($currentPassword, $storedHash)) {
        log_alumni_event($conn, $userId, 'login_fail');
        echo json_encode(["success" => false, "message" => "Your current password is incorrect", "code" => 401]);
        exit;
    }

    $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE alumni_students SET password_hash = ? WHERE id = ?");
    $stmt->bind_param("si", $newHash, $userId);
    $stmt->execute();
    $stmt->close();

    $currentTokenHash = get_bearer_token_hash();
    $stmt = $conn->prepare("DELETE FROM alumni_sessions WHERE user_id = ? AND id != ?");
    $stmt->bind_param("is", $userId, $currentTokenHash);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Your password was changed successfully.", "code" => 200]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
