<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once 'mfaHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli(
        $dbConfig['db_host'],
        $dbConfig['db_username'],
        $dbConfig['db_password'],
        $dbConfig['db_name']
    );

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $currentTokenHash = get_bearer_token_hash();
    $data             = json_decode(file_get_contents('php://input'), true);

    if (is_array($data) && ($data['action'] ?? '') === 'all_others') {
        $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE user_id = ? AND id != ?");
        $stmt->bind_param("is", $userId, $currentTokenHash);
        $stmt->execute();
        $revoked = $stmt->affected_rows;
        $stmt->close();

        log_admin_event($conn, $userId, 'sessions_revoked_all', null);

        echo json_encode([
            "success" => true,
            "message" => $revoked === 0 ? "No other sessions were active." : "Signed out of {$revoked} other " . ($revoked === 1 ? "session" : "sessions") . ".",
            "revoked" => $revoked,
            "code"    => 200
        ]);
        exit;
    }

    $publicId = is_array($data) ? trim((string)($data['public_id'] ?? '')) : '';

    if (!preg_match('/^[0-9a-f]{32}$/', $publicId)) {
        echo json_encode(["success" => false, "message" => "Invalid session reference", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM admin_sessions WHERE public_id = ? AND user_id = ?");
    $stmt->bind_param("si", $publicId, $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "Session not found", "code" => 404]);
        exit;
    }

    $isCurrent = hash_equals((string)$row['id'], (string)$currentTokenHash);

    $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE public_id = ? AND user_id = ?");
    $stmt->bind_param("si", $publicId, $userId);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'session_revoked', null);

    if ($isCurrent) {
        clear_device_binding_cookie();
    }

    echo json_encode([
        "success"          => true,
        "message"          => $isCurrent ? "Signed out." : "That session has been signed out.",
        "revokedCurrent"   => $isCurrent,
        "code"             => 200
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
