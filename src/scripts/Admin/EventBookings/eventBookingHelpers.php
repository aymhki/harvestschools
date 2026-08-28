<?php

require_once __DIR__ . '/../../csvImportHelpers.php';

const EVENT_BOOKING_MAX_STUDENTS = 5;

const EVENT_BOOKING_DIVISIONS = ['International', 'National', 'Kindergarten', 'American', 'British'];

const EVENT_BOOKING_GRADES = [
    'Pre Play', 'Playschool', 'FS1', 'FS2', 'Pre-K', 'K', 'KG1', 'KG2', 'IF1', 'IF2',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
];

const EVENT_BOOKING_PAYMENT_STATUSES = ['Not Signed Up', 'Signed Up, pending payment', 'Confirmed'];


function event_booking_canonical_division($value) {
    $candidate = trim((string)$value);

    foreach (EVENT_BOOKING_DIVISIONS as $division) {
        if (strcasecmp($division, $candidate) === 0) {
            return $division;
        }
    }

    return '';
}


function event_booking_import_authorise($conn) {
    global $EVENT_BOOKING_MANAGEMENT;

    return check_admin_user_permission($conn, $EVENT_BOOKING_MANAGEMENT);
}


function event_booking_import_descriptor() {
    $descriptor = [
        'booking_username'    => ['required' => true,  'type' => 'text', 'label' => 'Booking Username',     'example' => 'omar.hassan'],
        'booking_password'    => ['required' => true,  'type' => 'text', 'label' => 'Booking Password',     'example' => 'Ceremony2026'],
        'first_parent_name'   => ['required' => true,  'type' => 'text', 'label' => 'First Parent Name',    'example' => 'Hassan Omar'],
        'first_parent_email'  => ['required' => false, 'type' => 'text', 'label' => 'First Parent Email',   'example' => 'hassan@example.com'],
        'first_parent_phone'  => ['required' => false, 'type' => 'text', 'label' => 'First Parent Phone',   'example' => '01000000000'],
        'second_parent_name'  => ['required' => false, 'type' => 'text', 'label' => 'Second Parent Name',   'example' => ''],
        'second_parent_email' => ['required' => false, 'type' => 'text', 'label' => 'Second Parent Email',  'example' => ''],
        'second_parent_phone' => ['required' => false, 'type' => 'text', 'label' => 'Second Parent Phone',  'example' => ''],
    ];

    for ($index = 1; $index <= EVENT_BOOKING_MAX_STUDENTS; $index++) {
        $descriptor['student_' . $index . '_name'] = [
            'required' => $index === 1,
            'type'     => 'text',
            'label'    => 'Student ' . $index . ' Name',
            'example'  => $index === 1 ? 'Salma Hassan' : '',
        ];

        $descriptor['student_' . $index . '_division'] = [
            'required' => false,
            'type'     => 'enum',
            'label'    => 'Student ' . $index . ' School Division',
            'example'  => $index === 1 ? 'National' : '',
            'values'   => EVENT_BOOKING_DIVISIONS,
        ];

        $descriptor['student_' . $index . '_grade'] = [
            'required' => false,
            'type'     => 'enum',
            'label'    => 'Student ' . $index . ' Grade',
            'example'  => $index === 1 ? 'Grade 6' : '',
            'values'   => EVENT_BOOKING_GRADES,
        ];
    }

    $descriptor['cd_count'] = ['required' => false, 'type' => 'number', 'label' => 'CD Count', 'example' => '0'];
    $descriptor['additional_attendees'] = ['required' => false, 'type' => 'number', 'label' => 'Additional Attendees', 'example' => '0'];
    $descriptor['payment_status'] = [
        'required' => false,
        'type'     => 'enum',
        'label'    => 'Extras Payment Status',
        'example'  => 'Not Signed Up',
        'values'   => EVENT_BOOKING_PAYMENT_STATUSES,
    ];

    return $descriptor;
}


