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

    if ($bookId <= 0 || library_category_for_book($conn, $bookId) === "") {
        echo json_encode(library_error("That book no longer exists.", 404));
        exit;
    }

    $validation = library_validate_book($data);

    if (!$validation["success"]) {
        echo json_encode($validation);
        exit;
    }

    $book = $validation["book"];

    $stmt = $conn->prepare("SELECT category_key, title_en, title_ar, series_en, series_ar, is_public FROM library_books WHERE id = ?");
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $bookBefore = $stmt->get_result()->fetch_assoc() ?: [];
    $stmt->close();

    $stmt = $conn->prepare(
        "UPDATE library_books SET category_key = ?, title_en = ?, title_ar = ?, series_en = ?, series_ar = ?, is_public = ?
         WHERE id = ?"
    );
    $stmt->bind_param("sssssii", $book["category_key"], $book["title_en"], $book["title_ar"], $book["series_en"], $book["series_ar"], $book["is_public"], $bookId);
    $stmt->execute();
    $stmt->close();

    library_resequence($conn, $book["category_key"]);

    admin_log_action($conn, 'Edited library book #' . $bookId . ' ("' . $book['title_en'] . '"): ' . admin_changes_summary(
        ['Category' => $bookBefore['category_key'] ?? null, 'Title (EN)' => $bookBefore['title_en'] ?? null, 'Title (AR)' => $bookBefore['title_ar'] ?? null, 'Series (EN)' => $bookBefore['series_en'] ?? null, 'Series (AR)' => $bookBefore['series_ar'] ?? null, 'Shown on the website' => isset($bookBefore['is_public']) ? (int)$bookBefore['is_public'] === 1 : null],
        ['Category' => $book['category_key'], 'Title (EN)' => $book['title_en'], 'Title (AR)' => $book['title_ar'], 'Series (EN)' => $book['series_en'], 'Series (AR)' => $book['series_ar'], 'Shown on the website' => (int)$book['is_public'] === 1]
    ) . '.', ADMIN_ACTION_CATEGORY_LIBRARY);
    echo json_encode(["success" => true, "message" => "Book updated.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
