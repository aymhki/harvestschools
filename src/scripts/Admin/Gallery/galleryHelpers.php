<?php

require_once __DIR__ . '/../authHelpers.php';
require_once __DIR__ . '/../../permissionLevels.php';
require_once __DIR__ . '/../../Public/General/publicMediaRoots.php';
require_once __DIR__ . '/../../Public/General/mediaToolchain.php';

const GALLERY_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
const GALLERY_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'm4v'];
const GALLERY_MAX_PHOTO_BYTES = 1073741824;
const GALLERY_MAX_VIDEO_BYTES = 5368709120;
const GALLERY_UPLOAD_CHUNK_BYTES = 8388608;
const GALLERY_DEV_UPLOAD_CHUNK_BYTES = 1048576;
const GALLERY_MAX_VIDEO_SHORT_SIDE = 1080;
const GALLERY_ABANDONED_UPLOAD_SECONDS = 86400;


function gallery_ini_bytes($value) {
    $raw = trim((string)$value);

    if ($raw === '') {
        return 0;
    }

    $number = (float)$raw;
    $unit = strtolower(substr($raw, -1));

    return (int)match ($unit) {
        'g' => $number * 1024 * 1024 * 1024,
        'm' => $number * 1024 * 1024,
        'k' => $number * 1024,
        default => $number,
    };
}


function gallery_upload_chunk_bytes($isProduction) {
    $limits = [$isProduction ? GALLERY_UPLOAD_CHUNK_BYTES : GALLERY_DEV_UPLOAD_CHUNK_BYTES];

    foreach (['upload_max_filesize', 'post_max_size'] as $setting) {
        $bytes = gallery_ini_bytes(ini_get($setting));

        if ($bytes > 0) {
            $limits[] = (int)($bytes * 0.8);
        }
    }

    return max(131072, min($limits));
}


function gallery_error($message, $code = 400) {
    return ["success" => false, "message" => $message, "code" => $code];
}


function gallery_authorise($conn) {
    global $GALLERY_MANAGEMENT;

    return check_admin_user_permission($conn, $GALLERY_MANAGEMENT);
}


function gallery_trim($value, $maxLength) {
    return mb_substr(trim((string)$value), 0, $maxLength);
}


function gallery_root() {
    $home = public_media_home();

    if ($home === null) {
        return null;
    }

    $directory = $home . DIRECTORY_SEPARATOR . 'files_uploaded_from_harvestschools_webapp'
        . DIRECTORY_SEPARATOR . 'gallery' . DIRECTORY_SEPARATOR;

    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
        return null;
    }

    return $directory;
}


function gallery_subdirectory($relative) {
    $root = gallery_root();

    if ($root === null) {
        return null;
    }

    $directory = $root . str_replace('/', DIRECTORY_SEPARATOR, trim($relative, '/')) . DIRECTORY_SEPARATOR;

    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
        return null;
    }

    return $directory;
}


function gallery_photos_directory($folderName) {
    return gallery_subdirectory('photos/' . $folderName);
}


function gallery_videos_directory() {
    return gallery_subdirectory('videos');
}


function gallery_pending_directory() {
    return gallery_subdirectory('pending');
}


function gallery_folder_name_from_title($title) {
    $ascii = preg_replace('/[^A-Za-z0-9 ]+/', ' ', (string)$title);
    $words = preg_split('/\s+/', trim((string)$ascii), -1, PREG_SPLIT_NO_EMPTY);
    $folderName = '';

    foreach ($words as $word) {
        $folderName .= ucfirst(strtolower($word));
    }

    return $folderName === '' ? 'Collage' : mb_substr($folderName, 0, 100);
}


function gallery_unique_folder_name($conn, $baseName) {
    $candidate = $baseName;
    $suffix = 2;

    while (true) {
        $stmt = $conn->prepare("SELECT id FROM gallery_collages WHERE folder_name = ?");
        $stmt->bind_param("s", $candidate);
        $stmt->execute();
        $exists = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$exists && !is_dir((string)gallery_root() . 'photos' . DIRECTORY_SEPARATOR . $candidate)) {
            return $candidate;
        }

        $candidate = $baseName . $suffix;
        $suffix += 1;
    }
}


