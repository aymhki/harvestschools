<?php
require_once '../../permissionLevels.php';

function get_bearer_token_hash() {
    $token = get_bearer_token();
    return $token ? hash('sha256', $token) : null;
}

function validate_admin_session($conn) {
    $tokenHash = get_bearer_token_hash();
    if (!$tokenHash) {
        return ["success" => false, "message" => "Missing bearer token", "code" => 401];
    }

    $stmt = $conn->prepare(
        "SELECT user_id, fingerprint_hash FROM admin_sessions
         WHERE id = ? AND last_seen >= (NOW() - INTERVAL 12 HOUR)"
    );
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        return ["success" => false, "message" => "Invalid or expired session", "code" => 401];
    }

    $row = $result->fetch_assoc();

    if (!empty($row['fingerprint_hash'])) {
        $clientFp = isset($_SERVER['HTTP_X_CLIENT_FINGERPRINT'])
            ? substr(trim($_SERVER['HTTP_X_CLIENT_FINGERPRINT']), 0, 64)
            : '';
        if (!hash_equals($row['fingerprint_hash'], $clientFp)) {
            return ["success" => false, "message" => "Session/device mismatch", "code" => 401];
        }
    }

    $stmt = $conn->prepare("UPDATE admin_sessions SET last_seen = NOW() WHERE id = ?");
    $stmt->bind_param("s", $tokenHash);
    $stmt->execute();
    $stmt->close();

    return ["success" => true, "user_id" => (int)$row['user_id'], "code" => 200];
}

function get_bearer_token() {
    $headers = null;

    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }

    return null;
}

function check_admin_user_permission($conn, $requiredPermission, $explicitSessionId = null) {
    $sessionCheck = validate_admin_session($conn);
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
