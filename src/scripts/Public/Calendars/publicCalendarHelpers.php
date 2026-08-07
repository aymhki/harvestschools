<?php

require_once __DIR__ . '/academicCalendars.php';


const PUBLIC_CALENDAR_SCHEMA_VERSION = 1;


function public_calendar_current($conn, $calendarKey) {
    $stmt = $conn->prepare(
        "SELECT id, calendar_key, academic_year, available_from, note_en, note_ar, pdf_path,
                UNIX_TIMESTAMP(updated_at) AS updated_at
         FROM academic_calendars
         WHERE calendar_key = ? AND available_from <= CURDATE()
         ORDER BY available_from DESC, academic_year DESC
         LIMIT 1"
    );

    $stmt->bind_param("s", $calendarKey);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

function public_calendar_events($conn, $calendarId, $language) {
    $isArabic = $language === 'ar';

    $stmt = $conn->prepare(
        "SELECT id, sort_order, title_en, title_ar,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_raw,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_raw,
                UNIX_TIMESTAMP(updated_at) AS updated_at
         FROM academic_calendar_events
         WHERE calendar_id = ?
         ORDER BY sort_order ASC, start_date ASC"
    );

    $stmt->bind_param("i", $calendarId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $events = [];
    $lastUpdated = 0;

    while ($row = $result->fetch_assoc()) {
        $lastUpdated = max($lastUpdated, (int)$row['updated_at']);

        $events[] = [
            'id'         => (int)$row['id'],
            'sortOrder'  => (int)$row['sort_order'],
            'title'      => (string)($isArabic ? $row['title_ar'] : $row['title_en']),
            'startDate'  => (string)$row['start_raw'],
            'endDate'    => (string)$row['end_raw'],
            'isMultiDay' => $row['start_raw'] !== $row['end_raw'],
        ];
    }

    return ['events' => $events, 'lastUpdated' => $lastUpdated];
}

/**
 * The shape the six public calendar pages consume.
 */
function public_calendar_document($conn, $calendarKey, $language) {
    $calendar = public_calendar_current($conn, $calendarKey);

    $document = [
        'schemaVersion' => PUBLIC_CALENDAR_SCHEMA_VERSION,
        'language'      => $language,
        'calendar'      => [
            'key'       => $calendarKey,
            'label'     => academic_calendar_label($calendarKey, $language),
            'routePath' => academic_calendar_path($calendarKey),
        ],
        'academicYear'  => null,
        'note'          => '',
        'pdfPath'       => '',
        'events'        => [],
        'lastUpdated'   => 0,
    ];

    if ($calendar !== null) {
        $events = public_calendar_events($conn, (int)$calendar['id'], $language);

        $document['academicYear'] = (string)$calendar['academic_year'];
        $document['note'] = (string)(($language === 'ar' ? $calendar['note_ar'] : $calendar['note_en']) ?? '');
        $document['pdfPath'] = (string)$calendar['pdf_path'];
        $document['events'] = $events['events'];
        $document['lastUpdated'] = max((int)$calendar['updated_at'], $events['lastUpdated']);
    }

    $document['contentHash'] = hash('sha256', json_encode($document, JSON_UNESCAPED_UNICODE));

    return $document;
}

/**
 * Every published event across all six calendars, in the shape the knowledge
 * artifact has always used, so the MCP tools, Siri entities and Android app
 * functions keep working unchanged.
 */
function public_calendar_all_events($conn, $language) {
    $events = [];

    foreach (academic_calendar_keys() as $calendarKey) {
        $calendar = public_calendar_current($conn, $calendarKey);

        if ($calendar === null) {
            continue;
        }

        $calendarEvents = public_calendar_events($conn, (int)$calendar['id'], $language);
        $label = academic_calendar_label($calendarKey, $language);
        $path = academic_calendar_path($calendarKey);

        foreach ($calendarEvents['events'] as $event) {
            $startTimestamp = strtotime($event['startDate'] . ' 00:00:00 UTC');
            $endTimestamp = strtotime($event['endDate'] . ' 00:00:00 UTC');

            $events[] = [
                'id'            => 'event.' . $calendarKey . '.' . $event['startDate'] . '.'
                                   . substr(hash('sha256', $event['title']), 0, 10),
                'title'         => $event['title'],
                'startDate'     => $startTimestamp === false ? null : $startTimestamp * 1000,
                'rawStartDate'  => $event['startDate'],
                'endDate'       => $endTimestamp === false ? null : $endTimestamp * 1000,
                'rawEndDate'    => $event['endDate'],
                'calendarId'    => $calendarKey,
                'calendarLabel' => $label,
                'routePath'     => $path,
                'isMultiDay'    => $event['isMultiDay'],
                'academicYear'  => (string)$calendar['academic_year'],
            ];
        }
    }

    usort($events, static function ($first, $second) {
        return ($first['startDate'] ?? 0) <=> ($second['startDate'] ?? 0);
    });

    return $events;
}
