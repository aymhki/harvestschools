<?php


const PUBLIC_RATE_LIMIT_DIRECTORY = 'harvest_public_rate';

function public_rate_limit_client_key() {
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';

    if ($forwarded !== '') {
        $candidates = explode(',', $forwarded);
        $client = trim($candidates[0]);

        if (filter_var($client, FILTER_VALIDATE_IP) !== false) {
            return $client;
        }
    }

    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function public_rate_limit_allow($bucket, $maxRequests = 60, $windowSeconds = 60) {
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . PUBLIC_RATE_LIMIT_DIRECTORY;

    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        return true;
    }

    $path = $directory . DIRECTORY_SEPARATOR . hash('sha256', $bucket . '|' . public_rate_limit_client_key());
    $handle = @fopen($path, 'c+');

    if ($handle === false) {
        return true;
    }

    $allowed = true;

    if (flock($handle, LOCK_EX)) {
        $now = time();
        $raw = stream_get_contents($handle);
        $state = json_decode((string)$raw, true);

        if (!is_array($state) || !isset($state['start'], $state['count']) || ($now - (int)$state['start']) >= $windowSeconds) {
            $state = ['start' => $now, 'count' => 0];
        }

        $state['count'] = (int)$state['count'] + 1;
        $allowed = $state['count'] <= $maxRequests;

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($state));
        fflush($handle);
        flock($handle, LOCK_UN);
    }

    fclose($handle);

    return $allowed;
}

function public_rate_limit_reject() {
    http_response_code(429);
    header('Retry-After: 60');
    echo json_encode([
        "success" => false,
        "message" => "Too many requests. Please retry shortly.",
        "code"    => 429
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
