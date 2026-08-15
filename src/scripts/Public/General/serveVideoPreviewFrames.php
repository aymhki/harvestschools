<?php

require_once __DIR__ . '/mediaToolchain.php';
require_once __DIR__ . '/publicMediaRoots.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';
require_once __DIR__ . '/../../headers.php';

set_public_cors_headers(['cache_control' => 'public, max-age=86400']);


$PREVIEW_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v'];

const PREVIEW_FRAMES_DEFAULT_COUNT = 6;
const PREVIEW_FRAMES_MIN_COUNT = 2;
const PREVIEW_FRAMES_MAX_COUNT = 10;
const PREVIEW_FRAMES_DEFAULT_WIDTH = 320;
const PREVIEW_FRAMES_MIN_WIDTH = 160;
const PREVIEW_FRAMES_MAX_WIDTH = 640;
const PREVIEW_FRAMES_PROBE_LIMIT = 60;
const PREVIEW_FRAMES_HEAD_TRIM = 0.1;
const PREVIEW_FRAMES_TAIL_TRIM = 0.95;
const PREVIEW_THUMBNAIL_ENDPOINT = '/scripts/Public/General/serveVideoThumbnail.php';


function preview_frames_fail($status, $message) {
    header('Content-Type: application/json');
    header('Cache-Control: no-store');

    echo json_encode([
        "success" => false,
        "message" => $message,
        "code" => $status
    ]);

    exit;
}


function preview_frames_cached_duration($fullPath) {
    $cacheDirectory = media_cache_directory('video-durations');

    if ($cacheDirectory === null) {
        return null;
    }

    $cacheKey = md5($fullPath . '|' . filemtime($fullPath) . '|' . filesize($fullPath));
    $cachePath = $cacheDirectory . $cacheKey . '.txt';

    if (is_file($cachePath)) {
        $cached = trim((string)file_get_contents($cachePath));

        if ($cached !== '' && is_numeric($cached)) {
            return (float)$cached;
        }
    }

    if (!public_rate_limit_allow('video-duration-probe', PREVIEW_FRAMES_PROBE_LIMIT, 60)) {
        public_rate_limit_reject();
    }

    if (media_tool_path('ffprobe') === null) {
        return null;
    }

    $jobSlot = media_acquire_job_slot();

    if ($jobSlot === false) {
        return null;
    }

    $probe = media_probe_video($fullPath);
    media_release_job_slot($jobSlot);

    $duration = isset($probe['duration']) ? (float)$probe['duration'] : 0.0;

    if ($duration <= 0) {
        return null;
    }

    file_put_contents($cachePath, (string)$duration, LOCK_EX);

    return $duration;
}


$requestedRoot = isset($_GET['root']) ? (string)$_GET['root'] : PUBLIC_MEDIA_DEFAULT_ROOT;

if (!public_media_root_exists($requestedRoot)) {
    preview_frames_fail(400, 'Unknown media root.');
}

$assetsBase = public_media_root($requestedRoot);

if ($assetsBase === null) {
    preview_frames_fail(500, 'Media root directory not found.');
}

$requested = isset($_GET['path']) ? trim($_GET['path'], '/') : '';

if ($requested === '') {
    preview_frames_fail(400, 'Missing path.');
}

$fullPath = realpath($assetsBase . $requested);

if ($fullPath === false || !is_file($fullPath)) {
    preview_frames_fail(404, 'Video not found.');
}

if (strpos($fullPath, $assetsBase) !== 0) {
    preview_frames_fail(403, 'Access denied.');
}

if (!in_array(strtolower(pathinfo($fullPath, PATHINFO_EXTENSION)), $PREVIEW_EXTENSIONS, true)) {
    preview_frames_fail(403, 'Type not permitted.');
}

$count = isset($_GET['count']) ? (int)$_GET['count'] : PREVIEW_FRAMES_DEFAULT_COUNT;
$count = min(PREVIEW_FRAMES_MAX_COUNT, max(PREVIEW_FRAMES_MIN_COUNT, $count));

$width = isset($_GET['w']) ? (int)$_GET['w'] : PREVIEW_FRAMES_DEFAULT_WIDTH;
$width = min(PREVIEW_FRAMES_MAX_WIDTH, max(PREVIEW_FRAMES_MIN_WIDTH, $width));

$providedDuration = isset($_GET['duration']) ? (float)$_GET['duration'] : 0.0;
$duration = $providedDuration > 0 ? $providedDuration : preview_frames_cached_duration($fullPath);

if ($duration === null || $duration <= 0) {
    preview_frames_fail(503, 'The video duration could not be determined.');
}

$firstFrame = $duration * PREVIEW_FRAMES_HEAD_TRIM;
$lastFrame = $duration * PREVIEW_FRAMES_TAIL_TRIM;
$step = $count > 1 ? ($lastFrame - $firstFrame) / ($count - 1) : 0.0;

$frames = [];
$usedTimestamps = [];

for ($index = 0; $index < $count; $index++) {
    $seconds = round($firstFrame + ($step * $index), 1);

    if (isset($usedTimestamps[(string)$seconds])) {
        continue;
    }

    $usedTimestamps[(string)$seconds] = true;

    $params = ['path' => $requested, 't' => (string)$seconds, 'w' => (string)$width];

    if ($requestedRoot !== PUBLIC_MEDIA_DEFAULT_ROOT) {
        $params['root'] = $requestedRoot;
    }

    $frames[] = [
        'seconds' => $seconds,
        'url' => PREVIEW_THUMBNAIL_ENDPOINT . '?' . http_build_query($params),
    ];
}

header('Content-Type: application/json');

echo json_encode([
    "success" => true,
    "data" => [
        "durationSeconds" => (float)$duration,
        "width" => $width,
        "frames" => $frames,
    ]
]);
