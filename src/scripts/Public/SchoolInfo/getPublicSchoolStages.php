<?php
require_once '../../headers.php';
require_once __DIR__ . '/publicSchoolInfoHelpers.php';
require_once __DIR__ . '/publicRateLimit.php';

set_public_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!public_rate_limit_allow('school-stages', 60, 60)) {
    public_rate_limit_reject();
}

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$language = public_info_normalise_language($_GET['lang'] ?? 'en');
$departmentKey = isset($_GET['dept']) ? trim((string)$_GET['dept']) : null;
$offeredOnly = isset($_GET['offered']) && (string)$_GET['offered'] === '1';

$conn = null;

try {
    $dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 503], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $rules = public_info_read_rule_settings($conn);
    $includeUnoffered = !$offeredOnly && (($rules['SHOW_UNOFFERED_STAGES'] ?? '1') === '1');
    $stages = public_school_stages($conn, $language, $includeUnoffered, $departmentKey);

    $profile = public_school_profile($conn, $language);
    $currency = $profile['tuition_currency']['value'] ?? 'EGP';

    $payload = [
        'schemaVersion'   => PUBLIC_INFO_SCHEMA_VERSION,
        'generatedAt'     => gmdate('c'),
        'language'        => $language,
        'tuitionCurrency' => $currency,
        'stages'          => $stages,
    ];

    header('ETag: "' . substr(hash('sha256', json_encode($stages, JSON_UNESCAPED_UNICODE)), 0, 32) . '"');

    echo json_encode([
        "success" => true,
        "message" => "Stages retrieved successfully",
        "code"    => 200,
        "data"    => $payload
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "School information is temporarily unavailable", "code" => 500], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
