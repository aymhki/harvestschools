<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/libraryHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

function moveColumnFirst(array $data, string $columnHeader): array {
    $headerRow = $data[0];
    $colIndex = array_search($columnHeader, $headerRow);
    if ($colIndex === false) {
        return $data;
    }
    foreach ($data as &$row) {
        $value = array_splice($row, $colIndex, 1);
        array_unshift($row, $value[0]);
    }
    unset($row);
    return $data;
}

try {
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

    $headers = ["Title (EN)", "Title (AR)", "Series (EN)", "Series (AR)", "Public", "Last Updated", "ID", "Book ID"];
    $byCategory = [];

    foreach (library_category_keys() as $categoryKey) {
        $byCategory[$categoryKey] = [$headers];
    }

    $result = $conn->query(
        "SELECT id, category_key, sort_order, title_en, title_ar, series_en, series_ar, is_public,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS updated_label
         FROM library_books
         ORDER BY category_key ASC, sort_order ASC"
    );

    while ($row = $result->fetch_assoc()) {
        if (!isset($byCategory[$row['category_key']])) {
            continue;
        }

        $byCategory[$row['category_key']][] = [
            (string)$row['title_en'],
            (string)$row['title_ar'],
            (string)$row['series_en'],
            (string)$row['series_ar'],
            library_int_to_yes_no($row['is_public']),
            (string)$row['updated_label'],
            (string)$row['sort_order'],
            (string)$row['id'],
        ];
    }

    $categories = [];

    foreach (LIBRARY_CATEGORIES as $categoryKey => $category) {
        $categories[] = [
            "key"             => $categoryKey,
            "label"           => library_category_label($categoryKey),
            "collection"      => $category['collection'],
            "collectionLabel" => library_collection_label($category['collection']),
            "books"           => moveColumnFirst($byCategory[$categoryKey], "ID"),
        ];
    }

    $collections = [];

    foreach (LIBRARY_COLLECTIONS as $key => $labels) {
        $collections[] = ["key" => $key, "label" => $labels['en']];
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code"    => 200,
        "data"    => ["collections" => $collections, "categories" => $categories]
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
