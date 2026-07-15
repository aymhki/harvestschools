<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $tokenHash = get_bearer_token_hash();

    if ($tokenHash) {
        $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE id = ?");
        $stmt->bind_param("s", $tokenHash);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode(["success" => true, "message" => "Logged out", "code" => 200]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn)) { $conn->close(); }
}
