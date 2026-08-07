<?php
require_once '../../headers.php';
require_once __DIR__ . '/libraryCategories.php';
require_once __DIR__ . '/publicLibraryHelpers.php';
require_once __DIR__ . '/../SchoolInfo/publicInfoAllowlist.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';


set_public_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405]);
    exit;
}

if (!public_rate_limit_allow('public-library', 60, 60)) {
    public_rate_limit_reject();
}

$language = public_info_normalise_language($_GET['lang'] ?? 'en');
$categoryKey = substr(trim((string)($_GET['category'] ?? '')), 0, 40);

if (!library_category_exists($categoryKey)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Unknown library category", "code" => 400]);
    exit;
}

$conn = null;

try {
    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "The library is temporarily unavailable", "code" => 503]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $document = public_library_document($conn, $categoryKey, $language);
    $etag = '"' . $document['contentHash'] . '"';

    header('ETag: ' . $etag);

    if (trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
        http_response_code(304);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Library retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "The library is temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
