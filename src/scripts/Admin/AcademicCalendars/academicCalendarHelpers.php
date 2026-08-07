<?php

require_once __DIR__ . '/../../Public/Calendars/academicCalendars.php';
require_once __DIR__ . '/../../Public/Calendars/publicCalendarHelpers.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicSchoolInfoHelpers.php';

const CALENDAR_MAX_NOTE_LENGTH = 2000;
const CALENDAR_MAX_EVENTS_PER_YEAR = 300;
const CALENDAR_PDF_MAX_BYTES = 20 * 1024 * 1024;
const CALENDAR_PDF_DIRECTORY = 'documents/Calendars';

function calendar_error($message, $code = 400) {
    return ["success" => false, "message" => $message, "code" => $code];
}

function calendar_trim($value, $limit) {
    return mb_substr(trim((string)($value ?? '')), 0, $limit);
}

function calendar_valid_date($value) {
    $date = calendar_trim($value, 10);

    if ($date === '') {
        return null;
    }

    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    return ($parsed && $parsed->format('Y-m-d') === $date) ? $date : null;
}

function calendar_permission_levels($conn) {
    $sessionId = get_bearer_token_hash();

    if (!$sessionId) {
        return [];
    }

    $stmt = $conn->prepare(
        "SELECT p.permission_level_id
         FROM admin_sessions s
         JOIN admin_users_permissions_linker p ON p.admin_user_id = s.user_id
         WHERE s.id = ?"
    );

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $levels = [];

    while ($row = $result->fetch_assoc()) {
        $levels[] = (string)$row['permission_level_id'];
    }

    return $levels;
}

function calendar_authorise($conn) {
    global $JACK_OF_ALL_TRADES;

    $sessionCheck = validate_admin_session($conn);

    if (!$sessionCheck['success']) {
        return $sessionCheck;
    }

    $levels = calendar_permission_levels($conn);
    $allowed = academic_calendars_for_permissions($levels);

    if ($allowed === []) {
        return calendar_error("Permission denied", 403);
    }

    return [
        "success"  => true,
        "code"     => 200,
        "levels"   => $levels,
        "calendars" => $allowed,
        "isMaster" => in_array(ACADEMIC_CALENDARS_MASTER_PERMISSION, $levels, true)
                      || in_array((string)$JACK_OF_ALL_TRADES, $levels, true),
    ];
}

function calendar_may_edit($authorisation, $calendarKey) {
    return in_array($calendarKey, $authorisation['calendars'] ?? [], true);
}

function calendar_available_from_conflict($conn, $calendarKey, $availableFrom, $ignoreCalendarId = 0) {
    $current = public_calendar_current($conn, $calendarKey);

    if ($current === null || (int)$current['id'] === (int)$ignoreCalendarId) {
        return null;
    }

    $stmt = $conn->prepare("SELECT MAX(end_date) AS last_day FROM academic_calendar_events WHERE calendar_id = ?");
    $stmt->bind_param("i", $current['id']);
    $stmt->execute();
    $lastDay = $stmt->get_result()->fetch_assoc()['last_day'] ?? null;
    $stmt->close();

    if ($lastDay === null) {
        return null;
    }

    if (strtotime($availableFrom) <= strtotime($lastDay)) {
        return "The date this calendar starts showing must be after " . $lastDay
             . ", the last day of the " . $current['academic_year'] . " calendar it replaces.";
    }

    return null;
}

function calendar_validate_event($event, $position) {
    $titleEn = calendar_trim($event['title_en'] ?? '', 255);
    $titleAr = calendar_trim($event['title_ar'] ?? '', 255);

    if ($titleEn === '' || $titleAr === '') {
        return calendar_error("Event " . $position . " needs a title in both English and Arabic.");
    }

    $startDate = calendar_valid_date($event['start_date'] ?? '');

    if ($startDate === null) {
        return calendar_error("Event " . $position . " needs a valid start date.");
    }

    $endDate = calendar_valid_date($event['end_date'] ?? '') ?? $startDate;

    if (strtotime($endDate) < strtotime($startDate)) {
        return calendar_error("Event " . $position . " ends before it starts.");
    }

    return [
        "success" => true,
        "event"   => [
            'title_en'   => $titleEn,
            'title_ar'   => $titleAr,
            'start_date' => $startDate,
            'end_date'   => $endDate,
        ]
    ];
}

function calendar_resequence_events($conn, $calendarId) {
    $stmt = $conn->prepare(
        "SELECT id FROM academic_calendar_events
         WHERE calendar_id = ?
         ORDER BY start_date ASC, end_date ASC, id ASC"
    );
    $stmt->bind_param("i", $calendarId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $ids = [];

    while ($row = $result->fetch_assoc()) {
        $ids[] = (int)$row['id'];
    }

    $stmt = $conn->prepare("UPDATE academic_calendar_events SET sort_order = ? WHERE id = ?");

    foreach ($ids as $position => $eventId) {
        $sortOrder = $position + 1;
        $stmt->bind_param("ii", $sortOrder, $eventId);
        $stmt->execute();
    }

    $stmt->close();
}

function calendar_id_for_event($conn, $eventId) {
    $stmt = $conn->prepare("SELECT calendar_id FROM academic_calendar_events WHERE id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ? (int)$row['calendar_id'] : 0;
}

function calendar_store_pdf($file, $docRoot, $calendarKey, $academicYear) {
    if (!isset($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return calendar_error("The calendar PDF could not be uploaded.");
    }

    if ($file['size'] > CALENDAR_PDF_MAX_BYTES) {
        return calendar_error("The calendar PDF must be 20 MB or smaller.");
    }

    $mimeType = function_exists('finfo_open')
        ? finfo_file(finfo_open(FILEINFO_MIME_TYPE), $file['tmp_name'])
        : mime_content_type($file['tmp_name']);

    if ($mimeType !== 'application/pdf') {
        return calendar_error("Only PDF files are accepted for the calendar.");
    }

    $assetsBase = dirname(rtrim($docRoot, '/\\')) . DIRECTORY_SEPARATOR . 'assets';
    $directory = $assetsBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, CALENDAR_PDF_DIRECTORY);

    if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
        return calendar_error("The calendar folder could not be created on the server.", 500);
    }

    $fileName = $calendarKey . '_' . str_replace('/', '_', $academicYear) . '.pdf';
    $target = $directory . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        return calendar_error("The calendar PDF could not be saved.", 500);
    }

    @chmod($target, 0644);

    return ["success" => true, "path" => '/' . CALENDAR_PDF_DIRECTORY . '/' . $fileName];
}

function calendar_refresh_assistant_knowledge($conn, $docRoot) {
    try {
        public_school_write_artifacts($conn, $docRoot);

        return null;
    } catch (Throwable $e) {
        return ' The calendar pages are updated, but the Siri and Gemini knowledge files could not be '
            . 'refreshed: ' . $e->getMessage();
    }
}
