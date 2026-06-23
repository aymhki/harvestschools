<?php

// ── Config ───────────────────────────────────────────────────────────────────

//$ASSETS_BASE = realpath(dirname($_SERVER['DOCUMENT_ROOT']) . '/assets') . DIRECTORY_SEPARATOR;
//$CACHE_BASE  = realpath(dirname($_SERVER['DOCUMENT_ROOT'])) . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR;

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');

$ASSETS_BASE = false;
$possible_paths = [
    $doc_root . '/assets',
    dirname($doc_root) . '/assets',
    dirname($doc_root, 2) . '/assets'
];

foreach ($possible_paths as $path) {
    if (is_dir($path)) {
        $ASSETS_BASE = realpath($path) . DIRECTORY_SEPARATOR;
        break;
    }
}

if (!$ASSETS_BASE) {
    http_response_code(500);
    exit('Assets base directory not found');
}

$CACHE_BASE = realpath(dirname($ASSETS_BASE)) . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR;

$ALLOWED_MIME = [
    'jpg'  => 'image/jpeg',  'jpeg' => 'image/jpeg',
    'png'  => 'image/png',   'gif'  => 'image/gif',
    'webp' => 'image/webp',  'svg'  => 'image/svg+xml',
    'avif' => 'image/avif',  'ico'  => 'image/x-icon',
    'mp4'  => 'video/mp4',   'webm' => 'video/webm',
    'pdf'  => 'application/pdf',
    'woff2' => 'font/woff2',
    'woff'  => 'font/woff',
    'ttf'   => 'font/ttf',
    'otf'   => 'font/otf',
];

$PROCESSABLE = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// ── Validate path ─────────────────────────────────────────────────────────────

$requested = isset($_GET['path']) ? trim($_GET['path'], '/') : '';
if (empty($requested)) { http_response_code(400); exit('Missing path'); }

$full_path = realpath($ASSETS_BASE . $requested);

if (!$full_path || strpos($full_path, $ASSETS_BASE) !== 0) {
    http_response_code(403); exit('Access denied');
}
if (!is_file($full_path)) { http_response_code(404); exit('Not found'); }

$src_ext = strtolower(pathinfo($full_path, PATHINFO_EXTENSION));
if (!isset($ALLOWED_MIME[$src_ext])) { http_response_code(403); exit('Type not permitted'); }

// ── Optional parameters ───────────────────────────────────────────────────────

$width    = isset($_GET['w'])        ? max(1, intval($_GET['w']))        : null;
$height   = isset($_GET['h'])        ? max(1, intval($_GET['h']))        : null;
$format   = isset($_GET['format'])   ? strtolower($_GET['format'])       : null;
$quality  = isset($_GET['quality'])  ? min(100, max(1, intval($_GET['quality']))) : 85;
$download = isset($_GET['download']) && $_GET['download'] === '1';
$dlname   = isset($_GET['filename']) ? basename($_GET['filename'])       : basename($full_path);

// Validate requested format
if ($format && !isset($ALLOWED_MIME[$format])) { http_response_code(400); exit('Invalid format'); }

$out_ext  = $format ?: $src_ext;
$out_mime = $ALLOWED_MIME[$out_ext];

// ── Image processing ──────────────────────────────────────────────────────────

$needs_processing = in_array($src_ext, $PROCESSABLE) && ($width || $height || ($format && $format !== $src_ext));
$serve_path = $full_path;

