<?php
require_once __DIR__ . '/authHelpers.php';

function alumni_config($key = null) {
    static $config = null;

    if ($config === null) {
        $config = [
            'session_idle_ttl_seconds'     => 43200,
            'session_absolute_ttl_seconds' => 604800,
            'session_max_per_user'         => 4,
            'login_fail_window_seconds'    => 900,
            'login_fail_max_per_window'    => 10,
            'passkey_challenge_ttl_seconds'=> 600,
            'max_uploaded_images_per_user' => 60,
            'max_upload_size_bytes'        => 2 * 1024 * 1024,
            'max_posts_per_user'           => 100,
            'mail_from'                    => 'no-reply@harvestschools.com',
            'mail_from_name'               => 'Harvest Schools Alumni',
            'admin_notification_email'     => 'alumni@admin.harvestschools.com',
        ];

        $docRoot      = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
        $overridePath = $docRoot !== '' ? dirname($docRoot) . '/configs/alumniConfig.php' : '';

        if ($overridePath !== '' && is_readable($overridePath)) {
            $override = require $overridePath;
            if (is_array($override)) {
                $config = array_merge($config, $override);
            }
        }
    }

    if ($key === null) { return $config; }

    return $config[$key] ?? null;
}

function alumni_uploads_base_dir() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
    return dirname($docRoot) . '/files_uploaded_from_harvestschools_webapp/alumni_students/';
}

function alumni_sanitize_storage_folder($username) {
    $folder = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$username));
    return substr($folder !== '' ? $folder : 'alumni', 0, 64);
}

function alumni_sanitize_relative_path($path) {
    $sanitized = str_replace('\\', '/', (string)$path);
    $parts = explode('/', $sanitized);
    $clean = [];

    foreach ($parts as $part) {
        if ($part === '.' || $part === '') { continue; }
        if ($part === '..') { return null; }
        $clean[] = $part;
    }

    return implode('/', $clean);
}

function alumni_allowed_image_mime_types() {
    return [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/gif'  => 'gif',
        'image/webp' => 'webp',
        'image/bmp'  => 'bmp',
        'image/svg+xml' => 'svg',
        'image/tiff' => 'tiff',
    ];
}

function alumni_store_uploaded_image($file, $storageFolder, $subFolder) {
    if (!isset($file['error']) || $file['error'] !== 0 || !is_uploaded_file($file['tmp_name'])) {
        return [false, 'The image could not be uploaded.'];
    }

    if ((int)$file['size'] > (int)alumni_config('max_upload_size_bytes')) {
        return [false, 'Image size must be less than 2MB.'];
    }

    $allowed = alumni_allowed_image_mime_types();
    $detectedType = function_exists('mime_content_type') ? mime_content_type($file['tmp_name']) : ($file['type'] ?? '');

    if (!isset($allowed[$detectedType])) {
        return [false, 'Only image files (jpg, png, gif, webp, bmp, svg, tiff) are allowed.'];
    }

    $extension = $allowed[$detectedType];
    $subFolder = $subFolder === 'profile' ? 'profile' : 'posts';
    $storageFolder = alumni_sanitize_storage_folder($storageFolder);
    $targetDir = alumni_uploads_base_dir() . $storageFolder . '/' . $subFolder . '/';

    if (!file_exists($targetDir) && !mkdir($targetDir, 0755, true)) {
        return [false, 'Failed to create the upload directory.'];
    }

    $originalName = preg_replace('/[^a-zA-Z0-9_-]/', '', pathinfo((string)($file['name'] ?? 'image'), PATHINFO_FILENAME));
    $originalName = substr($originalName !== '' ? $originalName : 'image', 0, 60);
    $finalFileName = $originalName . '-' . bin2hex(random_bytes(16)) . '.' . $extension;
    $targetFile = $targetDir . $finalFileName;

    if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
        return [false, 'Failed to store the uploaded image.'];
    }

    return [true, $storageFolder . '/' . $subFolder . '/' . $finalFileName];
}

function alumni_delete_stored_file($relativePath) {
    $clean = alumni_sanitize_relative_path($relativePath);

    if ($clean === null || $clean === '') { return; }

    $base = realpath(alumni_uploads_base_dir());
    if ($base === false) { return; }

    $full = $base . DIRECTORY_SEPARATOR . $clean;
    $real = realpath($full);

    if ($real !== false && strpos($real, $base) === 0 && is_file($real)) {
        @unlink($real);
    }
}

function alumni_delete_account_files($storageFolder) {
    $storageFolder = alumni_sanitize_storage_folder($storageFolder);
    if ($storageFolder === '') { return; }

    $base = realpath(alumni_uploads_base_dir());
    if ($base === false) { return; }

    $dir = realpath($base . DIRECTORY_SEPARATOR . $storageFolder);
    if ($dir === false || strpos($dir, $base) !== 0 || !is_dir($dir)) { return; }

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($iterator as $item) {
        if ($item->isDir()) { @rmdir($item->getPathname()); }
        else { @unlink($item->getPathname()); }
    }

    @rmdir($dir);
}

