<?php




const MEDIA_TOOL_PROBE_TTL_SECONDS = 3600;
const MEDIA_TOOL_JOB_SLOTS = 3;
const MEDIA_TOOL_SLOT_WAIT_SECONDS = 20;
const MEDIA_TOOL_PROBE_TIMEOUT_SECONDS = 10;
const MEDIA_TOOL_FRAME_TIMEOUT_SECONDS = 25;


function media_cache_directory($subdirectory = '') {
    $documentRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    if ($documentRoot === '') {
        return null;
    }

    $directory = dirname($documentRoot) . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR;

    if ($subdirectory !== '') {
        $directory .= trim($subdirectory, '/\\') . DIRECTORY_SEPARATOR;
    }

    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
        return null;
    }

    return $directory;
}


function media_lock_directory() {
    $directory = media_cache_directory('media-locks');

    if ($directory !== null) {
        return $directory;
    }

    $fallback = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'harvest_media_locks' . DIRECTORY_SEPARATOR;

    if (!is_dir($fallback) && !@mkdir($fallback, 0700, true) && !is_dir($fallback)) {
        return null;
    }

    return $fallback;
}


function media_process_functions_available() {
    static $available = null;

    if ($available !== null) {
        return $available;
    }

    $disabled = array_map('trim', explode(',', (string)ini_get('disable_functions')));
    $available = function_exists('proc_open') && !in_array('proc_open', $disabled, true);

    return $available;
}


function media_binary_candidates($tool) {
    $isWindows = DIRECTORY_SEPARATOR === '\\';
    $executable = $isWindows ? $tool . '.exe' : $tool;
    $configured = getenv('HARVEST_' . strtoupper($tool) . '_PATH');
    $candidates = [];

    if (is_string($configured) && $configured !== '') {
        $candidates[] = $configured;
    }

    if ($isWindows) {
        $candidates[] = 'C:\\ffmpeg\\bin\\' . $executable;
        $candidates[] = 'C:\\Program Files\\ffmpeg\\bin\\' . $executable;
        $candidates[] = 'C:\\ProgramData\\chocolatey\\bin\\' . $executable;
        $candidates[] = $executable;

        return $candidates;
    }

    $candidates[] = '/bin/' . $executable;
    $candidates[] = '/usr/bin/' . $executable;
    $candidates[] = '/usr/local/bin/' . $executable;
    $candidates[] = '/opt/homebrew/bin/' . $executable;
    $candidates[] = '/usr/local/opt/ffmpeg/bin/' . $executable;
    $candidates[] = '/opt/local/bin/' . $executable;
    $candidates[] = '/snap/bin/' . $executable;
    $candidates[] = $executable;

    return $candidates;
}


