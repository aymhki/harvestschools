<?php
require_once '../../headers.php';
require_once __DIR__ . '/publicSchoolInfoHelpers.php';
require_once __DIR__ . '/publicRateLimit.php';

const PUBLIC_STAGE_FEES_DEPARTMENTS = ['national', 'british', 'american'];
const PUBLIC_STAGE_AGE_DEPARTMENTS = ['early', 'national', 'british', 'american'];

const PUBLIC_STAGE_FEES_HIDDEN = [];
const PUBLIC_STAGE_AGE_HIDDEN = [];

set_public_cors_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    header('Allow: GET, OPTIONS');
    echo json_encode(["success" => false, "message" => "Method not allowed", "code" => 405]);
    exit;
}

if (!public_rate_limit_allow('public-stages', 60, 60)) {
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
        echo json_encode(["success" => false, "message" => "The stage tables are temporarily unavailable", "code" => 503]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $rules = public_info_read_rule_settings($conn);
    $includeUnoffered = ($rules['SHOW_UNOFFERED_STAGES'] ?? '1') === '1';

    $profile = public_school_profile($conn, $language);
    $policies = public_school_policies($conn, $language);

    $departments = [];
    $stages = public_school_stages($conn, $language, $includeUnoffered);

    foreach (array_unique(array_merge(PUBLIC_STAGE_FEES_DEPARTMENTS, PUBLIC_STAGE_AGE_DEPARTMENTS)) as $departmentKey) {
        $departments[$departmentKey] = [
            'key'   => $departmentKey,
            'name'  => '',
            'fees'  => [],
            'ages'  => [],
        ];
    }

    foreach ($stages as $stage) {
        $departmentKey = $stage['departmentKey'];

        if (!isset($departments[$departmentKey])) {
            continue;
        }

        if ($departments[$departmentKey]['name'] === '') {
            $departments[$departmentKey]['name'] = $stage['departmentName'];
        }

        if ($stage['tuitionFees'] !== null
            && in_array($departmentKey, PUBLIC_STAGE_FEES_DEPARTMENTS, true)
            && !in_array($stage['key'], PUBLIC_STAGE_FEES_HIDDEN, true)) {
            $departments[$departmentKey]['fees'][] = [
                'key'  => $stage['key'],
                'name' => $stage['name'],
                'fees' => $stage['tuitionFees'],
            ];
        }

        if ($stage['minimumAge'] !== null && $stage['minimumAge'] !== ''
            && in_array($departmentKey, PUBLIC_STAGE_AGE_DEPARTMENTS, true)
            && !in_array($stage['key'], PUBLIC_STAGE_AGE_HIDDEN, true)) {
            $departments[$departmentKey]['ages'][] = [
                'key'        => $stage['key'],
                'name'       => $stage['name'],
                'minimumAge' => $stage['minimumAge'],
            ];
        }
    }

    $departments = array_values(array_filter($departments, static function ($department) {
        return $department['fees'] !== [] || $department['ages'] !== [];
    }));

    $feeExclusions = array_values(array_map(static function ($item) {
        return $item['title'];
    }, $policies['fee_exclusions'] ?? []));

    $admissionRequirements = [];

    foreach ($stages as $stage) {
        if ($stage['admissionRequirements'] === []) {
            continue;
        }

        $admissionRequirements[] = [
            'key'            => $stage['key'],
            'name'           => $stage['name'],
            'departmentKey'  => $stage['departmentKey'],
            'departmentName' => $stage['departmentName'],
            'sortOrder'      => $stage['sortOrder'],
            'requirements'   => $stage['admissionRequirements'],
        ];
    }

    $document = [
        'schemaVersion'  => PUBLIC_INFO_SCHEMA_VERSION,
        'language'       => $language,
        'currency'       => $profile['tuition_currency']['value'] ?? 'EGP',
        'feeExclusions'  => $feeExclusions,
        'minimumAgeNote' => $profile['minimum_age_cutoff']['value'] ?? null,
        'departments'    => $departments,
        'admissionRequirements' => $admissionRequirements,
        'admissionRequirementNotes' => public_school_admission_notes($conn, $language),
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
        "message" => "Stage tables retrieved successfully",
        "code"    => 200,
        "data"    => $document
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "The stage tables are temporarily unavailable", "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
