<?php

require_once __DIR__ . '/mfaConfig.php';


function base32_encode_bytes($data) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';

    foreach (str_split($data) as $c) {
        $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    }

    $out = '';

    foreach (str_split($bits, 5) as $chunk) {
        $out .= $alphabet[bindec(str_pad($chunk, 5, '0', STR_PAD_RIGHT))];
    }

    return $out;
}

function base32_decode_str($b32) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $b32 = strtoupper(preg_replace('/[^A-Za-z2-7]/', '', (string)$b32));
    $bits = '';

    for ($i = 0; $i < strlen($b32); $i++) {
        $index = strpos($alphabet, $b32[$i]);
        if ($index === false) { continue; }
        $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
    }

    $out = '';

    foreach (str_split($bits, 8) as $chunk) {
        if (strlen($chunk) === 8) { $out .= chr(bindec($chunk)); }
    }

    return $out;
}


function totp_code($secretB32, $timeSlice = null) {
    $key       = base32_decode_str($secretB32);
    $timeSlice = $timeSlice === null ? (int)floor(time() / 30) : (int)$timeSlice;

    $binTime = pack('N*', 0) . pack('N*', $timeSlice);
    $hash    = hash_hmac('sha1', $binTime, $key, true);
    $offset  = ord(substr($hash, -1)) & 0x0F;
    $code    = (unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF) % 1000000;

    return str_pad((string)$code, 6, '0', STR_PAD_LEFT);
}

function totp_match_slice($secretB32, $code, $window = null) {
    $code = trim((string)$code);

    if (!preg_match('/^[0-9]{6}$/', $code)) { return null; }
    if (empty($secretB32)) { return null; }

    $window = $window === null ? (int)mfa_config('totp_window_steps') : (int)$window;
    $window = max(0, min($window, 10));

    $now     = (int)floor(time() / 30);
    $matched = null;

    for ($i = -$window; $i <= $window; $i++) {
        if (hash_equals(totp_code($secretB32, $now + $i), $code) && $matched === null) {
            $matched = $now + $i;
        }
    }

    return $matched;
}

function totp_verify($secretB32, $code, $window = null) {
    return totp_match_slice($secretB32, $code, $window) !== null;
}


function totp_verify_for_user($conn, $userId, $userRow, $code) {
    $slice = totp_match_slice($userRow['totp_secret'] ?? null, $code);

    if ($slice === null) { return false; }

    if (mfa_config('totp_replay_protection')) {
        $lastSlice = $userRow['last_totp_slice'] ?? null;

        if ($lastSlice !== null && $slice <= (int)$lastSlice) {
            return false;
        }

        $stmt = $conn->prepare(
            "UPDATE admin_users SET last_totp_slice = ?
             WHERE id = ? AND (last_totp_slice IS NULL OR last_totp_slice < ?)"
        );
        $stmt->bind_param("iii", $slice, $userId, $slice);
        $stmt->execute();
        $consumed = $stmt->affected_rows;
        $stmt->close();

        // Lost a race with a concurrent request that used the same slice.
        if ($consumed === 0) { return false; }
    }

    return true;
}

function mfa_owner_key_for_token($mfaToken) {
    return hash('sha256', (string)$mfaToken);
}

function mfa_owner_key_for_user($userId) {
    return hash('sha256', 'user:' . (int)$userId);
}