function event_booking_normalise($values) {
    $students = [];

    for ($index = 1; $index <= EVENT_BOOKING_MAX_STUDENTS; $index++) {
        $name = trim((string)($values['student_' . $index . '_name'] ?? ''));

        if ($name === '') {
            continue;
        }

        $students[] = [
            'name'            => $name,
            'school_division' => event_booking_canonical_division($values['student_' . $index . '_division'] ?? ''),
            'grade'           => trim((string)($values['student_' . $index . '_grade'] ?? '')),
        ];
    }

    return [
        'username'             => trim((string)($values['booking_username'] ?? '')),
        'password'             => (string)($values['booking_password'] ?? ''),
        'first_parent'         => [
            'name'  => trim((string)($values['first_parent_name'] ?? '')),
            'email' => trim((string)($values['first_parent_email'] ?? '')),
            'phone' => trim((string)($values['first_parent_phone'] ?? '')),
        ],
        'second_parent'        => [
            'name'  => trim((string)($values['second_parent_name'] ?? '')),
            'email' => trim((string)($values['second_parent_email'] ?? '')),
            'phone' => trim((string)($values['second_parent_phone'] ?? '')),
        ],
        'students'             => $students,
        'cd_count'             => (int)($values['cd_count'] ?? 0),
        'additional_attendees' => (int)($values['additional_attendees'] ?? 0),
        'payment_status'       => trim((string)($values['payment_status'] ?? '')) ?: 'Not Signed Up',
    ];
}


function event_booking_combined_import_descriptor() {
    return [
        'booking_username'     => ['required' => true,  'type' => 'text',   'label' => 'Booking Username',       'example' => 'omar.hassan'],
        'booking_password'     => ['required' => true,  'type' => 'text',   'label' => 'Booking Password',       'example' => 'Ceremony2026'],
        'parent_names'         => ['required' => true,  'type' => 'text',   'label' => 'Parent Names',           'example' => 'Hassan Omar, Mona Fouad'],
        'parent_emails'        => ['required' => false, 'type' => 'text',   'label' => 'Parent Emails',          'example' => 'hassan@example.com, mona@example.com'],
        'parent_phones'        => ['required' => false, 'type' => 'text',   'label' => 'Parent Phones',          'example' => '01000000000, 01111111111'],
        'student_names'        => ['required' => true,  'type' => 'text',   'label' => 'Student Names',          'example' => 'Salma Hassan, Youssef Hassan'],
        'student_divisions'    => ['required' => false, 'type' => 'text',   'label' => 'School Divisions',       'example' => 'National, International'],
        'student_grades'       => ['required' => false, 'type' => 'text',   'label' => 'Grades',                 'example' => 'Grade 6, Grade 3'],
        'cd_count'             => ['required' => false, 'type' => 'number', 'label' => 'CD Count',               'example' => '0'],
        'additional_attendees' => ['required' => false, 'type' => 'number', 'label' => 'Additional Attendees',   'example' => '0'],
        'payment_status'       => [
            'required' => false,
            'type'     => 'enum',
            'label'    => 'Booking Extras Status',
            'example'  => 'Not Signed Up',
            'values'   => EVENT_BOOKING_PAYMENT_STATUSES,
        ],
    ];
}


function event_booking_import_variants() {
    return [
        [
            'key'     => 'perPerson',
            'label'   => 'Template (a column per person)',
            'columns' => event_booking_import_descriptor(),
        ],
        [
            'key'     => 'combined',
            'label'   => 'Template (comma separated lists)',
            'columns' => event_booking_combined_import_descriptor(),
        ],
    ];
}


function event_booking_split_list($value) {
    $parts = array_map('trim', explode(',', (string)$value));

    while ($parts !== [] && end($parts) === '') {
        array_pop($parts);
    }

    return $parts;
}


function event_booking_list_has($value, array $allowed) {
    foreach ($allowed as $option) {
        if (strcasecmp($option, $value) === 0) {
            return true;
        }
    }

    return false;
}


function event_booking_combined_problem($values) {
    $studentNames = event_booking_split_list($values['student_names'] ?? '');
    $divisions    = event_booking_split_list($values['student_divisions'] ?? '');
    $grades       = event_booking_split_list($values['student_grades'] ?? '');
    $parentNames  = event_booking_split_list($values['parent_names'] ?? '');
    $parentEmails = event_booking_split_list($values['parent_emails'] ?? '');
    $parentPhones = event_booking_split_list($values['parent_phones'] ?? '');

    if (count($parentNames) > 2) {
        return ['field' => 'parent_names', 'message' => 'A booking can list at most two parents.'];
    }

    $lists = [
        ['parent_emails',     $parentEmails, count($parentNames),  'emails',           'parent names'],
        ['parent_phones',     $parentPhones, count($parentNames),  'phone numbers',    'parent names'],
        ['student_divisions', $divisions,    count($studentNames), 'school divisions', 'student names'],
        ['student_grades',    $grades,       count($studentNames), 'grades',           'student names'],
    ];

    foreach ($lists as $list) {
        if (count($list[1]) > $list[2]) {
            return [
                'field'   => $list[0],
                'message' => 'There are more ' . $list[3] . ' than ' . $list[4]
                    . '. Keep one entry per person, in the same order, and leave a gap empty to skip one.',
            ];
        }
    }

    foreach ($divisions as $division) {
        if ($division !== '' && !event_booking_list_has($division, EVENT_BOOKING_DIVISIONS)) {
            return [
                'field'   => 'student_divisions',
                'message' => '"' . $division . '" is not a school division. Use one of: ' . implode(' / ', EVENT_BOOKING_DIVISIONS) . '.',
            ];
        }
    }

    foreach ($grades as $grade) {
        if ($grade !== '' && !event_booking_list_has($grade, EVENT_BOOKING_GRADES)) {
            return [
                'field'   => 'student_grades',
                'message' => '"' . $grade . '" is not a grade. Use one of: ' . implode(' / ', EVENT_BOOKING_GRADES) . '.',
            ];
        }
    }

    return null;
}


