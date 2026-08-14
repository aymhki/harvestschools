<?php
require_once '../../headers.php';
require_once __DIR__ . '/publicSchoolInfoHelpers.php';
require_once __DIR__ . '/publicRateLimit.php';

set_public_cors_headers(['cache_control' => 'no-cache, must-revalidate']);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405]);
    exit;
}

if (!public_rate_limit_allow('public-page-gates', 120, 60)) {
    public_rate_limit_reject();
}

$conn = null;

try {
    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "The page gates are temporarily unavailable", "code" => 503]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $gates = public_page_gates($conn);
    $disabled = [];

    foreach (PUBLIC_PAGE_INVENTORY as $page) {
        if (public_page_is_enabled($gates, $page['id'])) {
            continue;
        }

        $disabled[$page['path']] = [
            'pageId'    => $page['id'],
            'titleKey'  => $page['titleKey'],
            'titleEn'   => $page['titleEn'],
            'messageEn' => $gates[$page['id']]['messageEn'],
            'messageAr' => $gates[$page['id']]['messageAr'],
        ];
    }

    $document = [
        'schemaVersion' => PUBLIC_INFO_SCHEMA_VERSION,
        'gates'         => (object)$disabled,
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
        "message" => "Page gates retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "The page gates are temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
