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

    $titleEn = gallery_trim($data['title_en'] ?? '', 255);
    $titleAr = gallery_trim($data['title_ar'] ?? '', 255);
    $sourceName = gallery_trim($data['file_name'] ?? '', 255);
    $totalBytes = (int)($data['total_bytes'] ?? 0);

    if ($titleEn === '' || $titleAr === '') {
        echo json_encode(gallery_error('Both the English and the Arabic title are required.', 400));
        exit;
    }

    if (!in_array(gallery_extension_of($sourceName), GALLERY_VIDEO_EXTENSIONS, true)) {
        echo json_encode(gallery_error('Only ' . implode(', ', GALLERY_VIDEO_EXTENSIONS) . ' videos are accepted.', 415));
        exit;
    }

    if ($totalBytes <= 0 || $totalBytes > GALLERY_MAX_VIDEO_BYTES) {
        echo json_encode(gallery_error('That video is larger than the 5 GB limit.', 413));
        exit;
    }

    if (gallery_pending_directory() === null || gallery_videos_directory() === null) {
        echo json_encode(gallery_error('The gallery folder could not be created on the server.', 500));
        exit;
    }

    $fileName = gallery_unique_video_file_name($conn, gallery_folder_name_from_title($titleEn));
    $sortOrder = gallery_next_sort_order($conn, 'gallery_videos');

    $stmt = $conn->prepare(
        "INSERT INTO gallery_videos (sort_order, title_en, title_ar, file_name, status, progress_percent)
         VALUES (?, ?, ?, ?, 'uploading', 0)"
    );
    $stmt->bind_param("isss", $sortOrder, $titleEn, $titleAr, $fileName);
    $stmt->execute();
    $videoId = (int)$conn->insert_id;
    $stmt->close();

    $paths = gallery_pending_paths($videoId);

    gallery_delete_file($paths['part']);
    gallery_delete_file($paths['progress']);

    echo json_encode([
        "success"   => true,
        "message"   => "Upload started.",
        "code"      => 200,
        "videoId"   => $videoId,
        "fileName"  => $fileName,
        "chunkSize" => gallery_upload_chunk_bytes(!empty($data['is_production']))
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
