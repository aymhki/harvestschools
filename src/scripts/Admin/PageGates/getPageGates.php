<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicPageInventory.php';
require_once __DIR__ . '/pageGateHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    global $PAGE_GATES_MANAGEMENT;
    $authStatus = check_admin_user_permission($conn, $PAGE_GATES_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $rows = page_gate_rows($conn);
    $pages = [];

    foreach (PUBLIC_PAGE_INVENTORY as $page) {
        $row = $rows[$page['id']] ?? null;

        $pages[] = [
            'pageId'    => $page['id'],
            'title'     => $page['titleEn'],
            'path'      => $page['path'],
            'section'   => $page['section'],
            'isEnabled' => $row === null || (int)$row['is_enabled'] === 1,
            'messageEn' => $row['message_en'] ?? null,
            'messageAr' => $row['message_ar'] ?? null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Page gates retrieved.",
        "code"    => 200,
        "pages"   => $pages
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
