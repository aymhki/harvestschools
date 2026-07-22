<?php
require_once __DIR__ . '/headers.php';

function pwreset_safe_table($name) {
    if (!is_string($name) || !preg_match('/^[A-Za-z0-9_]+$/', $name)) {
        throw new InvalidArgumentException('Invalid table identifier');
    }
    return $name;
}

function pwreset_mask_email($email) {
    $email = (string)$email;

    if (strpos($email, '@') === false) {
        return str_repeat('*', max(strlen($email), 1));
    }

    [$local, $domain] = explode('@', $email, 2);
    $visible = mb_substr($local, 0, 2);

    return $visible . str_repeat('*', max(mb_strlen($local) - 2, 1)) . '@' . $domain;
}

function pwreset_owner_key_for_token($token) {
    return hash('sha256', (string)$token);
}

function pwreset_issue_email_code($conn, $ctx, $ownerKey, $userId, $destination) {
    $table = pwreset_safe_table($ctx['codes_table']);
    $code     = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = hash('sha256', $code);
    $ttl      = (int)$ctx['ttl_seconds'];

    $stmt = $conn->prepare(
        "INSERT INTO {$table} (owner_key, user_id, code_hash, destination, expires_at)
         VALUES (?, ?, ?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("sissi", $ownerKey, $userId, $codeHash, $destination, $ttl);
    $stmt->execute();
    $stmt->close();

    pwreset_trim_active_codes($conn, $ctx, $ownerKey);

    return $code;
}

function pwreset_trim_active_codes($conn, $ctx, $ownerKey) {
    $table = pwreset_safe_table($ctx['codes_table']);
    $max   = max(1, (int)$ctx['max_active']);

    $stmt = $conn->prepare(
        "SELECT id FROM {$table}
         WHERE owner_key = ? AND consumed_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC"
    );
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $ids = [];
    while ($row = $result->fetch_assoc()) { $ids[] = (int)$row['id']; }

    if (count($ids) <= $max) { return; }

    foreach (array_slice($ids, $max) as $id) {
        $stmt = $conn->prepare("UPDATE {$table} SET consumed_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();
    }
}

function pwreset_consume_email_code($conn, $ctx, $ownerKey, $code) {
    $table = pwreset_safe_table($ctx['codes_table']);
    $code  = trim((string)$code);

    if (!preg_match('/^[0-9]{6}$/', $code)) { return null; }

    $codeHash = hash('sha256', $code);

    $stmt = $conn->prepare(
        "SELECT id, destination FROM {$table}
         WHERE owner_key = ? AND code_hash = ?
           AND consumed_at IS NULL AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1"
    );
    $stmt->bind_param("ss", $ownerKey, $codeHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) { return null; }

    $row = $result->fetch_assoc();
    $matchedId = (int)$row['id'];

    $stmt = $conn->prepare("UPDATE {$table} SET consumed_at = NOW() WHERE id = ? AND consumed_at IS NULL");
    $stmt->bind_param("i", $matchedId);
    $stmt->execute();
    $won = $stmt->affected_rows;
    $stmt->close();

    if ($won === 0) { return null; }

    $stmt = $conn->prepare("UPDATE {$table} SET consumed_at = NOW() WHERE owner_key = ? AND consumed_at IS NULL");
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $stmt->close();

    return ['id' => $matchedId, 'destination' => $row['destination']];
}

function pwreset_invalidate_codes($conn, $ctx, $ownerKey) {
    $table = pwreset_safe_table($ctx['codes_table']);
    $stmt = $conn->prepare("UPDATE {$table} SET consumed_at = NOW() WHERE owner_key = ? AND consumed_at IS NULL");
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $stmt->close();
}

function pwreset_active_code_count($conn, $ctx, $ownerKey) {
    $table = pwreset_safe_table($ctx['codes_table']);
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM {$table}
         WHERE owner_key = ? AND consumed_at IS NULL AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $ownerKey);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    return $count;
}

function pwreset_send_state($conn, $ctx, $ownerKey) {
    $table  = pwreset_safe_table($ctx['send_log_table']);
    $window = (int)$ctx['window_seconds'];

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS sends,
                COALESCE(TIMESTAMPDIFF(SECOND, MAX(sent_at), NOW()), 999999) AS since_last
         FROM {$table}
         WHERE owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("si", $ownerKey, $window);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $sends     = (int)($row['sends'] ?? 0);
    $sinceLast = (int)($row['since_last'] ?? 999999);

    $maxPerWindow = max(1, (int)$ctx['max_per_window']);
    $base         = max(1, (int)$ctx['cooldown_base']);
    $cap          = max($base, (int)$ctx['cooldown_max']);

    if ($sends >= $maxPerWindow) {
        $stmt = $conn->prepare(
            "SELECT GREATEST(0, ? - TIMESTAMPDIFF(SECOND, MIN(sent_at), NOW())) AS wait
             FROM {$table}
             WHERE owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
        );
        $stmt->bind_param("isi", $window, $ownerKey, $window);
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
    ];
}

function pwreset_record_send($conn, $ctx, $ownerKey, $userId) {
    $table = pwreset_safe_table($ctx['send_log_table']);
    $stmt = $conn->prepare("INSERT INTO {$table} (owner_key, user_id) VALUES (?, ?)");
    $stmt->bind_param("si", $ownerKey, $userId);
    $stmt->execute();
    $stmt->close();
}

function pwreset_send_code_email($ctx, $toAddress, $code) {
    if (empty($toAddress)) { return false; }

    $from     = $ctx['mail_from'];
    $fromName = $ctx['mail_from_name'];
    $minutes  = max(1, (int)round(((int)$ctx['ttl_seconds']) / 60));

    $body = $ctx['intro'] . "\r\n\r\n    " . $code . "\r\n\r\n"
        . str_replace('{minutes}', (string)$minutes, $ctx['expiry_line']) . "\r\n\r\n"
        . $ctx['footer'] . "\r\n";

    $headers  = "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Auto-Response-Suppress: All\r\n";
    $headers .= "Auto-Submitted: auto-generated\r\n";

    return @mail($toAddress, $ctx['subject'], $body, $headers, "-f {$from}");
}

function pwreset_attempts_exceeded($attempts, $maxAttempts) {
    return (int)$attempts >= (int)$maxAttempts;
}

function pwreset_password_policy_error($password) {
    if (strlen($password) < 8 ||
        !preg_match('/[A-Z]/', $password) ||
        !preg_match('/[a-z]/', $password) ||
        !preg_match('/[0-9]/', $password) ||
        !preg_match('/[^a-zA-Z0-9]/', $password)) {
        return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
    }
    return null;
}
