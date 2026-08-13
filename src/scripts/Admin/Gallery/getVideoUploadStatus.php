<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
require_once __DIR__ . '/../../Public/General/mediaToolchain.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();


function gallery_finalise_encode($conn, $video, $paths, $videosDirectory) {
    if (!is_file($paths['output']) || filesize($paths['output']) <= 0) {
        gallery_set_video_status($conn, (int)$video['id'], 'failed', 0, 'The conversion produced no file.');

        return 'failed';
    }

    if (!@rename($paths['output'], $videosDirectory . $video['file_name'])) {
        gallery_set_video_status($conn, (int)$video['id'], 'failed', 0, 'The converted file could not be moved into the gallery.');

        return 'failed';
    }

    $probe = media_probe_video($videosDirectory . $video['file_name']);

    if ($probe['duration'] !== null) {
        $stmt = $conn->prepare("UPDATE gallery_videos SET duration_seconds = ? WHERE id = ?");
        $stmt->bind_param("di", $probe['duration'], $video['id']);
        $stmt->execute();
        $stmt->close();
    }

    gallery_set_video_status($conn, (int)$video['id'], 'ready', 100);

    gallery_delete_file($paths['part']);
    gallery_delete_file($paths['progress']);
    gallery_delete_file($paths['log']);
    gallery_delete_file($paths['pid']);

    return 'ready';
}

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

    $videosDirectory = gallery_videos_directory();
    $statuses = [];

    $result = $conn->query(
        "SELECT id, file_name, duration_seconds, status, progress_percent, status_message
         FROM gallery_videos
         WHERE status IN ('uploading', 'processing', 'failed')
         ORDER BY id ASC"
    );

    while ($video = $result->fetch_assoc()) {
        $videoId = (int)$video['id'];
        $status = (string)$video['status'];
        $percent = (int)$video['progress_percent'];
        $paths = gallery_pending_paths($videoId);

        if ($status === 'processing' && $paths !== null && $videosDirectory !== null) {
            $duration = $video['duration_seconds'] === null ? null : (float)$video['duration_seconds'];
            $encode = gallery_read_encode_progress($paths['progress'], $duration);

            if ($encode['finished']) {
                $status = gallery_finalise_encode($conn, $video, $paths, $videosDirectory);
                $percent = $status === 'ready' ? 100 : 0;
            } else {
                $percent = $encode['percent'];
                gallery_set_video_status($conn, $videoId, 'processing', $percent);
            }
        }

        $refreshed = gallery_video_by_id($conn, $videoId);

        $statuses[] = [
            'id'              => $videoId,
            'status'          => $status,
            'progressPercent' => $percent,
            'statusMessage'   => $refreshed === null ? '' : (string)$refreshed['status_message'],
        ];
    }

    echo json_encode([
        "success"  => true,
        "message"  => "Statuses retrieved.",
        "code"     => 200,
        "statuses" => $statuses
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
