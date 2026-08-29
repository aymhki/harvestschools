<?php

require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../Parents/EventBookings/EventCeremonyHelpers.php';
require_once '../authHelpers.php';

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

set_cors_headers();

const CEREMONY_HOUR_LABEL = 'Ceremony Hour';
const CEREMONY_MINUTE_LABEL = 'Ceremony Minute';
const CEREMONY_MERIDIEM_LABEL = 'Ceremony Meridiem';
const CEREMONY_DATE_LABEL = 'Ceremony Date';
const CEREMONY_LOCATION_LABEL = 'Ceremony Location';
const CEREMONY_TIME_ZONE_LABEL = 'Ceremony Time Zone';

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

    $formData = [];

    foreach ($_POST as $key => $value) {
        if (strpos($key, 'field_') === 0) {
            $labelKey = 'label_' . substr($key, 6);

            if (isset($_POST[$labelKey])) {
                $formData[$_POST[$labelKey]] = trim((string)$value);
            }
        }
    }

    $metaBefore = event_meta_details($conn);
    $ceremonyDate = $formData[CEREMONY_DATE_LABEL] ?? '';
    $hour = $formData[CEREMONY_HOUR_LABEL] ?? '';
    $minute = $formData[CEREMONY_MINUTE_LABEL] ?? '';
    $meridiem = strtoupper($formData[CEREMONY_MERIDIEM_LABEL] ?? '');
    $locationLabel = $formData[CEREMONY_LOCATION_LABEL] ?? '';
    $timeZone = $formData[CEREMONY_TIME_ZONE_LABEL] ?? '';

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $ceremonyDate)) {
        echo json_encode(['success' => false, 'message' => 'A valid ceremony date is required', 'code' => 400]);
        exit;
    }

    if (!ctype_digit($hour) || (int)$hour < 1 || (int)$hour > 12
        || !ctype_digit($minute) || (int)$minute < 0 || (int)$minute > 59
        || !in_array($meridiem, ['AM', 'PM'], true)) {
        echo json_encode(['success' => false, 'message' => 'A valid ceremony time is required', 'code' => 400]);
        exit;
    }

    if ($locationLabel === '') {
        echo json_encode(['success' => false, 'message' => 'A ceremony location is required', 'code' => 400]);
        exit;
    }

    if (!event_meta_is_valid_time_zone($timeZone)) {
        echo json_encode(['success' => false, 'message' => 'A valid ceremony time zone is required', 'code' => 400]);
        exit;
    }

    $hourOfDay = (int)$hour % 12;

    if ($meridiem === 'PM') {
        $hourOfDay += 12;
    }

    $ceremonyTime = sprintf('%02d:%02d:00', $hourOfDay, (int)$minute);


    $placeDetails = json_decode($_POST['selectedPlace'] ?? '', true);

    $locationName = is_array($placeDetails) && !empty($placeDetails['name'])
        ? (string)$placeDetails['name']
        : $locationLabel;

    $locationAddress = is_array($placeDetails) && !empty($placeDetails['address'])
        ? (string)$placeDetails['address']
        : null;

    $placeId = is_array($placeDetails) && !empty($placeDetails['placeId']) ? (string)$placeDetails['placeId'] : null;
    $latitude = is_array($placeDetails) && isset($placeDetails['latitude']) ? (float)$placeDetails['latitude'] : null;
    $longitude = is_array($placeDetails) && isset($placeDetails['longitude']) ? (float)$placeDetails['longitude'] : null;

    $adminUserId = null;

    $sessionStmt = $conn->prepare("SELECT user_id FROM admin_sessions WHERE id = ?");
    $sessionStmt->bind_param("s", $authStatus['session_id']);
    $sessionStmt->execute();
    $sessionRow = $sessionStmt->get_result()->fetch_assoc();
    $sessionStmt->close();

    if ($sessionRow) {
        $adminUserId = (int)$sessionRow['user_id'];
    }

    $stmt = $conn->prepare(
        "INSERT INTO event_meta_details
            (id, ceremony_date, ceremony_time, time_zone, location_name, location_address,
             location_place_id, location_latitude, location_longitude, updated_by_admin_id)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            ceremony_date = VALUES(ceremony_date),
            ceremony_time = VALUES(ceremony_time),
            time_zone = VALUES(time_zone),
            location_name = VALUES(location_name),
            location_address = VALUES(location_address),
            location_place_id = VALUES(location_place_id),
            location_latitude = VALUES(location_latitude),
            location_longitude = VALUES(location_longitude),
            updated_by_admin_id = VALUES(updated_by_admin_id)"
    );

    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error, 'code' => 500]);
        exit;
    }

    $stmt->bind_param(
        "ssssssddi",
        $ceremonyDate,
        $ceremonyTime,
        $timeZone,
        $locationName,
        $locationAddress,
        $placeId,
        $latitude,
        $longitude,
        $adminUserId
    );

    if (!$stmt->execute()) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'Could not save the ceremony details', 'code' => 500]);
        exit;
    }

    $stmt->close();

    admin_log_action($conn, 'Edited the event ceremony details: ' . admin_changes_summary(
        ['Date' => $metaBefore['ceremonyDate'] ?? null, 'Time' => $metaBefore['ceremonyTime'] ?? null, 'Time zone' => $metaBefore['timeZone'] ?? null, 'Location' => $metaBefore['locationName'] ?? null, 'Address' => $metaBefore['locationAddress'] ?? null],
        ['Date' => $ceremonyDate, 'Time' => $ceremonyTime, 'Time zone' => $timeZone, 'Location' => $locationName, 'Address' => $locationAddress]
    ) . '.', ADMIN_ACTION_CATEGORY_EVENT_BOOKINGS);
    echo json_encode([
        'success' => true,
        'message' => 'Ceremony details updated',
        'code'    => 200,
        'details' => event_meta_details($conn),
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'code' => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