function media_run(array $command, $timeoutSeconds) {
    $result = ['ok' => false, 'output' => '', 'code' => -1, 'timedOut' => false];

    if (!media_process_functions_available()) {
        return $result;
    }

    $nullDevice = DIRECTORY_SEPARATOR === '\\' ? 'NUL' : '/dev/null';

    $descriptors = [
        0 => ['file', $nullDevice, 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $pipes = [];
    $process = @proc_open($command, $descriptors, $pipes);

    if (!is_resource($process)) {
        return $result;
    }

    stream_set_blocking($pipes[1], false);
    stream_set_blocking($pipes[2], false);

    $output = '';
    $deadline = microtime(true) + $timeoutSeconds;

    while (true) {
        $status = proc_get_status($process);
        $output .= (string)stream_get_contents($pipes[1]);
        $output .= (string)stream_get_contents($pipes[2]);

        if (!$status['running']) {
            $result['code'] = (int)$status['exitcode'];
            break;
        }

        if (microtime(true) >= $deadline) {
            $result['timedOut'] = true;
            @proc_terminate($process, 9);
            break;
        }

        usleep(20000);
    }

    fclose($pipes[1]);
    fclose($pipes[2]);
    @proc_close($process);

    $result['output'] = $output;
    $result['ok'] = !$result['timedOut'] && $result['code'] === 0;

    return $result;
}


function media_probe_tool($tool) {
    $cacheDirectory = media_cache_directory('media-tools');
    $cachePath = $cacheDirectory === null ? null : $cacheDirectory . $tool . '.json';

    if ($cachePath !== null && is_file($cachePath)) {
        $cached = json_decode((string)@file_get_contents($cachePath), true);

        if (is_array($cached) && isset($cached['checkedAt']) && (time() - (int)$cached['checkedAt']) < MEDIA_TOOL_PROBE_TTL_SECONDS) {
            $path = isset($cached['path']) ? (string)$cached['path'] : '';

            return $path === '' ? null : $path;
        }
    }

    $found = null;

    if (media_process_functions_available()) {
        foreach (media_binary_candidates($tool) as $candidate) {
            $isPathLookup = basename($candidate) === $candidate;

            if (!$isPathLookup && !@is_file($candidate)) {
                continue;
            }

            $probe = media_run([$candidate, '-version'], MEDIA_TOOL_PROBE_TIMEOUT_SECONDS);

            if ($probe['ok'] && stripos($probe['output'], $tool . ' version') !== false) {
                $found = $candidate;
                break;
            }
        }
    }

    if ($cachePath !== null) {
        @file_put_contents($cachePath, json_encode(['path' => (string)$found, 'checkedAt' => time()]), LOCK_EX);
    }

    return $found;
}


function media_tool_path($tool) {
    static $resolved = [];

    if (!array_key_exists($tool, $resolved)) {
        $resolved[$tool] = media_probe_tool($tool);
    }

    return $resolved[$tool];
}


function media_acquire_job_slot($waitSeconds = MEDIA_TOOL_SLOT_WAIT_SECONDS) {
    $directory = media_lock_directory();

    if ($directory === null) {
        return false;
    }

    $deadline = microtime(true) + $waitSeconds;

    while (true) {
        for ($slot = 0; $slot < MEDIA_TOOL_JOB_SLOTS; $slot++) {
            $handle = @fopen($directory . 'job-slot-' . $slot . '.lock', 'c');

            if ($handle === false) {
                continue;
            }

            if (flock($handle, LOCK_EX | LOCK_NB)) {
                return $handle;
            }

            fclose($handle);
        }

        if (microtime(true) >= $deadline) {
            return false;
        }

        usleep(150000);
    }
}


function media_release_job_slot($handle) {
    if (!is_resource($handle)) {
        return;
    }

    flock($handle, LOCK_UN);
    fclose($handle);
}


function media_acquire_work_lock($key) {
    $directory = media_lock_directory();

    if ($directory === null) {
        return false;
    }

    $handle = @fopen($directory . 'work-' . hash('sha256', $key) . '.lock', 'c');

    if ($handle === false) {
        return false;
    }

    if (!flock($handle, LOCK_EX)) {
        fclose($handle);

        return false;
    }

    return $handle;
}


function media_release_work_lock($handle) {
    media_release_job_slot($handle);
}


function media_extract_video_frame($videoPath, $seconds, $destinationPath, $maxWidth = 1280, $quality = 4) {
    $ffmpeg = media_tool_path('ffmpeg');

    if ($ffmpeg === null) {
        return false;
    }

    $seconds = max(0, (float)$seconds);
    $attempts = $seconds > 0 ? [$seconds, 0] : [0];

    foreach ($attempts as $attempt) {
        $run = media_run([
            $ffmpeg,
            '-nostdin',
            '-hide_banner',
            '-loglevel', 'error',
            '-ss', number_format($attempt, 3, '.', ''),
            '-i', $videoPath,
            '-frames:v', '1',
            '-an',
            '-vf', "scale='min(" . (int)$maxWidth . ",iw)':-2",
            '-q:v', (string)(int)$quality,
            '-f', 'image2',
            '-y',
            $destinationPath,
        ], MEDIA_TOOL_FRAME_TIMEOUT_SECONDS);

        if ($run['ok'] && is_file($destinationPath) && filesize($destinationPath) > 0) {
            return true;
        }

        @unlink($destinationPath);
    }

    return false;
}
