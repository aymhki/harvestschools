<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/analyticsHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $INFO_SYSTEM_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $INFO_SYSTEM_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $section = analytics_website_section($conn);

    if (!$section['configured']) {
        echo json_encode([
            "success" => false,
            "message" => $section['message'],
            "code" => $section['code'] ?? 503
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "reportingWindow" => $section['reportingWindow'],
        "generatedAt" => $section['generatedAt'],
        "cacheAgeSeconds" => $section['cacheAgeSeconds'],
        "data" => [
            "totals" => $section['totals'],
            "usersOverTime" => $section['usersOverTime'],
            "rankings" => $section['rankings']
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
