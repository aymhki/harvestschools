<?php


const STAFF_DEPARTMENTS = [
    'national'     => ['en' => 'National',     'ar' => 'الناشونال'],
    'british'      => ['en' => 'British',      'ar' => 'البريطاني'],
    'american'     => ['en' => 'American',     'ar' => 'الأمريكي'],
    'kindergarten' => ['en' => 'Kindergarten', 'ar' => 'رياض الأطفال'],
];

const STAFF_ALL_DEPARTMENTS = 'all';

const STAFF_ALL_DEPARTMENTS_LABEL = ['en' => 'All Departments', 'ar' => 'كل الأقسام'];

function staff_department_keys() {
    return array_keys(STAFF_DEPARTMENTS);
}

function staff_department_name($key, $language = 'en') {
    $language = $language === 'ar' ? 'ar' : 'en';

    if ($key === STAFF_ALL_DEPARTMENTS) {
        return STAFF_ALL_DEPARTMENTS_LABEL[$language];
    }

    return STAFF_DEPARTMENTS[$key][$language] ?? (string)$key;
}


function staff_normalise_departments($input) {
    $chosen = is_array($input) ? $input : explode(',', (string)$input);
    $chosen = array_map(static fn($value) => strtolower(trim((string)$value)), $chosen);

    foreach ($chosen as $value) {
        if ($value === STAFF_ALL_DEPARTMENTS) {
            return STAFF_ALL_DEPARTMENTS;
        }
    }

    $keys = array_values(array_filter(staff_department_keys(), static fn($key) => in_array($key, $chosen, true)));

    return $keys === [] ? null : implode(',', $keys);
}


function staff_departments_label($stored, $language = 'en') {
    if ((string)$stored === STAFF_ALL_DEPARTMENTS) {
        return staff_department_name(STAFF_ALL_DEPARTMENTS, $language);
    }

    $names = array_map(
        static fn($key) => staff_department_name($key, $language),
        array_filter(explode(',', (string)$stored))
    );

    return implode(', ', $names);
}


function staff_serves_department($stored, $departmentKey) {
    if ((string)$stored === STAFF_ALL_DEPARTMENTS) {
        return true;
    }

    return in_array($departmentKey, array_filter(explode(',', (string)$stored)), true);
}