function issue_alumni_session($conn, $userId) {
    $idleTtl     = (int)alumni_config('session_idle_ttl_seconds');
    $absoluteTtl = (int)alumni_config('session_absolute_ttl_seconds');
    $maxSessions = max(1, (int)alumni_config('session_max_per_user'));

    $stmt = $conn->prepare(
        "DELETE FROM alumni_sessions
         WHERE user_id = ?
           AND (last_seen < (NOW() - INTERVAL ? SECOND)
                OR created_at < (NOW() - INTERVAL ? SECOND))"
    );
    $stmt->bind_param("iii", $userId, $idleTtl, $absoluteTtl);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare(
        "DELETE FROM alumni_sessions WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (SELECT id FROM alumni_sessions WHERE user_id = ? ORDER BY last_seen DESC LIMIT ?) keep
        )"
    );
    $stmt->bind_param("iii", $userId, $userId, $maxSessions);
    $stmt->execute();
    $stmt->close();

    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);
    $userAgent = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    $stmt = $conn->prepare("INSERT INTO alumni_sessions (id, user_id, user_agent) VALUES (?, ?, ?)");
    $stmt->bind_param("sis", $tokenHash, $userId, $userAgent);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE alumni_students SET last_login_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    return $token;
}

function delete_alumni_session_row($conn, $tokenHash) {
    $stmt = $conn->prepare("DELETE FROM alumni_sessions WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();
}

function validate_alumni_session($conn) {
    $tokenHash = get_bearer_token_hash();

    if (!$tokenHash) {
        return ["success" => false, "message" => "Missing bearer token", "code" => 401];
    }

    $idleTtl     = (int)alumni_config('session_idle_ttl_seconds');
    $absoluteTtl = (int)alumni_config('session_absolute_ttl_seconds');

    $stmt = $conn->prepare(
        "SELECT s.user_id,
                (s.created_at < (NOW() - INTERVAL ? SECOND)) AS aged_out,
                a.account_status
         FROM alumni_sessions s
         JOIN alumni_students a ON a.id = s.user_id
         WHERE s.id = ? AND s.last_seen >= (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("isi", $absoluteTtl, $tokenHash, $idleTtl);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        return ["success" => false, "message" => "Invalid or expired session", "code" => 401];
    }

    $row = $result->fetch_assoc();

    if ((int)$row['aged_out'] === 1) {
        delete_alumni_session_row($conn, $tokenHash);

        return [
            "success" => false,
            "message" => "Your session has reached its maximum age. Please log in again.",
            "code"    => 401
        ];
    }

    if ($row['account_status'] !== 'approved') {
        delete_alumni_session_row($conn, $tokenHash);

        return [
            "success" => false,
            "message" => "This account is no longer active. Please contact the school.",
            "code"    => 403
        ];
    }

    $stmt = $conn->prepare("UPDATE alumni_sessions SET last_seen = NOW() WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();

    return ["success" => true, "user_id" => (int)$row['user_id'], "code" => 200];
}

function log_alumni_event($conn, $userId, $event) {
    $stmt = $conn->prepare("INSERT INTO alumni_login_events (user_id, event) VALUES (?, ?)");
    $stmt->bind_param("is", $userId, $event);
    $stmt->execute();
    $stmt->close();
}

function alumni_login_rate_limited($conn, $userId) {
    $failWindow = (int)alumni_config('login_fail_window_seconds');
    $failMax    = (int)alumni_config('login_fail_max_per_window');

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM alumni_login_events
         WHERE user_id = ? AND event = 'login_fail'
           AND created_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ii", $userId, $failWindow);
    $stmt->execute();
    $recentFails = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    return $recentFails >= $failMax;
}

function alumni_validate_username($username) {
    if (strlen($username) < 3 || strlen($username) > 30 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        return "Username must be between 3 and 30 characters long and contain only letters, numbers, and underscores";
    }
    return null;
}

function alumni_validate_password($password) {
    if (strlen($password) < 8 ||
        !preg_match('/[A-Z]/', $password) ||
        !preg_match('/[a-z]/', $password) ||
        !preg_match('/[0-9]/', $password) ||
        !preg_match('/[^a-zA-Z0-9]/', $password)
    ) {
        return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    }
    return null;
}

function alumni_validate_email($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
        return "Please provide a valid email address";
    }
    return null;
}

function alumni_validate_graduation_date($date) {
    if ($date === '' || $date === null) { return null; }

    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    if (!$parsed || $parsed->format('Y-m-d') !== $date) {
        return "Graduation date must be a valid date";
    }
    return null;
}

function alumni_username_taken($conn, $username, $excludeAlumniId = 0) {
    $stmt = $conn->prepare("SELECT id FROM alumni_students WHERE username = ? AND id != ?");
    $stmt->bind_param("si", $username, $excludeAlumniId);
    $stmt->execute();
    $taken = $stmt->get_result()->num_rows > 0;
    $stmt->close();
    return $taken;
}

function alumni_email_taken($conn, $email, $excludeAlumniId = 0) {
    $stmt = $conn->prepare("SELECT id FROM alumni_students WHERE email = ? AND id != ?");
    $stmt->bind_param("si", $email, $excludeAlumniId);
    $stmt->execute();
    $taken = $stmt->get_result()->num_rows > 0;
    $stmt->close();
    return $taken;
}

function alumni_send_email($toAddress, $subject, $bodyText) {
    if (empty($toAddress)) { return false; }

    $from     = alumni_config('mail_from');
    $fromName = alumni_config('mail_from_name');

    $body = $bodyText . "\r\n\r\n"
        . "Best regards,\r\n"
        . "Harvest International School\r\n";

    $headers  = "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Auto-Response-Suppress: All\r\n";
    $headers .= "Auto-Submitted: auto-generated\r\n";

    return @mail($toAddress, $subject, $body, $headers, "-f {$from}");
}
