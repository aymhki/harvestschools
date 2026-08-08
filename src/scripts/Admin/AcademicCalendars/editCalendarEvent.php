<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/academicCalendarHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $authorisation = calendar_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $eventId = (int)($data['event_id'] ?? 0);

    if ($eventId <= 0) {
        echo json_encode(calendar_error("Missing the event to edit."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT c.calendar_key
         FROM academic_calendar_events e
         JOIN academic_calendars c ON c.id = e.calendar_id
         WHERE e.id = ?"
    );
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $owner = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$owner) {
        echo json_encode(calendar_error("That event no longer exists.", 404));
        exit;
    }

    if (!calendar_may_edit($authorisation, $owner['calendar_key'])) {
        echo json_encode(calendar_error("Permission denied", 403));
        exit;
    }

    $validation = calendar_validate_event($data, 1);

    if (!$validation['success']) {
        echo json_encode($validation);
        exit;
    }

    $event = $validation['event'];

    $stmt = $conn->prepare(
        "UPDATE academic_calendar_events
         SET title_en = ?, title_ar = ?, start_date = ?, end_date = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ssssi", $event['title_en'], $event['title_ar'], $event['start_date'], $event['end_date'], $eventId);
    $stmt->execute();
    $stmt->close();

    calendar_resequence_events($conn, calendar_id_for_event($conn, $eventId));

    echo json_encode([
        "success" => true,
        "message" => "Event updated.",
        "code"    => 200
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
