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

    $videoId = (int)($data['video_id'] ?? 0);
    $video = gallery_video_by_id($conn, $videoId);

    if ($video === null) {
        echo json_encode(["success" => true, "message" => "That upload is already gone.", "code" => 200]);
        exit;
    }

    if ($video['status'] === 'ready') {
        echo json_encode(gallery_error('That video already finished uploading. Delete it instead.', 409));
        exit;
    }

    gallery_discard_pending_files($videoId);

    $videosDirectory = gallery_videos_directory();

    if ($videosDirectory !== null) {
        gallery_delete_file($videosDirectory . $video['file_name']);
    }

    $stmt = $conn->prepare("DELETE FROM gallery_videos WHERE id = ?");
    $stmt->bind_param("i", $videoId);
    $stmt->execute();
    $stmt->close();

    admin_log_action($conn, 'Cancelled the upload of the gallery video #' . $videoId . ' ("' . (string)$video['title_en'] . '").', ADMIN_ACTION_CATEGORY_GALLERY);
    echo json_encode(["success" => true, "message" => "Upload cancelled.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
