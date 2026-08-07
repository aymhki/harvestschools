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

    $calendarKey = calendar_trim($data['calendar_key'] ?? '', 32);
    $academicYear = calendar_trim($data['academic_year'] ?? '', 9);

    if (!academic_calendar_exists($calendarKey) || !calendar_may_edit($authorisation, $calendarKey)) {
        echo json_encode(calendar_error("Permission denied", 403));
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM academic_calendars WHERE calendar_key = ? AND academic_year = ?");
    $stmt->bind_param("ss", $calendarKey, $academicYear);
    $stmt->execute();
    $calendar = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$calendar) {
        echo json_encode(calendar_error("That academic calendar does not exist.", 404));
        exit;
    }

    $validation = calendar_validate_event($data, 1);

    if (!$validation['success']) {
        echo json_encode($validation);
        exit;
    }

    $event = $validation['event'];
    $calendarId = (int)$calendar['id'];

    $stmt = $conn->prepare(
        "INSERT INTO academic_calendar_events (calendar_id, sort_order, title_en, title_ar, start_date, end_date)
         VALUES (?, 0, ?, ?, ?, ?)"
    );
    $stmt->bind_param("issss", $calendarId, $event['title_en'], $event['title_ar'], $event['start_date'], $event['end_date']);
    $stmt->execute();
    $stmt->close();

    calendar_resequence_events($conn, $calendarId);

    $warning = calendar_refresh_assistant_knowledge($conn, $doc_root);

    echo json_encode([
        "success" => true,
        "message" => "Event added." . ($warning ?? ''),
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