function event_booking_combined_field_key($fieldKey) {
    $keysByPerPersonKey = [
        'first_parent_name'  => 'parent_names',
        'second_parent_name' => 'parent_names',
        'student_1_name'     => 'student_names',
    ];

    for ($index = 1; $index <= EVENT_BOOKING_MAX_STUDENTS; $index++) {
        $keysByPerPersonKey['student_' . $index . '_division'] = 'student_divisions';
        $keysByPerPersonKey['student_' . $index . '_grade'] = 'student_grades';
    }

    return $keysByPerPersonKey[$fieldKey] ?? $fieldKey;
}


function event_booking_normalise_combined($values) {
    $names        = event_booking_split_list($values['student_names'] ?? '');
    $divisions    = event_booking_split_list($values['student_divisions'] ?? '');
    $grades       = event_booking_split_list($values['student_grades'] ?? '');
    $parentNames  = event_booking_split_list($values['parent_names'] ?? '');
    $parentEmails = event_booking_split_list($values['parent_emails'] ?? '');
    $parentPhones = event_booking_split_list($values['parent_phones'] ?? '');
    $students     = [];

    foreach ($names as $position => $name) {
        if ($name === '') {
            continue;
        }

        $students[] = [
            'name'            => $name,
            'school_division' => event_booking_canonical_division($divisions[$position] ?? ''),
            'grade'           => (string)($grades[$position] ?? ''),
        ];
    }

    $parentAt = function ($position) use ($parentNames, $parentEmails, $parentPhones) {
        return [
            'name'  => (string)($parentNames[$position] ?? ''),
            'email' => (string)($parentEmails[$position] ?? ''),
            'phone' => (string)($parentPhones[$position] ?? ''),
        ];
    };

    return [
        'username'             => trim((string)($values['booking_username'] ?? '')),
        'password'             => (string)($values['booking_password'] ?? ''),
        'first_parent'         => $parentAt(0),
        'second_parent'        => $parentAt(1),
        'students'             => $students,
        'cd_count'             => (int)($values['cd_count'] ?? 0),
        'additional_attendees' => (int)($values['additional_attendees'] ?? 0),
        'payment_status'       => trim((string)($values['payment_status'] ?? '')) ?: 'Not Signed Up',
    ];
}


function event_booking_validate($conn, $booking, $seenUsernames = []) {
    if ($booking['username'] === '' || $booking['password'] === '') {
        return ['field' => 'booking_username', 'message' => 'A booking username and password are both required.'];
    }

    if (isset($seenUsernames[strtolower($booking['username'])])) {
        return ['field' => 'booking_username', 'message' => 'This username appears more than once in the file.'];
    }

    $stmt = $conn->prepare("SELECT auth_id FROM event_booking_auth_credentials WHERE username = ?");
    $stmt->bind_param("s", $booking['username']);
    $stmt->execute();
    $taken = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($taken) {
        return ['field' => 'booking_username', 'message' => 'That username already exists. Please choose a different one.'];
    }

    if ($booking['first_parent']['name'] === '') {
        return ['field' => 'first_parent_name', 'message' => 'The first parent name is required.'];
    }

    if ($booking['students'] === []) {
        return ['field' => 'student_1_name', 'message' => 'At least one student is required.'];
    }

    if (count($booking['students']) > EVENT_BOOKING_MAX_STUDENTS) {
        return ['field' => 'student_1_name', 'message' => 'A maximum of ' . EVENT_BOOKING_MAX_STUDENTS . ' students is allowed per booking.'];
    }

    foreach ($booking['students'] as $position => $student) {
        if (event_booking_canonical_division($student['school_division']) === '') {
            return [
                'field'   => 'student_' . ($position + 1) . '_division',
                'message' => $student['name'] . ' needs a school division. Use one of: ' . implode(' / ', EVENT_BOOKING_DIVISIONS) . '.',
            ];
        }
    }

    if (($booking['cd_count'] > 0 || $booking['additional_attendees'] > 0) && $booking['payment_status'] === 'Not Signed Up') {
        return ['field' => 'payment_status', 'message' => "You can't sign up for extras without updating the extras status."];
    }

    return null;
}


