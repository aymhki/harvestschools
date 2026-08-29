<?php

const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const ANALYTICS_REPORT_URL = 'https://analyticsdata.googleapis.com/v1beta/properties/';
const ANALYTICS_TIMEOUT_SECONDS = 10;
const ANALYTICS_DISPLAY_TIME_ZONE = 'Africa/Cairo';



function analytics_base64url_encode($value) {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}


function analytics_settings($conn) {
    $settings = ['property_id' => '', 'service_account_file' => ''];

    $res = $conn->query("SELECT setting_key, setting_value FROM info_system_global_settings WHERE setting_key IN ('GA4_PROPERTY_ID', 'GA4_SERVICE_ACCOUNT_FILE')");

    if (!$res) {
        return $settings;
    }

    while ($row = $res->fetch_assoc()) {
        if ($row['setting_key'] === 'GA4_PROPERTY_ID') {
            $settings['property_id'] = trim((string)$row['setting_value']);
        } else {
            $settings['service_account_file'] = trim((string)$row['setting_value']);
        }
    }

    return $settings;
}


function analytics_service_account($fileName) {
    if ($fileName === '' || strpbrk($fileName, '/\\') !== false) {
        return null;
    }

    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    if ($docRoot === '') {
        return null;
    }

    $path = dirname($docRoot) . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR . $fileName;

    if (!is_file($path) || !is_readable($path)) {
        return null;
    }

    $decoded = json_decode((string)file_get_contents($path), true);

    if (!is_array($decoded) || empty($decoded['client_email']) || empty($decoded['private_key']) || empty($decoded['token_uri'])) {
        return null;
    }

    return $decoded;
}


function analytics_token_cache_path() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $docRoot === '' ? '' : dirname($docRoot) . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR . 'ga4-token.json';
}


function analytics_cached_token() {
    $path = analytics_token_cache_path();

    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return null;
    }

    $cached = json_decode((string)file_get_contents($path), true);

    if (!is_array($cached) || empty($cached['access_token']) || empty($cached['expires_at'])) {
        return null;
    }

    return (int)$cached['expires_at'] > time() + 60 ? (string)$cached['access_token'] : null;
}


function analytics_store_token($accessToken, $expiresIn) {
    $path = analytics_token_cache_path();

    if ($path === '') {
        return;
    }

    $directory = dirname($path);

    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }

    if (is_dir($directory) && is_writable($directory)) {
        @file_put_contents($path, json_encode([
            'access_token' => $accessToken,
            'expires_at'   => time() + max(60, (int)$expiresIn),
        ]));
    }
}


function analytics_access_token($serviceAccount) {
    if (!function_exists('curl_init') || !function_exists('openssl_sign')) {
        return null;
    }

    $cached = analytics_cached_token();

    if ($cached !== null) {
        return $cached;
    }

    $issuedAt = time();

    $signingInput = analytics_base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']))
        . '.' . analytics_base64url_encode(json_encode([
            'iss'   => $serviceAccount['client_email'],
            'scope' => ANALYTICS_SCOPE,
            'aud'   => $serviceAccount['token_uri'],
            'iat'   => $issuedAt,
            'exp'   => $issuedAt + 3600,
        ], JSON_UNESCAPED_SLASHES));

    $signature = '';

    if (!openssl_sign($signingInput, $signature, $serviceAccount['private_key'], OPENSSL_ALGO_SHA256)) {
        return null;
    }

    $assertion = $signingInput . '.' . analytics_base64url_encode($signature);

    $ch = curl_init($serviceAccount['token_uri']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $assertion,
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, ANALYTICS_TIMEOUT_SECONDS);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, ANALYTICS_TIMEOUT_SECONDS);

    $responseBody = curl_exec($ch);
    $curlErrorNumber = curl_errno($ch);

    if ($curlErrorNumber !== 0 || $responseBody === false) {
        return null;
    }

    $decoded = json_decode($responseBody, true);

    if (!is_array($decoded) || empty($decoded['access_token'])) {
        return null;
    }

    analytics_store_token($decoded['access_token'], $decoded['expires_in'] ?? 3600);

    return $decoded['access_token'];
}


const ANALYTICS_REPORT_CACHE_SECONDS = 1200;

const ANALYTICS_TOTAL_METRICS = [
    'activeUsers'            => 'Active users',
    'newUsers'               => 'New users',
    'sessions'               => 'Sessions',
    'screenPageViews'        => 'Page views',
    'averageSessionDuration' => 'Avg. session (sec)',
    'bounceRate'             => 'Bounce rate (%)',
];


