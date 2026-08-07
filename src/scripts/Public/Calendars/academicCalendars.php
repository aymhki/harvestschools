<?php


const ACADEMIC_CALENDARS = [
    'national'     => ['en' => 'National',        'ar' => 'ناشونال',        'path' => '/events/national-calendar',      'permission' => '16'],
    'british'      => ['en' => 'British',         'ar' => 'بريطاني',        'path' => '/events/british-calendar',       'permission' => '17'],
    'american'     => ['en' => 'American',        'ar' => 'أمريكي',         'path' => '/events/american-calendar',      'permission' => '18'],
    'national-kg'  => ['en' => 'National KG',     'ar' => 'روضة ناشونال',   'path' => '/events/national-kg-calendar',   'permission' => '19'],
    'british-kg'   => ['en' => 'British KG',      'ar' => 'روضة بريطاني',   'path' => '/events/british-kg-calendar',    'permission' => '20'],
    'american-kg'  => ['en' => 'American KG',     'ar' => 'روضة أمريكي',    'path' => '/events/american-kg-calendar',   'permission' => '21'],
];

const ACADEMIC_CALENDARS_MASTER_PERMISSION = '15';
const ACADEMIC_CALENDAR_MAX_YEARS_AHEAD = 2;
const ACADEMIC_CALENDAR_YEAR_PATTERN = '/^(\d{4})\/(\d{4})$/';

function academic_calendar_keys() {
    return array_keys(ACADEMIC_CALENDARS);
}

function academic_calendar_exists($calendarKey) {
    return array_key_exists((string)$calendarKey, ACADEMIC_CALENDARS);
}

function academic_calendar_label($calendarKey, $language = 'en') {
    $language = $language === 'ar' ? 'ar' : 'en';

    return ACADEMIC_CALENDARS[$calendarKey][$language] ?? (string)$calendarKey;
}

function academic_calendar_path($calendarKey) {
    return ACADEMIC_CALENDARS[$calendarKey]['path'] ?? null;
}

function academic_calendar_permission($calendarKey) {
    return ACADEMIC_CALENDARS[$calendarKey]['permission'] ?? null;
}


function academic_calendars_for_permissions($permissionLevels) {
    global $JACK_OF_ALL_TRADES;

    $levels = array_map('strval', (array)$permissionLevels);

    if (in_array(ACADEMIC_CALENDARS_MASTER_PERMISSION, $levels, true)
        || in_array((string)$JACK_OF_ALL_TRADES, $levels, true)) {
        return academic_calendar_keys();
    }

    $allowed = [];

    foreach (ACADEMIC_CALENDARS as $calendarKey => $calendar) {
        if (in_array($calendar['permission'], $levels, true)) {
            $allowed[] = $calendarKey;
        }
    }

    return $allowed;
}

function academic_calendar_normalise_year($value) {
    $year = trim((string)$value);

    if (!preg_match(ACADEMIC_CALENDAR_YEAR_PATTERN, $year, $matches)) {
        return null;
    }

    $first = (int)$matches[1];
    $second = (int)$matches[2];

    if ($second !== $first + 1) {
        return null;
    }

    $currentStart = (int)date('Y');

    if ((int)date('n') < 8) {
        $currentStart -= 1;
    }

    if ($first < $currentStart - 20 || $first > $currentStart + ACADEMIC_CALENDAR_MAX_YEARS_AHEAD) {
        return null;
    }

    return $first . '/' . $second;
}
