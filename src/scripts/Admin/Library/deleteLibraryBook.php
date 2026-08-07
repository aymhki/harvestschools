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

    $bookId = (int)($data["book_id"] ?? 0);
    $categoryKey = library_category_for_book($conn, $bookId);

    if ($bookId <= 0 || $categoryKey === "") {
        echo json_encode(library_error("That book no longer exists.", 404));
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM library_books WHERE id = ?");
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $stmt->close();

    library_resequence($conn, $categoryKey);

    $warning = library_refresh_assistant_knowledge($conn, $doc_root);

    echo json_encode(["success" => true, "message" => "Book deleted." . ($warning ?? ""), "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
