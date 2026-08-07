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

    $validation = library_validate_book($data);

    if (!$validation["success"]) {
        echo json_encode($validation);
        exit;
    }

    $book = $validation["book"];

    $stmt = $conn->prepare(
        "INSERT INTO library_books (category_key, sort_order, title_en, title_ar, series_en, series_ar, is_public)
         VALUES (?, 0, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sssssi", $book["category_key"], $book["title_en"], $book["title_ar"], $book["series_en"], $book["series_ar"], $book["is_public"]);
    $stmt->execute();
    $stmt->close();

    library_resequence($conn, $book["category_key"]);

    $warning = library_refresh_assistant_knowledge($conn, $doc_root);

    echo json_encode(["success" => true, "message" => "Book added." . ($warning ?? ""), "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