if ($needs_processing) {
    $cache_key  = md5($full_path . filemtime($full_path) . $width . $height . $out_ext . $quality);
    $cache_file = $CACHE_BASE . $cache_key . '.' . $out_ext;

    if (!file_exists($cache_file)) {
        if (!is_dir($CACHE_BASE)) mkdir($CACHE_BASE, 0755, true);

        // Load
        $img = match($src_ext) {
            'jpg', 'jpeg' => imagecreatefromjpeg($full_path),
            'png'         => imagecreatefrompng($full_path),
            'gif'         => imagecreatefromgif($full_path),
            'webp'        => imagecreatefromwebp($full_path),
            default       => null,
        };

        if (!$img) { http_response_code(500); exit('Failed to load image'); }

        // Resize — maintains aspect ratio if only one dimension given
        if ($width || $height) {
            $orig_w = imagesx($img);
            $orig_h = imagesy($img);

            if ($width && !$height)  $height = intval($orig_h * ($width  / $orig_w));
            if ($height && !$width)  $width  = intval($orig_w * ($height / $orig_h));

            $resized = imagecreatetruecolor($width, $height);

            // Preserve transparency
            if (in_array($out_ext, ['png', 'webp', 'gif'])) {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
                imagefilledrectangle($resized, 0, 0, $width, $height,
                    imagecolorallocatealpha($resized, 0, 0, 0, 127));
            }

            imagecopyresampled($resized, $img, 0, 0, 0, 0, $width, $height, $orig_w, $orig_h);
            imagedestroy($img);
            $img = $resized;
        }

        // Save to cache
        match($out_ext) {
            'jpg', 'jpeg' => imagejpeg($img, $cache_file, $quality),
            'png'         => imagepng($img, $cache_file, intval(9 - ($quality / 100 * 9))),
            'webp'        => imagewebp($img, $cache_file, $quality),
            'gif'         => imagegif($img, $cache_file),
        };

        imagedestroy($img);
    }

    $serve_path = $cache_file;

    // Update download filename extension if format changed
    if ($format) {
        $dlname = pathinfo($dlname, PATHINFO_FILENAME) . '.' . $format;
    }
}

// ── Caching headers ───────────────────────────────────────────────────────────

$file_size     = filesize($serve_path);
$last_modified = filemtime($serve_path);
$etag          = '"' . md5($serve_path . $last_modified . $file_size) . '"';

if (
    (isset($_SERVER['HTTP_IF_NONE_MATCH'])     && trim($_SERVER['HTTP_IF_NONE_MATCH'])     === $etag) ||
    (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $last_modified)
) {
    http_response_code(304); exit;
}

header('Content-Type: '    . $out_mime);
header('ETag: '            . $etag);
header('Last-Modified: '   . gmdate('D, d M Y H:i:s', $last_modified) . ' GMT');
header('Accept-Ranges: bytes');
header('Cache-Control: public, max-age=31536000, immutable');
header('Access-Control-Allow-Origin: *');

// ── Disposition — inline for display, attachment for download ─────────────────

header('Content-Disposition: ' . ($download ? 'attachment' : 'inline') . '; filename="' . $dlname . '"');

// ── Range requests (video seeking) ───────────────────────────────────────────

if (isset($_SERVER['HTTP_RANGE'])) {
    [, $range_spec]          = explode('=', $_SERVER['HTTP_RANGE'], 2);
    [$range_start, $range_end] = explode('-', $range_spec, 2);

    $range_start = intval($range_start);
    $range_end   = ($range_end === '') ? $file_size - 1 : intval($range_end);

    if ($range_start > $range_end || $range_start >= $file_size) {
        http_response_code(416);
        header('Content-Range: bytes */' . $file_size);
        exit;
    }

    $length = $range_end - $range_start + 1;
    http_response_code(206);
    header('Content-Range: bytes ' . $range_start . '-' . $range_end . '/' . $file_size);
    header('Content-Length: ' . $length);

    $fp = fopen($serve_path, 'rb');
    fseek($fp, $range_start);
    $remaining = $length;
    while ($remaining > 0 && !feof($fp)) {
        $chunk = min(8192, $remaining);
        echo fread($fp, $chunk);
        $remaining -= $chunk;
        flush();
    }
    fclose($fp);
    exit;
}

// ── Full response ─────────────────────────────────────────────────────────────

header('Content-Length: ' . $file_size);
readfile($serve_path);
exit;