function analytics_report_requests() {
    $metrics = [];

    foreach (array_keys(ANALYTICS_TOTAL_METRICS) as $name) {
        $metrics[] = ['name' => $name];
    }

    return [
        'totals' => [
            'dateRanges' => [
                ['startDate' => '7daysAgo',  'endDate' => 'today', 'name' => 'last7'],
                ['startDate' => '28daysAgo', 'endDate' => 'today', 'name' => 'last28'],
            ],
            'metrics' => $metrics,
        ],
        'usersOverTime' => [
            'dateRanges' => [['startDate' => '27daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'date']],
            'metrics'    => [['name' => 'activeUsers']],
            'orderBys'   => [['dimension' => ['dimensionName' => 'date'], 'desc' => false]],
            'limit'      => 40,
        ],
        'topPages' => [
            'dateRanges' => [['startDate' => '28daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'pagePath']],
            'metrics'    => [['name' => 'screenPageViews']],
            'orderBys'   => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
            'limit'      => 10,
        ],
        'sources' => [
            'dateRanges' => [['startDate' => '28daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'sessionDefaultChannelGroup']],
            'metrics'    => [['name' => 'sessions']],
            'orderBys'   => [['metric' => ['metricName' => 'sessions'], 'desc' => true]],
            'limit'      => 8,
        ],
        'countries' => [
            'dateRanges' => [['startDate' => '28daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'country']],
            'metrics'    => [['name' => 'activeUsers']],
            'orderBys'   => [['metric' => ['metricName' => 'activeUsers'], 'desc' => true]],
            'limit'      => 8,
        ],
        'devices' => [
            'dateRanges' => [['startDate' => '28daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'deviceCategory']],
            'metrics'    => [['name' => 'activeUsers']],
            'orderBys'   => [['metric' => ['metricName' => 'activeUsers'], 'desc' => true]],
            'limit'      => 8,
        ],
    ];
}


function analytics_post_json($url, $accessToken, $payload) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, ANALYTICS_TIMEOUT_SECONDS);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, ANALYTICS_TIMEOUT_SECONDS);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $accessToken,
        'Content-Type: application/json',
    ]);

    $responseBody = curl_exec($ch);
    $curlErrorNumber = curl_errno($ch);

    if ($curlErrorNumber !== 0 || $responseBody === false) {
        return ['ok' => false, 'message' => 'Google Analytics could not be reached (curl error ' . $curlErrorNumber . ').'];
    }

    $decoded = json_decode($responseBody, true);

    if (!is_array($decoded)) {
        return ['ok' => false, 'message' => 'Google Analytics returned a response that could not be read.'];
    }

    if (isset($decoded['error'])) {
        return ['ok' => false, 'message' => 'Google Analytics refused the request: ' . ($decoded['error']['message'] ?? 'no reason given')];
    }

    return ['ok' => true, 'body' => $decoded];
}


function analytics_run_reports($propertyId, $accessToken) {
    $requests = analytics_report_requests();
    $names = array_keys($requests);
    $reports = [];
    $url = ANALYTICS_REPORT_URL . rawurlencode($propertyId) . ':batchRunReports';

    foreach (array_chunk($names, 5) as $chunk) {
        $batch = [];

        foreach ($chunk as $name) {
            $batch[] = $requests[$name];
        }

        $result = analytics_post_json($url, $accessToken, ['requests' => $batch]);

        if (!$result['ok']) {
            return $result;
        }

        $returned = $result['body']['reports'] ?? [];

        foreach ($chunk as $index => $name) {
            $reports[$name] = $returned[$index] ?? [];
        }
    }

    return ['ok' => true, 'reports' => $reports];
}


function analytics_report_cache_path($propertyId) {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $docRoot === '' ? '' : dirname($docRoot) . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR . 'ga4-reports-' . preg_replace('/[^0-9A-Za-z]/', '', $propertyId) . '.json';
}


function analytics_cached_reports($propertyId) {
    $path = analytics_report_cache_path($propertyId);

    if ($path === '' || !is_file($path) || !is_readable($path)) {
        return null;
    }

    $cached = json_decode((string)file_get_contents($path), true);

    if (!is_array($cached) || empty($cached['savedAt']) || !isset($cached['reports'])) {
        return null;
    }

    $age = time() - (int)$cached['savedAt'];

    return $age <= ANALYTICS_REPORT_CACHE_SECONDS
        ? ['reports' => $cached['reports'], 'savedAt' => (int)$cached['savedAt'], 'age' => $age]
        : null;
}


function analytics_store_reports($propertyId, $reports) {
    $path = analytics_report_cache_path($propertyId);

    if ($path === '') {
        return;
    }

    $directory = dirname($path);

    if (!is_dir($directory)) {
        @mkdir($directory, 0775, true);
    }

    if (is_dir($directory) && is_writable($directory)) {
        @file_put_contents($path, json_encode(['savedAt' => time(), 'reports' => $reports]));
    }
}


function analytics_metric_value($report, $rowIndex, $metricIndex) {
    return $report['rows'][$rowIndex]['metricValues'][$metricIndex]['value'] ?? null;
}


function analytics_format_metric($metricName, $rawValue) {
    if ($rawValue === null || $rawValue === '') {
        return '0';
    }

    if ($metricName === 'bounceRate') {
        return number_format((float)$rawValue * 100, 1);
    }

    return number_format((float)$rawValue, 0);
}


function analytics_totals($report) {
    $byRange = [];

    foreach ($report['rows'] ?? [] as $index => $row) {
        $rangeName = $row['dimensionValues'][0]['value'] ?? ('date_range_' . $index);
        $byRange[$rangeName] = $row['metricValues'] ?? [];
    }

    $keys = array_keys($byRange);
    $seven = $byRange['last7'] ?? $byRange['date_range_0'] ?? ($keys === [] ? [] : $byRange[$keys[0]]);
    $twentyEight = $byRange['last28'] ?? $byRange['date_range_1'] ?? (count($keys) < 2 ? [] : $byRange[$keys[1]]);

    $totals = [];
    $index = 0;

    foreach (ANALYTICS_TOTAL_METRICS as $metricName => $label) {
        $totals[] = [
            'key'    => $metricName,
            'label'  => $label,
            'last7'  => analytics_format_metric($metricName, $seven[$index]['value'] ?? null),
            'last28' => analytics_format_metric($metricName, $twentyEight[$index]['value'] ?? null),
        ];

        $index++;
    }

    return $totals;
}


function analytics_series($report) {
    $points = [];

    foreach ($report['rows'] ?? [] as $row) {
        $raw = (string)($row['dimensionValues'][0]['value'] ?? '');

        if (!preg_match('/^\d{8}$/', $raw)) {
            continue;
        }

        $points[] = [
            'date'  => substr($raw, 0, 4) . '-' . substr($raw, 4, 2) . '-' . substr($raw, 6, 2),
            'value' => (int)round((float)($row['metricValues'][0]['value'] ?? 0)),
        ];
    }

    return $points;
}


function analytics_ranking($report) {
    $rows = [];

    foreach ($report['rows'] ?? [] as $row) {
        $label = trim((string)($row['dimensionValues'][0]['value'] ?? ''));

        $rows[] = [
            'label' => $label === '' ? '(not set)' : $label,
            'value' => (int)round((float)($row['metricValues'][0]['value'] ?? 0)),
        ];
    }

    return $rows;
}


function analytics_website_section($conn) {
    $settings = analytics_settings($conn);

    if ($settings['property_id'] === '') {
        return ['configured' => false, 'code' => 503, 'message' => 'Set GA4_PROPERTY_ID in Global Settings to the numeric property id from GA4 Admin, then reload.'];
    }

    $cached = analytics_cached_reports($settings['property_id']);
    $reports = $cached === null ? null : $cached['reports'];
    $savedAt = $cached === null ? time() : $cached['savedAt'];

    if ($reports === null) {
        $serviceAccount = analytics_service_account($settings['service_account_file']);

        if ($serviceAccount === null) {
            return ['configured' => false, 'code' => 503, 'message' => 'The service account file named in GA4_SERVICE_ACCOUNT_FILE is missing from the configs directory or is not a valid key file.'];
        }

        $accessToken = analytics_access_token($serviceAccount);

        if ($accessToken === null) {
            return ['configured' => false, 'code' => 502, 'message' => 'Google refused to issue an access token for ' . $serviceAccount['client_email'] . '. Check that the Analytics Data API is enabled for the project.'];
        }

        $result = analytics_run_reports($settings['property_id'], $accessToken);

        if (!$result['ok']) {
            return ['configured' => false, 'code' => 502, 'message' => $result['message'] . ' Make sure ' . $serviceAccount['client_email'] . ' is a Viewer on the property.'];
        }

        $reports = $result['reports'];
        $savedAt = time();

        analytics_store_reports($settings['property_id'], $reports);
    }

    return [
        'configured'      => true,
        'reportingWindow' => 'Last 28 days, ending ' . date('j M Y'),
        'generatedAt'     => date('c', $savedAt),
        'cacheAgeSeconds' => max(0, time() - $savedAt),
        'totals'          => analytics_totals($reports['totals'] ?? []),
        'usersOverTime'   => analytics_series($reports['usersOverTime'] ?? []),
        'rankings'        => [
            ['key' => 'topPages',  'label' => 'Top pages',        'unit' => 'page views', 'rows' => analytics_ranking($reports['topPages'] ?? [])],
            ['key' => 'sources',   'label' => 'Traffic sources',  'unit' => 'sessions',   'rows' => analytics_ranking($reports['sources'] ?? [])],
            ['key' => 'countries', 'label' => 'Countries',        'unit' => 'users',      'rows' => analytics_ranking($reports['countries'] ?? [])],
            ['key' => 'devices',   'label' => 'Devices',          'unit' => 'users',      'rows' => analytics_ranking($reports['devices'] ?? [])],
        ],
    ];
}


function analytics_chat_bot_rows($conn) {
    $rows = [];

    $sessionsTable = $conn->query("SHOW TABLES LIKE 'chat_bot_user_sessions'");

    if (!$sessionsTable || $sessionsTable->num_rows === 0) {
        return $rows;
    }

    $totals = $conn->query("SELECT COUNT(*) AS total, SUM(last_message_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) AS last_day, SUM(last_message_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS last_week FROM chat_bot_user_sessions");

    if ($totals && $row = $totals->fetch_assoc()) {
        $rows[] = ['Sessions held by the cron', 'All', (string)(int)$row['total']];
        $rows[] = ['Sessions active in the last 24 hours', 'All', (string)(int)$row['last_day']];
        $rows[] = ['Sessions active in the last 7 days', 'All', (string)(int)$row['last_week']];
    }

    $byChannel = $conn->query("SELECT channel, COUNT(*) AS total FROM chat_bot_user_sessions GROUP BY channel ORDER BY total DESC");

    while ($byChannel && $row = $byChannel->fetch_assoc()) {
        $rows[] = ['Sessions by channel', (string)$row['channel'], (string)(int)$row['total']];
    }

    $byLanguage = $conn->query("SELECT COALESCE(language, 'not set') AS language, COUNT(*) AS total FROM chat_bot_user_sessions GROUP BY language ORDER BY total DESC");

    while ($byLanguage && $row = $byLanguage->fetch_assoc()) {
        $rows[] = ['Sessions by language', (string)$row['language'], (string)(int)$row['total']];
    }

    $byState = $conn->query("SELECT COALESCE(state, 'not set') AS state, COUNT(*) AS total FROM chat_bot_user_sessions GROUP BY state ORDER BY total DESC");

    while ($byState && $row = $byState->fetch_assoc()) {
        $rows[] = ['Sessions by state', (string)$row['state'], (string)(int)$row['total']];
    }

    $historyTable = $conn->query("SHOW TABLES LIKE 'chat_bot_user_chat_history'");

    if ($historyTable && $historyTable->num_rows > 0) {
        $messages = $conn->query("SELECT role, COUNT(*) AS total FROM chat_bot_user_chat_history GROUP BY role ORDER BY total DESC");

        while ($messages && $row = $messages->fetch_assoc()) {
            $rows[] = ['Messages held by the cron', (string)$row['role'], (string)(int)$row['total']];
        }
    }

    return $rows;
}


function analytics_chat_bot_window($conn) {
    $bounds = [];
    $sources = [['chat_bot_user_sessions', 'updated_at']];
    $historyTable = $conn->query("SHOW TABLES LIKE 'chat_bot_user_chat_history'");

    if ($historyTable && $historyTable->num_rows > 0) {
        $sources[] = ['chat_bot_user_chat_history', 'created_at'];
    }

    foreach ($sources as $source) {
        $result = $conn->query("SELECT MIN({$source[1]}) AS earliest, MAX({$source[1]}) AS latest FROM {$source[0]}");
        $row = $result ? $result->fetch_assoc() : null;

        if ($row && $row['earliest'] !== null) {
            $bounds[] = $row;
        }
    }

    if ($bounds === []) {
        return 'No activity currently retained';
    }

    $offset = $conn->query("SELECT TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) AS drift");
    $offsetRow = $offset ? $offset->fetch_assoc() : null;
    $drift = $offsetRow ? (int)$offsetRow['drift'] : 0;

    $earliest = min(array_column($bounds, 'earliest'));
    $latest = max(array_column($bounds, 'latest'));
    $displayZone = new DateTimeZone(ANALYTICS_DISPLAY_TIME_ZONE);

    $toDisplay = function ($stored) use ($drift, $displayZone) {
        $moment = new DateTime($stored, new DateTimeZone('UTC'));
        $moment->modify($drift . ' seconds');
        $moment->setTimezone($displayZone);

        return $moment;
    };

    $from = $toDisplay($earliest);
    $to = $toDisplay($latest);

    if ($from->format('Y-m-d') === $to->format('Y-m-d')) {
        return 'Activity on ' . $to->format('j M Y');
    }

    return $from->format('j M Y') . ' to ' . $to->format('j M Y');
}


function analytics_chat_bot_section($conn) {
    return array_merge([['Figure', 'Breakdown', 'Count']], analytics_chat_bot_rows($conn));
}