function event_booking_insert($conn, $booking) {
    $stmt = $conn->prepare("INSERT INTO event_booking_auth_credentials (username, password_hash) VALUES (?, SHA2(?, 256))");
    $stmt->bind_param("ss", $booking['username'], $booking['password']);
    $stmt->execute();
    $authId = $conn->insert_id;
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO event_bookings (auth_id) VALUES (?)");
    $stmt->bind_param("i", $authId);
    $stmt->execute();
    $bookingId = $conn->insert_id;
    $stmt->close();

    foreach ([['first_parent', 1], ['second_parent', 0]] as $parentSlot) {
        $parent = $booking[$parentSlot[0]];

        if ($parent['name'] === '') {
            continue;
        }

        $stmt = $conn->prepare("INSERT INTO event_booking_parents (name, email, phone_number) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $parent['name'], $parent['email'], $parent['phone']);
        $stmt->execute();
        $parentId = $conn->insert_id;
        $stmt->close();

        $isPrimary = $parentSlot[1];
        $stmt = $conn->prepare("INSERT INTO event_booking_parents_linker (booking_id, parent_id, is_primary) VALUES (?, ?, ?)");
        $stmt->bind_param("iii", $bookingId, $parentId, $isPrimary);
        $stmt->execute();
        $stmt->close();
    }

    foreach ($booking['students'] as $student) {
        $stmt = $conn->prepare("INSERT INTO event_booking_students (name, school_division, grade) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $student['name'], $student['school_division'], $student['grade']);
        $stmt->execute();
        $studentId = $conn->insert_id;
        $stmt->close();

        $stmt = $conn->prepare("INSERT INTO event_booking_students_linker (booking_id, student_id) VALUES (?, ?)");
        $stmt->bind_param("ii", $bookingId, $studentId);
        $stmt->execute();
        $stmt->close();
    }

    $stmt = $conn->prepare("INSERT INTO event_booking_extras (booking_id, cd_count, additional_attendees, payment_status) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiis", $bookingId, $booking['cd_count'], $booking['additional_attendees'], $booking['payment_status']);
    $stmt->execute();
    $stmt->close();

    return $bookingId;
}


function event_booking_add_bookings($conn, array $rows, array $context = []) {
    $isCombined = ($context['import_variant'] ?? '') === 'combined';
    $descriptor = isset($context['import_descriptor']) && is_array($context['import_descriptor'])
        ? $context['import_descriptor']
        : ($isCombined ? event_booking_combined_import_descriptor() : event_booking_import_descriptor());
    $failed = [];
    $bookings = [];
    $seenUsernames = [];

    foreach ($rows as $index => $row) {
        $line = $row['line'] ?? ($index + 2);
        $values = array_key_exists('values', $row) ? $row['values'] : $row;
        $booking = $isCombined ? event_booking_normalise_combined($values) : event_booking_normalise($values);
        $problem = $isCombined ? event_booking_combined_problem($values) : null;

        if ($problem === null) {
            $problem = event_booking_validate($conn, $booking, $seenUsernames);
        }

        if ($problem !== null) {
            $failedField = $isCombined ? event_booking_combined_field_key($problem['field']) : $problem['field'];
            $failed[] = csv_import_row_failure($line, $descriptor, $failedField, $problem['message']);
            continue;
        }

        $seenUsernames[strtolower($booking['username'])] = true;
        $bookings[] = $booking;
    }

    if ($failed !== []) {
        return ['ok' => 0, 'failed' => $failed];
    }

    $conn->begin_transaction();

    try {
        foreach ($bookings as $booking) {
            event_booking_insert($conn, $booking);
        }

        $conn->commit();
    } catch (Throwable $insertError) {
        $conn->rollback();

        throw $insertError;
    }

    return ['ok' => count($bookings), 'failed' => []];
}
