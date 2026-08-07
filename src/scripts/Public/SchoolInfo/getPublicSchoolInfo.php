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

if (!public_rate_limit_allow('school-info', 60, 60)) {
    public_rate_limit_reject();
}

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$language = public_info_normalise_language($_GET['lang'] ?? 'en');
$since = isset($_GET['since']) ? (string)$_GET['since'] : '';

$conn = null;

try {
    list($document, $servedFrom) = public_school_load_document($doc_root, $language, $conn);

    if ($document === null) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 503]);
        exit;
    }

    $contentHash = (string)($document['contentHash'] ?? '');
    $etag = '"' . $contentHash . '"';

    header('ETag: ' . $etag);
    header('X-Harvest-Served-From: ' . $servedFrom);

    $ifNoneMatch = trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));

    if ($ifNoneMatch !== '' && $ifNoneMatch === $etag) {
        http_response_code(304);
        exit;
    }

    if ($since !== '' && $since === $contentHash) {
        echo json_encode([
            "success" => true,
            "message" => "Content unchanged",
            "code"    => 200,
            "data"    => [
                "unchanged"     => true,
                "schemaVersion" => PUBLIC_INFO_SCHEMA_VERSION,
                "contentHash"   => $contentHash,
                "language"      => $language,
                "generatedAt"   => $document['generatedAt'] ?? null
            ]
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "School information retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
