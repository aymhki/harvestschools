<?php

require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../EventCeremonyHelpers.php';
require_once '../authHelpers.php';

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

set_cors_headers();

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const PLACES_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location';
const PLACES_MAX_RESULTS = 8;
const PLACES_TIMEOUT_SECONDS = 6;
const PLACES_MIN_QUERY_LENGTH = 3;

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed', 'code' => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error, 'code' => 500]);
        exit;
    }

    $conn->set_charset('utf8mb4');

    global $EVENT_BOOKING_MANAGEMENT;

    $authStatus = check_admin_user_permission($conn, $EVENT_BOOKING_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true);

    $query = is_array($payload) ? trim((string)($payload['query'] ?? '')) : '';

    if (mb_strlen($query) < PLACES_MIN_QUERY_LENGTH) {
        echo json_encode(['success' => true, 'code' => 200, 'places' => []]);
        exit;
    }

    $apiKey = ceremony_env_value('GOOGLE_MAPS_API_KEY');

    if (!$apiKey) {
        echo json_encode(['success' => false, 'message' => 'The places service is not configured', 'code' => 503]);
        exit;
    }

    $curl = curl_init(PLACES_SEARCH_URL);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => PLACES_TIMEOUT_SECONDS,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-Goog-Api-Key: ' . $apiKey,
            'X-Goog-FieldMask: ' . PLACES_FIELD_MASK,
        ],
        CURLOPT_POSTFIELDS     => json_encode([
            'textQuery'     => $query,
            'maxResultCount' => PLACES_MAX_RESULTS,
            'languageCode'  => 'en',
        ]),
    ]);

    $response = curl_exec($curl);
    $statusCode = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $decoded = $response ? json_decode($response, true) : null;

    if ($statusCode !== 200 || !is_array($decoded)) {
        echo json_encode(['success' => false, 'message' => 'The places lookup failed', 'code' => 502]);
        exit;
    }

    $places = [];

    foreach ($decoded['places'] ?? [] as $place) {
        $name = $place['displayName']['text'] ?? '';
        $address = $place['formattedAddress'] ?? '';

        if ($name !== '' || $address !== '') {
            $places[] = [
                'label'     => trim($name !== '' && $address !== '' ? $name . ' — ' . $address : $name . $address),
                'name'      => $name !== '' ? $name : $address,
                'address'   => $address,
                'placeId'   => $place['id'] ?? null,
                'latitude'  => $place['location']['latitude'] ?? null,
                'longitude' => $place['location']['longitude'] ?? null,
            ];
        }
    }

    echo json_encode(['success' => true, 'code' => 200, 'places' => $places]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'code' => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
