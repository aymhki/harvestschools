<?php


const LIBRARY_COLLECTIONS = [
    'english' => ['en' => 'English Library', 'ar' => 'المكتبة الإنجليزية'],
    'arabic'  => ['en' => 'Arabic Library',  'ar' => 'المكتبة العربية'],
];

const LIBRARY_CATEGORIES = [
    'english-fairy-tales' => [
        'collection' => 'english',
        'en' => 'Fairy Tales', 'ar' => 'حكايات خرافية',
        'path' => '/students-life/library/english-fairy-tales',
    ],
    'english-drama' => [
        'collection' => 'english',
        'en' => 'Drama', 'ar' => 'دراما',
        'path' => '/students-life/library/english-drama',
    ],
    'english-levels' => [
        'collection' => 'english',
        'en' => 'Levels', 'ar' => 'مستويات',
        'path' => '/students-life/library/english-levels',
    ],
    'english-general' => [
        'collection' => 'english',
        'en' => 'General', 'ar' => 'عام',
        'path' => '/students-life/library/english-general',
    ],
    'arabic-information' => [
        'collection' => 'arabic',
        'en' => 'Educational', 'ar' => 'معلوماتية',
        'path' => '/students-life/library/arabic-information',
    ],
    'arabic-general' => [
        'collection' => 'arabic',
        'en' => 'General', 'ar' => 'عام',
        'path' => '/students-life/library/arabic-general',
    ],
    'arabic-religion' => [
        'collection' => 'arabic',
        'en' => 'Religious', 'ar' => 'دينية',
        'path' => '/students-life/library/arabic-religion',
    ],
    'arabic-stories' => [
        'collection' => 'arabic',
        'en' => 'Stories', 'ar' => 'قصص',
        'path' => '/students-life/library/arabic-stories',
    ],
];

const LIBRARY_PERMISSION = '22';

function library_category_keys() {
    return array_keys(LIBRARY_CATEGORIES);
}

function library_category_exists($key) {
    return array_key_exists((string)$key, LIBRARY_CATEGORIES);
}

function library_category_label($key, $language = 'en') {
    $language = $language === 'ar' ? 'ar' : 'en';

    return LIBRARY_CATEGORIES[$key][$language] ?? (string)$key;
}

function library_collection_of($key) {
    return LIBRARY_CATEGORIES[$key]['collection'] ?? '';
}

function library_collection_label($collection, $language = 'en') {
    $language = $language === 'ar' ? 'ar' : 'en';

    return LIBRARY_COLLECTIONS[$collection][$language] ?? (string)$collection;
}

function library_category_path($key) {
    return LIBRARY_CATEGORIES[$key]['path'] ?? null;
}
