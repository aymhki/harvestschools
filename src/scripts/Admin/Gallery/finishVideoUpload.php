<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
require_once __DIR__ . '/../../Public/General/mediaToolchain.php';
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

    if ($video === null || $video['status'] !== 'uploading') {
        echo json_encode(gallery_error('That upload is no longer open.', 409));
        exit;
    }

    $paths = gallery_pending_paths($videoId);
    $videosDirectory = gallery_videos_directory();

    if ($paths === null || $videosDirectory === null || !is_file($paths['part'])) {
        echo json_encode(gallery_error('The uploaded file is missing on the server.', 404));
        exit;
    }

    $probe = media_probe_video($paths['part']);
    $duration = $probe['duration'];
    $thumbnailAt = gallery_default_thumbnail_at($duration);

    $stmt = $conn->prepare("UPDATE gallery_videos SET duration_seconds = ?, thumbnail_at = ? WHERE id = ?");
    $stmt->bind_param("ddi", $duration, $thumbnailAt, $videoId);
    $stmt->execute();
    $stmt->close();

    $layout = ($data['layout'] ?? 'wide') === 'narrow' ? 'narrow' : 'wide';

    $stmt = $conn->prepare("UPDATE gallery_videos SET layout = ? WHERE id = ?");
    $stmt->bind_param("si", $layout, $videoId);
    $stmt->execute();
    $stmt->close();

    gallery_set_media_date($conn, 'gallery_videos', $videoId, $probe['recordedAt']);
    gallery_apply_placement(
        $conn,
        'gallery_videos',
        $videoId,
        gallery_placement_of($data['placement'] ?? ''),
        (int)($data['after_id'] ?? 0),
        $probe['recordedAt']
    );

    if (!gallery_needs_transcode($probe, gallery_extension_of($data['source_name'] ?? ''))) {
        if (!@rename($paths['part'], $videosDirectory . $video['file_name'])) {
            gallery_set_video_status($conn, $videoId, 'failed', 0, 'The file could not be moved into the gallery.');
            echo json_encode(gallery_error('The file could not be moved into the gallery.', 500));
            exit;
        }

        gallery_set_video_status($conn, $videoId, 'ready', 100);

        echo json_encode([
            "success" => true,
            "message" => "Upload finished.",
            "code"    => 200,
            "status"  => "ready"
        ]);
        exit;
    }

    $ffmpeg = media_tool_path('ffmpeg');

    if ($ffmpeg === null) {
        gallery_set_video_status($conn, $videoId, 'failed', 0, 'This video needs converting but the server has no ffmpeg.');
        echo json_encode(gallery_error('That video needs converting and this server has no video toolchain.', 503));
        exit;
    }

    gallery_delete_file($paths['progress']);
    gallery_delete_file($paths['output']);
    gallery_delete_file($paths['pid']);

    $sourceAudioCodec = strtolower(trim((string)($probe['audioCodec'] ?? '')));
    $mp4SafeAudioCodecs = ['aac', 'mp3', 'mp2', 'alac', 'ac3', 'eac3'];

    if (in_array($sourceAudioCodec, $mp4SafeAudioCodecs, true)) {
        $audioArguments = ['-c:a', 'copy'];
    } else {
        $audioArguments = ['-ac', '2', '-ar', '48000', '-af', 'aresample=async=1:first_pts=0', '-c:a', 'aac', '-b:a', '192k'];
    }

    $encodeCommand = [
        $ffmpeg,
        '-nostdin',
        '-hide_banner',
        '-loglevel', 'warning',
        '-y',
        '-i', $paths['part'],
        '-map', '0:v:0',
        '-map', '0:a:0?',
    ];

    array_push(
        $encodeCommand,
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-max_muxing_queue_size', '1024'
    );

    $cap = GALLERY_MAX_VIDEO_SHORT_SIDE;

    $encodeCommand[] = '-vf';
    $encodeCommand[] = "scale='if(gt(iw,ih),-2,min($cap,iw))':'if(gt(iw,ih),min($cap,ih),-2)'";

    $started = media_spawn_detached(array_merge($encodeCommand, $audioArguments, [
        '-movflags', '+faststart',
        '-progress', $paths['progress'],
        $paths['output'],
    ]), $paths['log'], $paths['pid']);

    if (!$started) {
        gallery_set_video_status($conn, $videoId, 'failed', 0, 'The conversion could not be started on this server.');
        echo json_encode(gallery_error('The conversion could not be started on this server.', 500));
        exit;
    }

    gallery_set_video_status($conn, $videoId, 'processing', 0);

    echo json_encode([
        "success" => true,
        "message" => "Converting the video.",
        "code"    => 200,
        "status"  => "processing"
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
