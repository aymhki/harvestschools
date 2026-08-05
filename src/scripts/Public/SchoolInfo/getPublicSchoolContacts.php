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

if (!public_rate_limit_allow('school-contacts', 60, 60)) {
    public_rate_limit_reject();
}

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$language = public_info_normalise_language($_GET['lang'] ?? 'en');

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

    $departments = public_school_departments($conn, $language);
    $profile = public_school_profile($conn, $language);

    $payload = [
        'schemaVersion' => PUBLIC_INFO_SCHEMA_VERSION,
        'generatedAt'   => gmdate('c'),
        'language'      => $language,
        'school'        => [
            'name'         => $profile['school_name']['value'] ?? null,
            'address'      => $profile['address']['value'] ?? null,
            'generalPhone' => $profile['general_phone']['value'] ?? null,
            'email'        => $profile['email']['value'] ?? null,
            'website'      => $profile['website']['value'] ?? null,
            'workingHours' => $profile['working_hours']['value'] ?? null,
            'mapsUrl'      => $profile['maps_url']['value'] ?? null,
        ],
        'departments'   => $departments,
    ];

    header('ETag: "' . substr(hash('sha256', json_encode($payload['departments'], JSON_UNESCAPED_UNICODE)), 0, 32) . '"');

    echo json_encode([
        "success" => true,
        "message" => "Contacts retrieved successfully",
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
