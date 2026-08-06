<?php
require_once '../../headers.php';
require_once __DIR__ . '/staffDepartments.php';
require_once __DIR__ . '/publicStaffHelpers.php';
require_once __DIR__ . '/../SchoolInfo/publicInfoAllowlist.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';

set_public_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!public_rate_limit_allow('public-staff', 60, 60)) {
    public_rate_limit_reject();
}

$language = public_info_normalise_language($_GET['lang'] ?? 'en');
$departmentKey = substr(trim((string)($_GET['department'] ?? '')), 0, 50);

if (!in_array($departmentKey, staff_department_keys(), true)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Unknown department", "code" => 400], JSON_UNESCAPED_UNICODE);
    exit;
}

$conn = null;

try {
    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "Staff information is temporarily unavailable", "code" => 503], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $document = public_staff_document($conn, $departmentKey, $language);
    $etag = '"' . $document['contentHash'] . '"';

    header('ETag: ' . $etag);

    if (trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
        http_response_code(304);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Staff list retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Staff information is temporarily unavailable", "code" => 500], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
