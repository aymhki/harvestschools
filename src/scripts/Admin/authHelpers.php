<?php
require_once __DIR__ . '/../permissionLevels.php';
require_once __DIR__ . '/Session/mfaConfig.php';
require_once __DIR__ . '/../securityHeaders.php';
require_once __DIR__ . '/Session/mfaHelpers.php';
require_once __DIR__ . '/../headers.php';

function session_binding_mode_for_request() {
    if (mfa_is_local_request()) {
        return 'none';
    }

    $platform = strtolower(trim($_SERVER['HTTP_X_CLIENT_PLATFORM'] ?? ''));
    return $platform === 'native' ? 'secret' : 'cookie';
}

function set_device_binding_cookie($secret) {
    $ttl = (int)mfa_config('session_absolute_ttl_seconds');

    setcookie(mfa_config('session_binding_cookie'), $secret, [
        'expires'  => time() + $ttl,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function clear_device_binding_cookie() {
    setcookie(mfa_config('session_binding_cookie'), '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function presented_device_secret($bindingMode) {
    if ($bindingMode === 'cookie') {
        return (string)($_COOKIE[mfa_config('session_binding_cookie')] ?? '');
    }

    if ($bindingMode === 'secret') {
        return substr(trim((string)($_SERVER['HTTP_X_DEVICE_BINDING'] ?? '')), 0, 128);
    }

    return '';
}

function record_login_without_mfa($conn, $userId, $hasMethods) {
    if ($hasMethods) {
        $stmt = $conn->prepare("UPDATE admin_users SET logins_without_mfa = 0 WHERE id = ? AND logins_without_mfa <> 0");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        return 0;
    }

    $stmt = $conn->prepare("UPDATE admin_users SET logins_without_mfa = logins_without_mfa + 1 WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("SELECT logins_without_mfa FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $used = (int)($stmt->get_result()->fetch_assoc()['logins_without_mfa'] ?? 0);
    $stmt->close();

    return $used;
}

function check_mfa_setup_gate($conn, $userId, $allowDuringSetup = false) {
    $graceLogins = (int)mfa_config('mfa_setup_grace_logins');

    if ($graceLogins <= 0) { return null; }

    $stmt = $conn->prepare("SELECT logins_without_mfa FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) { return null; }
    if ((int)$row['logins_without_mfa'] < $graceLogins) { return null; }
    $mfaInfo = get_available_mfa_methods($conn, $userId);

    if (!empty($mfaInfo['methods'])) {
        $stmt = $conn->prepare("UPDATE admin_users SET logins_without_mfa = 0 WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        return null;
    }

    if ($allowDuringSetup) { return null; }

    return [
        "success"          => false,
        "message"          => "Set up a login verification method to continue using your account.",
        "mfaSetupRequired" => true,
        "code"             => 428
    ];
}



function validate_admin_session($conn, $options = []) {
    $tokenHash = get_bearer_token_hash();

    if (!$tokenHash) {
        return ["success" => false, "message" => "Missing bearer token", "code" => 401];
    }

    $idleTtl     = (int)mfa_config('session_idle_ttl_seconds');
    $absoluteTtl = (int)mfa_config('session_absolute_ttl_seconds');

    $stmt = $conn->prepare(
        "SELECT user_id, binding_mode, device_secret_hash,
                (created_at < (NOW() - INTERVAL ? SECOND)) AS aged_out
         FROM admin_sessions
         WHERE id = ? AND last_seen >= (NOW() - INTERVAL ? SECOND)"
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
        delete_admin_session_row($conn, $tokenHash);

        return [
            "success" => false,
            "message" => "Your session has reached its maximum age. Please log in again.",
            "code"    => 401
        ];
    }

    $bindingMode = $row['binding_mode'] ?? 'none';

    if ($bindingMode !== 'none') {
        $presented = presented_device_secret($bindingMode);
        $expected  = (string)($row['device_secret_hash'] ?? '');

        if ($expected === '' || $presented === '' ||
            !hash_equals($expected, hash('sha256', $presented))) {
            return [
                "success" => false,
                "message" => "This session is not valid on this device. Please log in again.",
                "code"    => 401
            ];
        }
    }

    $stmt = $conn->prepare("UPDATE admin_sessions SET last_seen = NOW() WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();

    $userId = (int)$row['user_id'];
    $gate = check_mfa_setup_gate($conn, $userId, !empty($options['allow_during_mfa_setup']));
    if ($gate !== null) { return $gate; }

    return ["success" => true, "user_id" => $userId, "code" => 200];
}

function delete_admin_session_row($conn, $tokenHash) {
    $stmt = $conn->prepare("DELETE FROM admin_sessions WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();
}



function check_admin_user_permission($conn, $requiredPermission, $explicitSessionId = null, $options = []) {
    $sessionCheck = validate_admin_session($conn, $options);

    if (!$sessionCheck['success']) {
        return $sessionCheck;
    }

    $sessionId = get_bearer_token_hash();

    if (empty($sessionId)) {
        return [
            "success" => false,
            "message" => "Bad Request: Missing session_id in payload",
            "code" => 400
        ];
    }

    $stmt = $conn->prepare("SELECT p.permission_level_id FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id JOIN admin_users_permissions_linker p ON u.id = p.admin_user_id  WHERE s.id = ?");

    if (!$stmt) {
        return [
            "success" => false,
            "message" => "Prepare failed: " . $conn->error,
            "code" => 500
        ];
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows === 0) {
        return [
            "success" => false,
            "message" => "Invalid session",
            "code" => 401
        ];
    }

    $permissionRow = array_map(fn($n)=> (string)$n, array_column($permissionResult->fetch_all(MYSQLI_ASSOC), 'permission_level_id'));
    global $JACK_OF_ALL_TRADES;

    if (!in_array($JACK_OF_ALL_TRADES, $permissionRow)) {
        if (is_array($requiredPermission)) {
            $missingPermissions = array_diff($requiredPermission, $permissionRow);

            if (!empty($missingPermissions)) {
                return [
                    "success" => false,
                    "message" => "Permission denied",
                    "code" => 403
                ];
            }
        } else {
            if (!in_array($requiredPermission, $permissionRow, true)) {
                return [
                    "success" => false,
                    "message" => "Permission denied",
                    "code" => 403
                ];
            }
        }
    }

    return [
        "success" => true,
        "message" => "Permission granted",
        "code" => 200,
        "session_id" => $sessionId,
    ];
}

function issue_admin_session($conn, $userId, $fingerprintHash = null) {
    $idleTtl     = (int)mfa_config('session_idle_ttl_seconds');
    $absoluteTtl = (int)mfa_config('session_absolute_ttl_seconds');
    $maxSessions = max(1, (int)mfa_config('session_max_per_user'));

    $stmt = $conn->prepare(
        "DELETE FROM admin_sessions
         WHERE user_id = ?
           AND (last_seen < (NOW() - INTERVAL ? SECOND)
                OR created_at < (NOW() - INTERVAL ? SECOND))"
    );
    $stmt->bind_param("iii", $userId, $idleTtl, $absoluteTtl);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare(
        "DELETE FROM admin_sessions WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (SELECT id FROM admin_sessions WHERE user_id = ? ORDER BY last_seen DESC LIMIT ?) keep
        )"
    );
    $stmt->bind_param("iii", $userId, $userId, $maxSessions);
    $stmt->execute();
    $stmt->close();

    $token     = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $token);

    $publicId = bin2hex(random_bytes(16));

    $bindingMode      = session_binding_mode_for_request();
    $deviceSecret     = null;
    $deviceSecretHash = null;

    if ($bindingMode !== 'none') {
        $deviceSecret     = bin2hex(random_bytes(32));
        $deviceSecretHash = hash('sha256', $deviceSecret);
    }

    $userAgent = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    $stmt = $conn->prepare(
        "INSERT INTO admin_sessions
            (id, public_id, user_id, fingerprint_hash, binding_mode, device_secret_hash, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssissss", $tokenHash, $publicId, $userId, $fingerprintHash, $bindingMode, $deviceSecretHash, $userAgent);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE admin_users SET last_login_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    if ($bindingMode === 'cookie') {
        set_device_binding_cookie($deviceSecret);
    }

    return [
        'token' => $token,
        'deviceSecret' => $bindingMode === 'secret' ? $deviceSecret : null,
        'bindingMode'  => $bindingMode,
    ];
}


function describe_user_agent($userAgent) {
    $ua = (string)$userAgent;

    if ($ua === '') { return 'Unknown device'; }

    $browser = 'Unknown browser';
    foreach ([
                 'Edg/'     => 'Edge',
                 'OPR/'     => 'Opera',
                 'Chrome/'  => 'Chrome',
                 'Safari/'  => 'Safari',
                 'Firefox/' => 'Firefox',
             ] as $needle => $name) {
        if (strpos($ua, $needle) !== false) { $browser = $name; break; }
    }

    $platform = 'Unknown OS';
    foreach ([
                 'Windows'  => 'Windows',
                 'Android'  => 'Android',
                 'iPhone'   => 'iPhone',
                 'iPad'     => 'iPad',
                 'Mac OS X' => 'macOS',
                 'Linux'    => 'Linux',
             ] as $needle => $name) {
        if (strpos($ua, $needle) !== false) { $platform = $name; break; }
    }

    return $browser . ' on ' . $platform;
}

function list_admin_sessions($conn, $userId, $currentTokenHash) {
    $idleTtl     = (int)mfa_config('session_idle_ttl_seconds');
    $absoluteTtl = (int)mfa_config('session_absolute_ttl_seconds');

    $stmt = $conn->prepare(
        "SELECT id, public_id, user_agent, binding_mode,
                DATE_FORMAT(created_at, '%b %e, %Y at %l:%i %p') AS created_label,
                DATE_FORMAT(last_seen,  '%b %e, %Y at %l:%i %p') AS last_seen_label,
                TIMESTAMPDIFF(SECOND, last_seen, NOW()) AS seconds_idle,
                GREATEST(0, ? - TIMESTAMPDIFF(SECOND, created_at, NOW())) AS seconds_remaining
         FROM admin_sessions
         WHERE user_id = ?
           AND last_seen >= (NOW() - INTERVAL ? SECOND)
           AND created_at >= (NOW() - INTERVAL ? SECOND)
         ORDER BY last_seen DESC"
    );
    $stmt->bind_param("iiii", $absoluteTtl, $userId, $idleTtl, $absoluteTtl);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $sessions = [];

    while ($row = $result->fetch_assoc()) {
        $sessions[] = [
            'publicId'         => $row['public_id'],
            'device'           => describe_user_agent($row['user_agent']),
            'createdAt'        => $row['created_label'],
            'lastSeen'         => $row['last_seen_label'],
            'secondsIdle'      => (int)$row['seconds_idle'],
            'expiresInSeconds' => (int)$row['seconds_remaining'],
            'bound'            => ($row['binding_mode'] ?? 'none') !== 'none',
            'isCurrent'        => hash_equals((string)$row['id'], (string)$currentTokenHash),
        ];
    }

    return $sessions;
}