function mfa_issue_email_code($conn, $purpose, $ownerKey, $userId, $destination) {
    // mfa_gc($conn);

    $code     = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = hash('sha256', $code);
    $ttl      = (int)mfa_config('email_code_ttl_seconds');

    $stmt = $conn->prepare(
        "INSERT INTO admin_mfa_codes (purpose, owner_key, user_id, code_hash, destination, expires_at)
         VALUES (?, ?, ?, ?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ssissi", $purpose, $ownerKey, $userId, $codeHash, $destination, $ttl);
    $stmt->execute();
    $stmt->close();

    mfa_trim_active_codes($conn, $purpose, $ownerKey);

    return $code;
}

function mfa_trim_active_codes($conn, $purpose, $ownerKey) {
    $max = max(1, (int)mfa_config('email_code_max_active'));

    $stmt = $conn->prepare(
        "SELECT id FROM admin_mfa_codes
         WHERE purpose = ? AND owner_key = ? AND consumed_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC"
    );
    $stmt->bind_param("ss", $purpose, $ownerKey);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $ids = [];
    while ($row = $result->fetch_assoc()) { $ids[] = (int)$row['id']; }

    if (count($ids) <= $max) { return; }

    $stale = array_slice($ids, $max);

    foreach ($stale as $id) {
        $stmt = $conn->prepare("UPDATE admin_mfa_codes SET consumed_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();
    }
}

function mfa_consume_email_code($conn, $purpose, $ownerKey, $code) {
    $code = trim((string)$code);

    if (!preg_match('/^[0-9]{6}$/', $code)) { return null; }

    $codeHash = hash('sha256', $code);

    $stmt = $conn->prepare(
        "SELECT id, destination FROM admin_mfa_codes
         WHERE purpose = ? AND owner_key = ? AND code_hash = ?
           AND consumed_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1"
    );
    $stmt->bind_param("sss", $purpose, $ownerKey, $codeHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) { return null; }

    $row                = $result->fetch_assoc();
    $matchedId          = (int)$row['id'];
    $matchedDestination = $row['destination'];

    $stmt = $conn->prepare(
        "UPDATE admin_mfa_codes SET consumed_at = NOW() WHERE id = ? AND consumed_at IS NULL"
    );
    $stmt->bind_param("i", $matchedId);
    $stmt->execute();
    $won = $stmt->affected_rows;
    $stmt->close();

    if ($won === 0) { return null; }

    $stmt = $conn->prepare(
        "UPDATE admin_mfa_codes SET consumed_at = NOW()
         WHERE purpose = ? AND owner_key = ? AND consumed_at IS NULL"
    );
    $stmt->bind_param("ss", $purpose, $ownerKey);
    $stmt->execute();
    $stmt->close();

    return ['id' => $matchedId, 'destination' => $matchedDestination];
}

function mfa_active_code_count($conn, $purpose, $ownerKey) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM admin_mfa_codes
         WHERE purpose = ? AND owner_key = ? AND consumed_at IS NULL AND expires_at > NOW()"
    );
    $stmt->bind_param("ss", $purpose, $ownerKey);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    return $count;
}

function mfa_send_state($conn, $purpose, $ownerKey) {
    $window = (int)mfa_config('resend_window_seconds');

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS sends,
                COALESCE(TIMESTAMPDIFF(SECOND, MAX(sent_at), NOW()), 999999) AS since_last
         FROM admin_mfa_send_log
         WHERE purpose = ? AND owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ssi", $purpose, $ownerKey, $window);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $sends     = (int)($row['sends'] ?? 0);
    $sinceLast = (int)($row['since_last'] ?? 999999);

    $maxPerWindow = max(1, (int)mfa_config('resend_max_per_window'));
    $base         = max(1, (int)mfa_config('resend_cooldown_base_seconds'));
    $cap          = max($base, (int)mfa_config('resend_cooldown_max_seconds'));

    if ($sends >= $maxPerWindow) {
        $stmt = $conn->prepare(
            "SELECT GREATEST(0, ? - TIMESTAMPDIFF(SECOND, MIN(sent_at), NOW())) AS wait
             FROM admin_mfa_send_log
             WHERE purpose = ? AND owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
        );
        $stmt->bind_param("issi", $window, $purpose, $ownerKey, $window);
        $stmt->execute();
        $wait = (int)($stmt->get_result()->fetch_assoc()['wait'] ?? $window);
        $stmt->close();

        return [
            'allowed'     => false,
            'retry_after' => max($wait, 1),
            'reason'      => 'window_limit',
            'sends'       => $sends,
            'remaining'   => 0,
        ];
    }

    $required = $sends === 0 ? 0 : (int)min($base * pow(2, $sends - 1), $cap);
    $wait     = max(0, $required - $sinceLast);

    return [
        'allowed'     => $wait <= 0,
        'retry_after' => $wait,
        'reason'      => $wait > 0 ? 'cooldown' : null,
        'sends'       => $sends,
        'remaining'   => $maxPerWindow - $sends,
        'next_cooldown' => (int)min($base * pow(2, $sends), $cap),
    ];
}

function mfa_record_send($conn, $purpose, $ownerKey, $userId) {
    $stmt = $conn->prepare(
        "INSERT INTO admin_mfa_send_log (purpose, owner_key, user_id) VALUES (?, ?, ?)"
    );
    $stmt->bind_param("ssi", $purpose, $ownerKey, $userId);
    $stmt->execute();
    $stmt->close();
}


function mfa_send_code_email($toAddress, $code, $context = 'login') {
    $from     = mfa_config('mail_from');
    $fromName = mfa_config('mail_from_name');
    $minutes  = max(1, (int)round(mfa_config('email_code_ttl_seconds') / 60));

    if ($context === 'email_verify') {
        $subject = 'Verify this email address';
        $intro   = "Use this code to confirm this address on your Harvest Schools admin account:";
        $footer  = "If you did not request this, you can ignore this message and the address will not be added.";
    } else {
        $subject = 'Harvest Admin verification code';
        $intro   = "Your admin login verification code is:";
        $footer  = "If you did not try to log in, change your password immediately.";
    }

    $body = $intro . "\r\n\r\n    " . $code . "\r\n\r\n"
        . "It expires in {$minutes} minutes.\r\n\r\n"
        . $footer . "\r\n";

    $headers  = "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Auto-Response-Suppress: All\r\n";
    $headers .= "Auto-Submitted: auto-generated\r\n";

    return @mail($toAddress, $subject, $body, $headers, "-f {$from}");
}


function mfa_should_challenge($conn, $userId, $fingerprintHash) {
    $mode = mfa_config('mfa_mode');

    if ($mode === 'never')  { return null; }
    if ($mode === 'always') { return 'always_on'; }

    return compute_mfa_required($conn, $userId, $fingerprintHash);
}

function compute_mfa_required($conn, $userId, $fingerprintHash) {
    $stmt = $conn->prepare("SELECT mfa_verified_once, last_login_at FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) { return 'unknown_user'; }

    if (empty($row['mfa_verified_once'])) { return 'first_mfa'; }

    if ($row['last_login_at'] === null) { return 'stale_login'; }

    $stmt = $conn->prepare(
        "SELECT (last_login_at < (NOW() - INTERVAL 7 DAY)) AS stale FROM admin_users WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stale = (int)($stmt->get_result()->fetch_assoc()['stale'] ?? 1);
    $stmt->close();

    if ($stale === 1) { return 'stale_login'; }

    if (empty($fingerprintHash)) { return 'no_fingerprint'; }

    $stmt = $conn->prepare(
        "SELECT 1 FROM admin_login_events
         WHERE user_id = ? AND fingerprint_hash = ?
           AND event IN ('login_success','mfa_pass')
           AND created_at > (NOW() - INTERVAL 90 DAY)
         LIMIT 1"
    );
    $stmt->bind_param("is", $userId, $fingerprintHash);
    $stmt->execute();
    $known = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if (!$known) { return 'new_device'; }

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM admin_login_events
         WHERE user_id = ? AND event IN ('login_success','logout')
           AND created_at > (NOW() - INTERVAL 1 DAY)"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($count > 10) { return 'high_churn'; }

    return null;
}


function get_available_mfa_methods($conn, $userId) {
    $methods = [];

    $stmt = $conn->prepare(
        "SELECT email, email_verified_at, totp_secret, preferred_mfa
         FROM admin_users WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return ['methods' => [], 'preferred' => null, 'masked_email' => null];
    }

    $stmt = $conn->prepare("SELECT 1 FROM admin_passkeys WHERE user_id = ? LIMIT 1");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) { $methods[] = 'passkey'; }
    $stmt->close();

    if (!empty($row['totp_secret'])) { $methods[] = 'totp'; }

    $emailUsable = !empty($row['email']) && !empty($row['email_verified_at']);
    if ($emailUsable) { $methods[] = 'email'; }

    return [
        'methods'      => $methods,
        'preferred'    => in_array($row['preferred_mfa'], $methods, true)
            ? $row['preferred_mfa']
            : ($methods[0] ?? null),
        'masked_email' => $emailUsable ? mask_email($row['email']) : null,
    ];
}

function mask_email($email) {
    $email = (string)$email;

    if (strpos($email, '@') === false) {
        return str_repeat('*', max(strlen($email), 1));
    }

    [$local, $domain] = explode('@', $email, 2);
    $visible = substr($local, 0, 2);

    return $visible . str_repeat('*', max(strlen($local) - 2, 1)) . '@' . $domain;
}

function is_valid_admin_email($email) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { return false; }

    return (bool)preg_match('/^[A-Za-z0-9._%+-]+@(harvestschools|alfajralbasem)\.com$/i', $email);
}

function log_admin_event($conn, $userId, $event, $fingerprintHash = null) {
    $stmt = $conn->prepare(
        "INSERT INTO admin_login_events (user_id, fingerprint_hash, event) VALUES (?, ?, ?)"
    );
    $stmt->bind_param("iss", $userId, $fingerprintHash, $event);
    $stmt->execute();
    $stmt->close();
}

function mfa_gc($conn) {
    if (random_int(1, 20) !== 1) { return; }

    $conn->query("DELETE FROM admin_mfa_codes WHERE expires_at < (NOW() - INTERVAL 1 DAY)");
    $conn->query("DELETE FROM admin_mfa_send_log WHERE sent_at < (NOW() - INTERVAL 1 DAY)");
    $conn->query("DELETE FROM admin_mfa_challenges WHERE expires_at < (NOW() - INTERVAL 1 DAY)");
}