function gallery_next_photo_number($conn, $collageId, $folderName) {
    $stmt = $conn->prepare("SELECT file_name FROM gallery_photos WHERE collage_id = ?");
    $stmt->bind_param("i", $collageId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $highest = 0;
    $pattern = '/^' . preg_quote($folderName, '/') . '(\d+)\./';

    while ($row = $result->fetch_assoc()) {
        if (preg_match($pattern, (string)$row['file_name'], $matches)) {
            $highest = max($highest, (int)$matches[1]);
        }
    }

    return $highest + 1;
}


function gallery_next_sort_order($conn, $table, $whereColumn = null, $whereValue = null) {
    if ($whereColumn === null) {
        $stmt = $conn->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM `$table`");
    } else {
        $stmt = $conn->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM `$table` WHERE `$whereColumn` = ?");
        $stmt->bind_param("i", $whereValue);
    }

    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return (int)$row['next'];
}


function gallery_extension_of($fileName) {
    return strtolower((string)pathinfo((string)$fileName, PATHINFO_EXTENSION));
}


function gallery_validate_upload($file, array $allowedExtensions, $maxBytes) {
    if (!is_array($file) || !isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        return gallery_error('That file did not upload correctly.', 400);
    }

    if ((int)$file['size'] <= 0 || (int)$file['size'] > $maxBytes) {
        return gallery_error('That file is larger than the ' . round($maxBytes / 1048576) . ' MB limit.', 413);
    }

    if (!in_array(gallery_extension_of($file['name']), $allowedExtensions, true)) {
        return gallery_error('Only ' . implode(', ', $allowedExtensions) . ' files are accepted.', 415);
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        return gallery_error('That upload could not be verified.', 400);
    }

    return ["success" => true];
}


function gallery_uploaded_files($fieldName) {
    if (!isset($_FILES[$fieldName])) {
        return [];
    }

    $field = $_FILES[$fieldName];

    if (!is_array($field['name'])) {
        return [$field];
    }

    $files = [];

    foreach (array_keys($field['name']) as $index) {
        $files[] = [
            'name'     => $field['name'][$index],
            'type'     => $field['type'][$index],
            'tmp_name' => $field['tmp_name'][$index],
            'error'    => $field['error'][$index],
            'size'     => $field['size'][$index],
        ];
    }

    return $files;
}


function gallery_collage_by_id($conn, $collageId) {
    $stmt = $conn->prepare("SELECT id, folder_name, title_en, title_ar, layout, sort_order, is_public FROM gallery_collages WHERE id = ?");
    $stmt->bind_param("i", $collageId);
    $stmt->execute();
    $collage = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $collage ?: null;
}


function gallery_video_by_id($conn, $videoId) {
    $stmt = $conn->prepare(
        "SELECT id, title_en, title_ar, file_name, thumbnail_at, duration_seconds, is_public,
                status, progress_percent, status_message
         FROM gallery_videos WHERE id = ?"
    );
    $stmt->bind_param("i", $videoId);
    $stmt->execute();
    $video = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $video ?: null;
}


function gallery_delete_file($absolutePath) {
    if ($absolutePath !== '' && is_file($absolutePath)) {
        @unlink($absolutePath);
    }
}


function gallery_store_photos($conn, $collage, array $files) {
    $collageId = (int)$collage['id'];
    $folderName = (string)$collage['folder_name'];
    $directory = gallery_photos_directory($folderName);

    if ($directory === null) {
        return gallery_error('The gallery folder could not be created on the server.', 500);
    }

    foreach ($files as $file) {
        $check = gallery_validate_upload($file, GALLERY_PHOTO_EXTENSIONS, GALLERY_MAX_PHOTO_BYTES);

        if (!$check['success']) {
            return $check;
        }
    }

    $stored = 0;

    foreach ($files as $file) {
        $number = gallery_next_photo_number($conn, $collageId, $folderName);
        $fileName = $folderName . $number . '.' . gallery_extension_of($file['name']);

        if (!@move_uploaded_file($file['tmp_name'], $directory . $fileName)) {
            return gallery_error('One of the photos could not be saved on the server.', 500);
        }

        $sortOrder = gallery_next_sort_order($conn, 'gallery_photos', 'collage_id', $collageId);

        $stmt = $conn->prepare("INSERT INTO gallery_photos (collage_id, sort_order, file_name) VALUES (?, ?, ?)");
        $stmt->bind_param("iis", $collageId, $sortOrder, $fileName);
        $stmt->execute();
        $stmt->close();

        $stored += 1;
    }

    return ["success" => true, "stored" => $stored];
}


function gallery_unique_video_file_name($conn, $baseName) {
    $directory = gallery_videos_directory();
    $candidate = $baseName . '.mp4';
    $suffix = 2;

    while (true) {
        $stmt = $conn->prepare("SELECT id FROM gallery_videos WHERE file_name = ?");
        $stmt->bind_param("s", $candidate);
        $stmt->execute();
        $exists = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$exists && ($directory === null || !is_file($directory . $candidate))) {
            return $candidate;
        }

        $candidate = $baseName . $suffix . '.mp4';
        $suffix += 1;
    }
}


