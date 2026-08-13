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

    $calendars = [];

    foreach ($authorisation['calendars'] as $calendarKey) {
        $stmt = $conn->prepare(
            "SELECT c.id, c.academic_year, c.available_from, c.note_en, c.note_ar, c.pdf_path,
                    DATE_FORMAT(c.updated_at, '%Y-%m-%d %H:%i') AS updated_label,
                    (c.available_from <= CURDATE()) AS is_available,
                    COUNT(e.id) AS event_count
             FROM academic_calendars c
             LEFT JOIN academic_calendar_events e ON e.calendar_id = c.id
             WHERE c.calendar_key = ?
             GROUP BY c.id, c.academic_year
             ORDER BY c.academic_year DESC"
        );

        $stmt->bind_param("s", $calendarKey);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $years = [];
        $liveYear = null;
        $current = public_calendar_current($conn, $calendarKey);

        if ($current !== null) {
            $liveYear = (string)$current['academic_year'];
        }

        while ($row = $result->fetch_assoc()) {
            $years[] = [
                "id"            => (int)$row['id'],
                "academicYear"  => (string)$row['academic_year'],
                "availableFrom" => (string)$row['available_from'],
                "isAvailable"   => (int)$row['is_available'] === 1,
                "isLive"        => $liveYear === (string)$row['academic_year'],
                "eventCount"    => (int)$row['event_count'],
                "hasPdf"        => (string)$row['pdf_path'] !== '',
                "noteEn"        => (string)($row['note_en'] ?? ''),
                "noteAr"        => (string)($row['note_ar'] ?? ''),
                "pdfPath"       => (string)$row['pdf_path'],
                "updatedAt"     => (string)$row['updated_label'],
            ];
        }

        $calendars[] = [
            "key"   => $calendarKey,
            "label" => academic_calendar_label($calendarKey),
            "path"  => academic_calendar_path($calendarKey),
            "years" => $years,
        ];
    }

    $requestedCalendar = calendar_trim($_GET['calendar'] ?? '', 32);
    $requestedYear = calendar_trim($_GET['year'] ?? '', 9);
    $events = null;

    if ($requestedCalendar !== '' && $requestedYear !== '') {
        if (!calendar_may_edit($authorisation, $requestedCalendar)) {
            echo json_encode(calendar_error("Permission denied", 403));
            exit;
        }

        $stmt = $conn->prepare("SELECT id FROM academic_calendars WHERE calendar_key = ? AND academic_year = ?");
        $stmt->bind_param("ss", $requestedCalendar, $requestedYear);
        $stmt->execute();
        $calendarRow = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$calendarRow) {
            echo json_encode(calendar_error("That academic calendar does not exist.", 404));
            exit;
        }

        $headers = ["ID", "Title (EN)", "Title (AR)", "Start Date", "End Date", "Last Updated", "Event ID"];
        $rows = [];

        $stmt = $conn->prepare(
            "SELECT id, sort_order, title_en, title_ar,
                    DATE_FORMAT(start_date, '%Y-%m-%d') AS start_raw,
                    DATE_FORMAT(end_date, '%Y-%m-%d') AS end_raw,
                    DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS updated_label
             FROM academic_calendar_events
             WHERE calendar_id = ?
             ORDER BY sort_order ASC"
        );

        $stmt->bind_param("i", $calendarRow['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                (string)$row['sort_order'],
                (string)$row['title_en'],
                (string)$row['title_ar'],
                (string)$row['start_raw'],
                (string)$row['end_raw'],
                (string)$row['updated_label'],
                (string)$row['id'],
            ];
        }

        $events = array_merge([$headers], $rows);
    }

    echo json_encode([
        "success"  => true,
        "message"  => "Data retrieved successfully",
        "code"     => 200,
        "data"     => [
            "calendars" => $calendars,
            "isMaster"  => $authorisation['isMaster'],
            "events"    => $events,
        ]
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
