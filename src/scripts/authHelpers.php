<?php

function check_user_permission($conn, $requiredPermission, $explicitSessionId = null, $cookieName = 'harvest_schools_admin_session_id') {
    $sessionId = $explicitSessionId;

    if (empty($sessionId)) {
        if (isset($_COOKIE[$cookieName]) && !empty($_COOKIE[$cookieName])) {
            $sessionId = $_COOKIE[$cookieName];
        } else {
            return [
                "success" => false,
                "message" => "Bad Request: Missing session_id in payload and cookies",
                "code" => 400
            ];
        }
    }

    $stmt = $conn->prepare("SELECT u.permission_level FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.id = ?");
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

    $permissionRow = $permissionResult->fetch_assoc();
    $cleanPermissionLevels = array_map('intval', explode(',', $permissionRow['permission_level']));

    if (!in_array((int)$requiredPermission, $cleanPermissionLevels, true)) {
        return [
            "success" => false,
            "message" => "Permission denied",
            "code" => 403
        ];
    }

    return [
        "success" => true,
        "message" => "Permission granted",
        "code" => 200
    ];
}