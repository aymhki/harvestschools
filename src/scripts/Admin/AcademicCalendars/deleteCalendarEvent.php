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
        echo json_encode(calendar_error("Missing the event to delete."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT c.calendar_key, c.academic_year, e.title_en, e.title_ar, e.start_date, e.end_date
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

    $calendarId = calendar_id_for_event($conn, $eventId);

    $stmt = $conn->prepare("DELETE FROM academic_calendar_events WHERE id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $stmt->close();

    calendar_resequence_events($conn, $calendarId);

    admin_log_action($conn, 'Deleted calendar event #' . $eventId . ' ("' . (string)$owner['title_en'] . '", ' . (string)$owner['start_date'] . ' to ' . (string)$owner['end_date'] . ') from the ' . (string)$owner['academic_year'] . ' "' . (string)$owner['calendar_key'] . '" academic calendar.');
    echo json_encode([
        "success" => true,
        "message" => "Event deleted.",
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