const GALLERY_PLACEMENT_TOP = 'top';
const GALLERY_PLACEMENT_AFTER = 'after';
const GALLERY_PLACEMENT_DATE = 'date';
const GALLERY_PLACEMENT_END = 'end';

function gallery_placement_of($value) {
    $placement = strtolower(trim((string)$value));

    return in_array($placement, [GALLERY_PLACEMENT_TOP, GALLERY_PLACEMENT_AFTER, GALLERY_PLACEMENT_DATE], true)
        ? $placement
        : GALLERY_PLACEMENT_END;
}


function gallery_photo_taken_at($absolutePath) {
    if (!function_exists('exif_read_data') || !is_file($absolutePath)) {
        return null;
    }

    $exif = @exif_read_data($absolutePath);

    if (!is_array($exif)) {
        return null;
    }

    foreach (['DateTimeOriginal', 'DateTimeDigitized', 'DateTime'] as $key) {
        $raw = trim((string)($exif[$key] ?? ''));

        if ($raw === '') {
            continue;
        }

        $normalised = preg_replace('/^(\d{4}):(\d{2}):(\d{2})/', '$1-$2-$3', $raw);
        $timestamp = strtotime($normalised);

        if ($timestamp !== false) {
            return date('Y-m-d H:i:s', $timestamp);
        }
    }

    return null;
}


function gallery_apply_placement($conn, $table, $newId, $placement, $afterId = 0, $mediaDate = null) {
    $rows = [];
    $result = $conn->query("SELECT id, media_date FROM `$table` ORDER BY sort_order ASC, id ASC");

    while ($row = $result->fetch_assoc()) {
        if ((int)$row['id'] !== (int)$newId) {
            $rows[] = ['id' => (int)$row['id'], 'media_date' => $row['media_date']];
        }
    }

    $position = count($rows);

    if ($placement === GALLERY_PLACEMENT_TOP) {
        $position = 0;
    } elseif ($placement === GALLERY_PLACEMENT_AFTER) {
        foreach ($rows as $index => $row) {
            if ($row['id'] === (int)$afterId) {
                $position = $index + 1;
                break;
            }
        }
    } elseif ($placement === GALLERY_PLACEMENT_DATE && $mediaDate !== null) {
        foreach ($rows as $index => $row) {
            if ($row['media_date'] !== null && strtotime((string)$row['media_date']) > strtotime((string)$mediaDate)) {
                $position = $index;
                break;
            }
        }
    }

    array_splice($rows, $position, 0, [['id' => (int)$newId, 'media_date' => $mediaDate]]);

    $stmt = $conn->prepare("UPDATE `$table` SET sort_order = ? WHERE id = ?");

    foreach ($rows as $order => $row) {
        $stmt->bind_param("ii", $order, $row['id']);
        $stmt->execute();
    }

    $stmt->close();

    return $position;
}


function gallery_set_media_date($conn, $table, $rowId, $mediaDate) {
    if ($mediaDate === null) {
        return;
    }

    $stmt = $conn->prepare("UPDATE `$table` SET media_date = ? WHERE id = ?");
    $stmt->bind_param("si", $mediaDate, $rowId);
    $stmt->execute();
    $stmt->close();
}


function gallery_pending_paths($videoId) {
    $directory = gallery_pending_directory();

    if ($directory === null) {
        return null;
    }

    return [
        'part'     => $directory . $videoId . '.part',
        'progress' => $directory . $videoId . '.progress',
        'log'      => $directory . $videoId . '.log',
        'output'   => $directory . $videoId . '.out.mp4',
        'pid'      => $directory . $videoId . '.pid',
    ];
}


