<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../csvImportHelpers.php';
require_once __DIR__ . '/libraryHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, LIBRARY_PERMISSION);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $result = library_add_books($conn, [$data]);

    if ($result['failed'] !== []) {
        $first = $result['failed'][0];

        echo json_encode(["success" => false, "message" => $first['message'], "code" => 400]);
        exit;
    }

    admin_log_action($conn, 'Added a library book to the "' . (string)($data['category_key'] ?? '') . '" category — Title (EN): "' . (string)($data['title_en'] ?? '') . '"; Title (AR): "' . (string)($data['title_ar'] ?? '') . '"; Series (EN): ' . admin_action_value($data['series_en'] ?? '') . '; Series (AR): ' . admin_action_value($data['series_ar'] ?? '') . '; Shown on the website: ' . (empty($data['is_public']) ? 'No' : 'Yes') . '.');
    echo json_encode(["success" => true, "message" => "Book added.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
