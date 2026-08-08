<?php
require_once '../../headers.php';
require_once __DIR__ . '/publicSchoolInfoHelpers.php';
require_once __DIR__ . '/publicRateLimit.php';


set_public_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405]);
    exit;
}

if (!public_rate_limit_allow('school-section', 120, 60)) {
    public_rate_limit_reject();
}

$section = trim((string)($_GET['section'] ?? ''));
$language = public_info_normalise_language($_GET['lang'] ?? 'en');

if (!public_school_section_exists($section)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Unknown section", "code" => 400]);
    exit;
}

$conn = null;

try {
    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 503]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $payload = [
        'schemaVersion' => PUBLIC_INFO_SCHEMA_VERSION,
        'generatedAt'   => gmdate('c'),
        'language'      => $language,
        'section'       => $section,
        $section        => public_school_section($conn, $language, $section),
    ];

    $etag = '"' . substr(hash('sha256', json_encode($payload[$section], JSON_UNESCAPED_UNICODE)), 0, 32) . '"';

    header('ETag: ' . $etag);

    if (trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
        http_response_code(304);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Section retrieved successfully",
        "code"    => 200,
        "data"    => $payload
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
