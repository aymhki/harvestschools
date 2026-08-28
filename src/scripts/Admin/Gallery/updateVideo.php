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
        echo json_encode(gallery_error('That video does not exist.', 404));
        exit;
    }

    $titleEn = gallery_trim($data['title_en'] ?? '', 255);
    $titleAr = gallery_trim($data['title_ar'] ?? '', 255);
    $isPublic = !empty($data['is_public']) ? 1 : 0;
    $layout = ($data['layout'] ?? 'wide') === 'narrow' ? 'narrow' : 'wide';

    if ($titleEn === '' || $titleAr === '') {
        echo json_encode(gallery_error('Both the English and the Arabic title are required.', 400));
        exit;
    }

    $thumbnailAt = max(0, (float)($data['thumbnail_at'] ?? 0));
    $duration = $video['duration_seconds'] === null ? null : (float)$video['duration_seconds'];

    if ($duration !== null && $thumbnailAt > $duration) {
        echo json_encode(gallery_error('The thumbnail point is past the end of the video.', 400));
        exit;
    }

    $stmt = $conn->prepare("UPDATE gallery_videos SET title_en = ?, title_ar = ?, layout = ?, thumbnail_at = ?, is_public = ? WHERE id = ?");
    $stmt->bind_param("sssdii", $titleEn, $titleAr, $layout, $thumbnailAt, $isPublic, $videoId);
    $stmt->execute();
    $stmt->close();

    $placement = strtolower(trim((string)($data['placement'] ?? '')));

    if ($placement !== '' && $placement !== GALLERY_PLACEMENT_KEEP) {
        gallery_apply_placement(
            $conn,
            'gallery_videos',
            $videoId,
            gallery_placement_of($placement),
            (int)($data['after_id'] ?? 0),
            $video['media_date']
        );
    }

    $videoChanges = admin_changes_summary(
        ['Title (EN)' => $video['title_en'], 'Title (AR)' => $video['title_ar'], 'Layout' => $video['layout'], 'Cover frame (seconds)' => $video['thumbnail_at'], 'Shown on the website' => (int)$video['is_public'] === 1],
        ['Title (EN)' => $titleEn, 'Title (AR)' => $titleAr, 'Layout' => $layout, 'Cover frame (seconds)' => $thumbnailAt, 'Shown on the website' => $isPublic === 1]
    );
    $videoMoved = $placement !== '' && $placement !== GALLERY_PLACEMENT_KEEP;

    admin_log_action($conn, 'Edited the gallery video #' . $videoId . ' ("' . $titleEn . '"): ' . $videoChanges . ($videoMoved ? '; repositioned it (' . $placement . ')' : '') . '.');
    echo json_encode(["success" => true, "message" => "Video updated.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
