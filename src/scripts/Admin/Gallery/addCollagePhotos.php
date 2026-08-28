<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
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
    $authorisation = gallery_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $collage = gallery_collage_by_id($conn, (int)($_POST['collage_id'] ?? 0));

    if ($collage === null) {
        echo json_encode(gallery_error('That collage does not exist.', 404));
        exit;
    }

    $files = gallery_uploaded_files('photos');

    if ($files === []) {
        echo json_encode(gallery_error('Please choose at least one photo to add.', 400));
        exit;
    }

    $stored = gallery_store_photos($conn, $collage, $files);

    if (!$stored['success']) {
        echo json_encode($stored);
        exit;
    }

    admin_log_action($conn, 'Added ' . $stored['stored'] . ' photo' . ($stored['stored'] === 1 ? '' : 's') . ' to the gallery collage #' . (int)$collage['id'] . ' ("' . (string)$collage['title_en'] . '") — ' . admin_list_summary(array_map(fn($file) => (string)($file['name'] ?? ''), $files)) . '.');
    echo json_encode([
        "success" => true,
        "message" => $stored['stored'] . ($stored['stored'] === 1 ? ' photo added.' : ' photos added.'),
        "code"    => 200
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
