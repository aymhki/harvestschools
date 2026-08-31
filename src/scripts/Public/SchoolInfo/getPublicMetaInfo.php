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

if (!public_rate_limit_allow('public-meta-info', 60, 60)) {
    public_rate_limit_reject();
}

$language = public_info_normalise_language($_GET['lang'] ?? 'en');

$conn = null;

try {
    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "The meta info is temporarily unavailable", "code" => 503]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $metaInfo = public_school_meta_info($conn, $language);

    $document = [
        'schemaVersion' => PUBLIC_INFO_SCHEMA_VERSION,
        'language'      => $language,
        'lastUpdated'   => $metaInfo['lastUpdated'],
        'header'        => $metaInfo['header'],
        'items'         => $metaInfo['items'],
        'copyAll'       => $metaInfo['copyAll'],
    ];

    $document['contentHash'] = hash('sha256', json_encode($document, JSON_UNESCAPED_UNICODE));
    $etag = '"' . $document['contentHash'] . '"';

    header('ETag: ' . $etag);

    if (trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
        http_response_code(304);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Meta info retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "The meta info is temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
