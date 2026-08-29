<?php

require_once __DIR__ . '/../../csvImportHelpers.php';
require_once __DIR__ . '/../Library/libraryHelpers.php';
require_once __DIR__ . '/../StaffDirectory/staffDirectoryHelpers.php';
require_once __DIR__ . '/../AcademicCalendars/academicCalendarHelpers.php';
require_once __DIR__ . '/../EventBookings/eventBookingHelpers.php';


function import_registry() {
    return [
        'library' => [
            'label'      => 'library book',   'plural' => 'library books',
            'category'   => 'library',
            'descriptor' => 'library_import_descriptor',
            'authorise'  => 'library_import_authorise',
            'add'        => 'library_add_books',
            'context'    => ['category_key'],
        ],
        'staff' => [
            'label'      => 'employee',       'plural' => 'employees',
            'category'   => 'staff_directory',
            'descriptor' => 'staff_import_descriptor',
            'authorise'  => 'staff_import_authorise',
            'add'        => 'staff_add_employees',
            'context'    => [],
        ],
        'eventBookings' => [
            'label'      => 'booking',          'plural' => 'bookings',
            'category'   => 'event_bookings',
            'descriptor' => 'event_booking_import_descriptor',
            'variants'   => 'event_booking_import_variants',
            'authorise'  => 'event_booking_import_authorise',
            'add'        => 'event_booking_add_bookings',
            'context'    => [],
        ],
        'calendarEvents' => [
            'label'      => 'calendar event',  'plural' => 'calendar events',
            'category'   => 'academic_calendars',
            'descriptor' => 'calendar_import_descriptor',
            'authorise'  => 'calendar_import_authorise',
            'add'        => 'calendar_add_events',
            'context'    => ['calendar_key', 'academic_year'],
        ],
    ];
}


function import_domain($domainKey) {
    $registry = import_registry();

    return isset($registry[$domainKey]) ? $registry[$domainKey] : null;
}


function import_context_from_request($domain, $source) {
    $context = [];

    foreach ($domain['context'] as $key) {
        $context[$key] = isset($source[$key]) ? (string)$source[$key] : '';
    }

    return $context;
}
