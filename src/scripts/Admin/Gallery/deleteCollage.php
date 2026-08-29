<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
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
    $authorisation = gallery_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $collageId = (int)($data['collage_id'] ?? 0);
    $collage = gallery_collage_by_id($conn, $collageId);

    if ($collage === null) {
        echo json_encode(gallery_error('That collage does not exist.', 404));
        exit;
    }

    $directory = gallery_photos_directory((string)$collage['folder_name']);

    $stmt = $conn->prepare("SELECT file_name FROM gallery_photos WHERE collage_id = ?");
    $stmt->bind_param("i", $collageId);
    $stmt->execute();
    $photos = $stmt->get_result();
    $stmt->close();

    $deletedPhotoNames = [];

    while ($row = $photos->fetch_assoc()) {
        $deletedPhotoNames[] = (string)$row['file_name'];

        if ($directory !== null) {
            gallery_delete_file($directory . $row['file_name']);
        }
    }

    $stmt = $conn->prepare("DELETE FROM gallery_collages WHERE id = ?");
    $stmt->bind_param("i", $collageId);
    $stmt->execute();
    $stmt->close();

    if ($directory !== null) {
        @rmdir($directory);
    }

    admin_log_action($conn, 'Deleted the gallery collage #' . $collageId . ' ("' . (string)$collage['title_en'] . '" / "' . (string)$collage['title_ar'] . '", layout ' . (string)$collage['layout'] . ') and its ' . count($deletedPhotoNames) . ' photo' . (count($deletedPhotoNames) === 1 ? '' : 's') . ' (' . admin_list_summary($deletedPhotoNames) . ').', ADMIN_ACTION_CATEGORY_GALLERY);
    echo json_encode(["success" => true, "message" => "Collage deleted.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
