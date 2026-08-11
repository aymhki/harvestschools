<?php

require_once __DIR__ . '/mediaToolchain.php';
require_once __DIR__ . '/publicMediaRoots.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';


$THUMBNAIL_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v'];

const VIDEO_THUMBNAIL_DEFAULT_SECONDS = 0.1;
const VIDEO_THUMBNAIL_DEFAULT_WIDTH = 1280;
const VIDEO_THUMBNAIL_MIN_WIDTH = 160;
const VIDEO_THUMBNAIL_MAX_WIDTH = 1600;
const VIDEO_THUMBNAIL_GENERATION_LIMIT = 60;


function video_thumbnail_fail($status, $message) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Cache-Control: no-store');

    if ($status === 503) {
        header('Retry-After: 300');
    }

    echo json_encode([
        "success" => false,
        "message" => $message
    ]);

    exit;
}


$requestedRoot = isset($_GET['root']) ? (string)$_GET['root'] : PUBLIC_MEDIA_DEFAULT_ROOT;

if (!public_media_root_exists($requestedRoot)) {
    video_thumbnail_fail(400, 'Unknown media root.');
}

$assetsBase = public_media_root($requestedRoot);

if ($assetsBase === null) {
    video_thumbnail_fail(500, 'Media root directory not found.');
}

$requested = isset($_GET['path']) ? trim($_GET['path'], '/') : '';

if ($requested === '') {
    video_thumbnail_fail(400, 'Missing path.');
}

$fullPath = realpath($assetsBase . $requested);

if ($fullPath === false || !is_file($fullPath)) {
    video_thumbnail_fail(404, 'Video not found.');
}

if (strpos($fullPath, $assetsBase) !== 0) {
    video_thumbnail_fail(403, 'Access denied.');
}

if (!in_array(strtolower(pathinfo($fullPath, PATHINFO_EXTENSION)), $THUMBNAIL_EXTENSIONS, true)) {
    video_thumbnail_fail(403, 'Type not permitted.');
}

$seconds = isset($_GET['t']) ? max(0, (float)$_GET['t']) : VIDEO_THUMBNAIL_DEFAULT_SECONDS;
$seconds = round($seconds, 1);

$width = isset($_GET['w']) ? (int)$_GET['w'] : VIDEO_THUMBNAIL_DEFAULT_WIDTH;
$width = min(VIDEO_THUMBNAIL_MAX_WIDTH, max(VIDEO_THUMBNAIL_MIN_WIDTH, $width));

$sourceModified = filemtime($fullPath);
$cacheDirectory = media_cache_directory('video-thumbnails');

if ($cacheDirectory === null) {
    video_thumbnail_fail(503, 'Thumbnail cache is unavailable.');
}

$cacheKey = md5($fullPath . '|' . $sourceModified . '|' . filesize($fullPath) . '|' . $seconds . '|' . $width);
$cachePath = $cacheDirectory . $cacheKey . '.jpg';

if (!is_file($cachePath)) {
    if (!public_rate_limit_allow('video-thumbnail-generation', VIDEO_THUMBNAIL_GENERATION_LIMIT, 60)) {
        public_rate_limit_reject();
    }

    if (media_tool_path('ffmpeg') === null) {
        video_thumbnail_fail(503, 'No video toolchain is available on this host.');
    }

    $workLock = media_acquire_work_lock($cachePath);

    if (!is_file($cachePath)) {
        $jobSlot = media_acquire_job_slot();

        if ($jobSlot === false) {
            media_release_work_lock($workLock);
            video_thumbnail_fail(503, 'The video toolchain is busy.');
        }

        media_extract_video_frame($fullPath, $seconds, $cachePath, $width);
        media_release_job_slot($jobSlot);
    }

    media_release_work_lock($workLock);
}

if (!is_file($cachePath)) {
    video_thumbnail_fail(503, 'The thumbnail could not be generated.');
}

$fileSize = filesize($cachePath);
$lastModified = filemtime($cachePath);
$etag = '"' . md5($cacheKey . $lastModified . $fileSize) . '"';

if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH']) && trim($_SERVER['HTTP_IF_NONE_MATCH']) === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $lastModified)
) {
    http_response_code(304);
    exit;
}

header('Content-Type: image/jpeg');
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');
header('Content-Length: ' . $fileSize);
header('Content-Disposition: inline; filename="' . pathinfo($fullPath, PATHINFO_FILENAME) . '.jpg"');

readfile($cachePath);
exit;