function gallery_read_encode_progress($progressPath, $durationSeconds) {
    $state = ['percent' => 0, 'finished' => false];

    if (!is_file($progressPath)) {
        return $state;
    }

    $contents = (string)@file_get_contents($progressPath);

    if ($contents === '') {
        return $state;
    }

    if (strpos($contents, 'progress=end') !== false) {
        return ['percent' => 100, 'finished' => true];
    }

    if ($durationSeconds === null || $durationSeconds <= 0) {
        return $state;
    }

    if (preg_match_all('/out_time_us=(\d+)/', $contents, $matches) > 0) {
        $microseconds = (float)end($matches[1]);
        $state['percent'] = (int)max(0, min(99, round(($microseconds / 1000000) / $durationSeconds * 100)));
    }

    return $state;
}

function gallery_video_short_side(array $probe) {
    $width = $probe['width'] ?? null;
    $height = $probe['height'] ?? null;

    if ($width === null || $height === null || $width <= 0 || $height <= 0) {
        return null;
    }

    return min((int)$width, (int)$height);
}


function gallery_needs_transcode(array $probe, $sourceExtension) {
    $shortSide = gallery_video_short_side($probe);

    return $sourceExtension !== 'mp4'
        || strtolower($probe['videoCodec']) !== 'h264'
        || !in_array(strtolower($probe['audioCodec']), ['aac', ''], true)
        || $probe['faststart'] !== true
        || ($shortSide !== null && $shortSide > GALLERY_MAX_VIDEO_SHORT_SIDE);
}


function gallery_default_thumbnail_at($durationSeconds) {
    if ($durationSeconds === null || $durationSeconds <= 0) {
        return 0.1;
    }

    return round(min($durationSeconds * 0.1, max(1, $durationSeconds - 1)), 1);
}


function gallery_discard_pending_files($videoId) {
    $paths = gallery_pending_paths($videoId);

    if ($paths === null) {
        return;
    }

    media_stop_detached($paths['pid'], $paths['part']);

    foreach (['part', 'progress', 'log', 'output', 'pid'] as $key) {
        gallery_delete_file($paths[$key]);
    }
}

function gallery_sweep_abandoned_uploads($conn, $olderThanSeconds = GALLERY_ABANDONED_UPLOAD_SECONDS) {
    $removed = ['rows' => 0, 'files' => 0];
    $cutoff = date('Y-m-d H:i:s', time() - $olderThanSeconds);

    $stmt = $conn->prepare(
        "SELECT id FROM gallery_videos
         WHERE status IN ('uploading', 'processing', 'failed') AND updated_at < ?"
    );
    $stmt->bind_param("s", $cutoff);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $staleIds = [];

    while ($row = $result->fetch_assoc()) {
        $staleIds[] = (int)$row['id'];
    }

    foreach ($staleIds as $videoId) {
        gallery_discard_pending_files($videoId);

        $stmt = $conn->prepare("DELETE FROM gallery_videos WHERE id = ?");
        $stmt->bind_param("i", $videoId);
        $stmt->execute();
        $stmt->close();

        $removed['rows'] += 1;
    }

    $pendingDirectory = gallery_pending_directory();

    if ($pendingDirectory !== null) {
        foreach ((array)glob($pendingDirectory . '*') as $path) {
            if (!is_file($path) || (time() - (int)filemtime($path)) < $olderThanSeconds) {
                continue;
            }

            $videoId = (int)pathinfo($path, PATHINFO_FILENAME);

            if ($videoId <= 0 || gallery_video_by_id($conn, $videoId) === null) {
                gallery_delete_file($path);
                $removed['files'] += 1;
            }
        }
    }

    return $removed;
}


function gallery_set_video_status($conn, $videoId, $status, $progressPercent, $statusMessage = '') {
    $stmt = $conn->prepare("UPDATE gallery_videos SET status = ?, progress_percent = ?, status_message = ? WHERE id = ?");
    $stmt->bind_param("sisi", $status, $progressPercent, $statusMessage, $videoId);
    $stmt->execute();
    $stmt->close();
}
