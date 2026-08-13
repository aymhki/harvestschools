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

    $collages = [];
    $result = $conn->query(
        "SELECT c.id, c.folder_name, c.title_en, c.title_ar, c.layout, c.is_public, c.sort_order,
                COUNT(p.id) AS photo_count,
                DATE_FORMAT(c.updated_at, '%Y-%m-%d') AS updated_at
         FROM gallery_collages c
         LEFT JOIN gallery_photos p ON p.collage_id = c.id
         GROUP BY c.id, c.sort_order
         ORDER BY c.sort_order ASC, c.id ASC"
    );

    while ($row = $result->fetch_assoc()) {
        $collages[] = [
            'id'         => (int)$row['id'],
            'folderName' => (string)$row['folder_name'],
            'titleEn'    => (string)$row['title_en'],
            'titleAr'    => (string)$row['title_ar'],
            'layout'     => (string)$row['layout'],
            'isPublic'   => (int)$row['is_public'] === 1,
            'photoCount' => (int)$row['photo_count'],
            'updatedAt'  => (string)$row['updated_at'],
        ];
    }

    $photos = null;
    $openCollageId = isset($_GET['collage']) ? (int)$_GET['collage'] : 0;
    $openCollage = $openCollageId > 0 ? gallery_collage_by_id($conn, $openCollageId) : null;

    if ($openCollage !== null) {
        $photos = [['No.', 'Alt Text', 'File Name', 'Photo Path', 'Photo ID']];

        $stmt = $conn->prepare("SELECT id, file_name, sort_order FROM gallery_photos WHERE collage_id = ? ORDER BY sort_order ASC, id ASC");
        $stmt->bind_param("i", $openCollageId);
        $stmt->execute();
        $photoRows = $stmt->get_result();
        $stmt->close();

        $position = 1;

        while ($row = $photoRows->fetch_assoc()) {
            $photos[] = [
                (string)$position,
                (string)pathinfo((string)$row['file_name'], PATHINFO_FILENAME),
                (string)$row['file_name'],
                'photos/' . $openCollage['folder_name'] . '/' . $row['file_name'],
                (string)$row['id'],
            ];

            $position += 1;
        }
    }


    $videoRecords = [];
    $videos = [['No.', 'Title (EN)', 'Title (AR)', 'Video Path', 'File Name', 'Thumbnail At', 'Duration', 'Status', 'Shown', 'Video ID']];
    $result = $conn->query(
        "SELECT id, title_en, title_ar, file_name, thumbnail_at, duration_seconds, is_public,
                status, progress_percent, status_message, sort_order
         FROM gallery_videos
         ORDER BY sort_order ASC, id ASC"
    );

    $position = 1;

    while ($row = $result->fetch_assoc()) {
        $status = (string)$row['status'];
        $progress = (int)$row['progress_percent'];
        $statusLabel = $status === 'ready' ? 'Ready' : ucfirst($status) . ' ' . $progress . '%';

        if ($status === 'failed' && $row['status_message'] !== '') {
            $statusLabel = 'Failed: ' . $row['status_message'];
        }

        $duration = $row['duration_seconds'] === null
            ? ''
            : sprintf('%d:%02d', (int)((float)$row['duration_seconds'] / 60), (int)((float)$row['duration_seconds']) % 60);

        $videos[] = [
            (string)$position,
            (string)$row['title_en'],
            (string)$row['title_ar'],
            'videos/' . $row['file_name'],
            (string)$row['file_name'],
            rtrim(rtrim(number_format((float)$row['thumbnail_at'], 1, '.', ''), '0'), '.') . 's',
            $duration,
            $statusLabel,
            (int)$row['is_public'] === 1 ? 'Yes' : 'No',
            (string)$row['id'],
        ];

        $videoRecords[] = [
            'id'              => (int)$row['id'],
            'titleEn'         => (string)$row['title_en'],
            'titleAr'         => (string)$row['title_ar'],
            'fileName'        => (string)$row['file_name'],
            'thumbnailAt'     => (float)$row['thumbnail_at'],
            'durationSeconds' => $row['duration_seconds'] === null ? null : (float)$row['duration_seconds'],
            'isPublic'        => (int)$row['is_public'] === 1,
            'status'          => $status,
            'progressPercent' => $progress,
        ];

        $position += 1;
    }

    echo json_encode([
        "success"      => true,
        "message"      => "Gallery retrieved.",
        "code"         => 200,
        "collages"     => $collages,
        "photos"       => $photos,
        "videos"       => $videos,
        "videoRecords" => $videoRecords
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
