<?php

function base32_encode_bytes($data) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $bits = '';
    foreach (str_split($data) as $c) {
        $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 5) as $chunk) {
        $out .= $alphabet[bindec(str_pad($chunk, 5, '0'))];
    }
    return $out;
}

function base32_decode_str($b32) {
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $b32 = strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $b32));
    $bits = '';
    for ($i = 0; $i < strlen($b32); $i++) {
        $bits .= str_pad(decbin(strpos($alphabet, $b32[$i])), 5, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 8) as $chunk) {
        if (strlen($chunk) === 8) { $out .= chr(bindec($chunk)); }
    }
    return $out;
}

function totp_code($secretB32, $timeSlice = null) {
    $key = base32_decode_str($secretB32);
    $timeSlice = $timeSlice ?? floor(time() / 30);
    $binTime = pack('N*', 0) . pack('N*', $timeSlice);
    $hash = hash_hmac('sha1', $binTime, $key, true);
    $offset = ord(substr($hash, -1)) & 0x0F;
    $code = (unpack('N', substr($hash, $offset, 4))[1] & 0x7FFFFFFF) % 1000000;
    return str_pad($code, 6, '0', STR_PAD_LEFT);
}

function totp_verify($secretB32, $code, $window = 1) {
    $slice = floor(time() / 30);
    for ($i = -$window; $i <= $window; $i++) {
        if (hash_equals(totp_code($secretB32, $slice + $i), trim($code))) { return true; }
    }
    return false;
}

function compute_mfa_required($conn, $userId, $fingerprintHash) {
    $stmt = $conn->prepare("SELECT mfa_verified_once, last_login_at FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row['mfa_verified_once']) { return 'first_mfa'; }

    if ($row['last_login_at'] === null || strtotime($row['last_login_at']) < time() - 7 * 86400) {
        return 'stale_login';
    }

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
    $stmt = $conn->prepare("SELECT email, totp_secret, preferred_mfa FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $stmt = $conn->prepare("SELECT 1 FROM admin_passkeys WHERE user_id = ? LIMIT 1");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) { $methods[] = 'passkey'; }
    $stmt->close();

    if (!empty($row['totp_secret'])) { $methods[] = 'totp'; }
    if (!empty($row['email']))       { $methods[] = 'email'; }

    return [
        'methods'      => $methods,
        'preferred'    => in_array($row['preferred_mfa'], $methods, true) ? $row['preferred_mfa'] : ($methods[0] ?? null),
        'masked_email' => !empty($row['email']) ? mask_email($row['email']) : null,
    ];
}

function mask_email($email) {
    [$local, $domain] = explode('@', $email, 2);
    $visible = substr($local, 0, 2);
    return $visible . str_repeat('*', max(strlen($local) - 2, 1)) . '@' . $domain;
}

function log_admin_event($conn, $userId, $event, $fingerprintHash = null) {
    $stmt = $conn->prepare("INSERT INTO admin_login_events (user_id, fingerprint_hash, event) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $userId, $fingerprintHash, $event);
    $stmt->execute();
    $stmt->close();
}