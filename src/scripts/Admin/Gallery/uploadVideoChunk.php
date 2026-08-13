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

    $videoId = (int)($_POST['video_id'] ?? 0);
    $video = gallery_video_by_id($conn, $videoId);

    if ($video === null || $video['status'] !== 'uploading') {
        echo json_encode(gallery_error('That upload is no longer open.', 409));
        exit;
    }

    $paths = gallery_pending_paths($videoId);

    if ($paths === null) {
        echo json_encode(gallery_error('The upload folder is unavailable on the server.', 500));
        exit;
    }

    $offset = (int)($_POST['offset'] ?? 0);
    $totalBytes = (int)($_POST['total_bytes'] ?? 0);
    $currentSize = is_file($paths['part']) ? (int)filesize($paths['part']) : 0;

    if ($offset !== $currentSize) {
        echo json_encode([
            "success"    => false,
            "message"    => "That chunk does not continue from where the upload stopped.",
            "code"       => 409,
            "resumeFrom" => $currentSize
        ]);
        exit;
    }

    $chunk = $_FILES['chunk'] ?? null;

    if (!is_array($chunk) || $chunk['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($chunk['tmp_name'])) {
        $reason = is_array($chunk) && (int)$chunk['error'] === UPLOAD_ERR_INI_SIZE
            ? 'This server only accepts uploads up to ' . ini_get('upload_max_filesize') . ' per request.'
            : 'A piece of the upload did not arrive correctly.';

        gallery_set_video_status($conn, $videoId, 'failed', 0, $reason);
        echo json_encode(gallery_error($reason, 400));
        exit;
    }

    if ($currentSize + (int)$chunk['size'] > GALLERY_MAX_VIDEO_BYTES) {
        gallery_set_video_status($conn, $videoId, 'failed', 0, 'That video is larger than the 5 GB limit.');
        echo json_encode(gallery_error('That video is larger than the 5 GB limit.', 413));
        exit;
    }

    $handle = @fopen($paths['part'], 'ab');

    if ($handle === false) {
        echo json_encode(gallery_error('The upload could not be written on the server.', 500));
        exit;
    }

    $written = false;

    if (flock($handle, LOCK_EX)) {
        $source = @fopen($chunk['tmp_name'], 'rb');

        if ($source !== false) {
            $written = stream_copy_to_stream($source, $handle) !== false;
            fclose($source);
        }

        fflush($handle);
        flock($handle, LOCK_UN);
    }

    fclose($handle);

    if (!$written) {
        gallery_set_video_status($conn, $videoId, 'failed', 0, 'The upload could not be written on the server.');
        echo json_encode(gallery_error('The upload could not be written on the server.', 500));
        exit;
    }

    clearstatcache(true, $paths['part']);
    $newSize = (int)filesize($paths['part']);
    $percent = $totalBytes > 0 ? (int)max(0, min(100, round($newSize / $totalBytes * 100))) : 0;

    gallery_set_video_status($conn, $videoId, 'uploading', $percent);

    echo json_encode([
        "success"         => true,
        "message"         => "Chunk received.",
        "code"            => 200,
        "receivedBytes"   => $newSize,
        "progressPercent" => $percent
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
