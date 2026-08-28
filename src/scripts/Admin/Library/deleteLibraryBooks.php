<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
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

    $scope = trim((string)($data['scope'] ?? ''));
    $categoryKey = library_trim($data['category_key'] ?? '', 40);

    if ($scope !== 'all' && $scope !== 'category') {
        echo json_encode(library_error("Choose whether to delete every book or one category.", 400));
        exit;
    }

    if ($scope === 'category' && !library_category_exists($categoryKey)) {
        echo json_encode(library_error("That library category does not exist.", 404));
        exit;
    }

    if ($scope === 'all') {
        $stmt = $conn->prepare("DELETE FROM library_books");
    } else {
        $stmt = $conn->prepare("DELETE FROM library_books WHERE category_key = ?");
        $stmt->bind_param("s", $categoryKey);
    }

    $stmt->execute();
    $deleted = $stmt->affected_rows;
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => $deleted . ' book' . ($deleted === 1 ? '' : 's') . ' deleted.',
        "code"    => 200,
        "deleted" => $deleted
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
