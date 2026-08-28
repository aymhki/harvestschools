<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/academicCalendarHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();


try {
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

    $data = isset($_POST['payload'])
        ? (json_decode((string)$_POST['payload'], true) ?? [])
        : (json_decode((string)file_get_contents('php://input'), true) ?? []);

    $calendarKey = calendar_trim($data['calendar_key'] ?? '', 32);

    if (!academic_calendar_exists($calendarKey) || !calendar_may_edit($authorisation, $calendarKey)) {
        echo json_encode(calendar_error("Permission denied", 403));
        exit;
    }

    $academicYear = academic_calendar_normalise_year($data['academic_year'] ?? '');

    if ($academicYear === null) {
        echo json_encode(calendar_error(
            "Enter the academic year as this year/next year, for example 2026/2027, and no more than "
            . ACADEMIC_CALENDAR_MAX_YEARS_AHEAD . " years ahead."
        ));
        exit;
    }

    $availableFrom = calendar_valid_date($data['available_from'] ?? '');

    if ($availableFrom === null) {
        echo json_encode(calendar_error("Choose the date this calendar starts showing on the website."));
        exit;
    }

    $conflict = calendar_available_from_conflict($conn, $calendarKey, $availableFrom);

    if ($conflict !== null) {
        echo json_encode(calendar_error($conflict));
        exit;
    }

    $rawEvents = is_array($data['events'] ?? null) ? $data['events'] : [];

    if (count($rawEvents) > CALENDAR_MAX_EVENTS_PER_YEAR) {
        echo json_encode(calendar_error("A calendar may hold at most " . CALENDAR_MAX_EVENTS_PER_YEAR . " events."));
        exit;
    }

    $events = [];

    foreach ($rawEvents as $index => $rawEvent) {
        $validation = calendar_validate_event($rawEvent, $index + 1);

        if (!$validation['success']) {
            echo json_encode($validation);
            exit;
        }

        $events[] = $validation['event'];
    }

    $noteEn = calendar_trim($data['note_en'] ?? '', CALENDAR_MAX_NOTE_LENGTH);
    $noteAr = calendar_trim($data['note_ar'] ?? '', CALENDAR_MAX_NOTE_LENGTH);

    $pdfPath = '';

    if (isset($_FILES['calendar_pdf']) && ($_FILES['calendar_pdf']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $stored = calendar_store_pdf($_FILES['calendar_pdf'], $doc_root, $calendarKey, $academicYear);

        if (!$stored['success']) {
            echo json_encode($stored);
            exit;
        }

        $pdfPath = $stored['path'];
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare(
        "INSERT INTO academic_calendars (calendar_key, academic_year, available_from, note_en, note_ar, pdf_path)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssssss", $calendarKey, $academicYear, $availableFrom, $noteEn, $noteAr, $pdfPath);

    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $insertError) {
        $stmt->close();
        $conn->rollback();

        if ($conn->errno === 1062) {
            echo json_encode(calendar_error("That department already has a calendar for " . $academicYear . "."));
            exit;
        }

        throw $insertError;
    }

    $calendarId = $conn->insert_id;
    $stmt->close();

    $stmt = $conn->prepare(
        "INSERT INTO academic_calendar_events (calendar_id, sort_order, title_en, title_ar, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    foreach ($events as $position => $event) {
        $sortOrder = $position + 1;
        $stmt->bind_param("iissss", $calendarId, $sortOrder, $event['title_en'], $event['title_ar'], $event['start_date'], $event['end_date']);
        $stmt->execute();
    }

    $stmt->close();

    calendar_resequence_events($conn, $calendarId);

    $conn->commit();

    admin_log_action($conn, 'Created the ' . $academicYear . ' "' . $calendarKey . '" academic calendar — Available from: ' . admin_action_value($availableFrom) . '; Note (EN): ' . admin_action_value($noteEn) . '; Note (AR): ' . admin_action_value($noteAr) . '; ' . count($events) . ' event' . (count($events) === 1 ? '' : 's') . ' (' . admin_list_summary(array_map(fn($event) => $event['title_en'] . ' ' . $event['start_date'] . ' to ' . $event['end_date'], $events)) . ').');
    echo json_encode([
        "success"      => true,
        "message"      => count($events) === 0
            ? "Academic calendar created. You can add or import its events now."
            : "Academic calendar created with " . count($events) . " event" . (count($events) === 1 ? "" : "s") . ".",
        "code"         => 200,
        "calendarKey"  => $calendarKey,
        "academicYear" => $academicYear
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        $conn->rollback();
    }

    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
