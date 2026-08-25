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
            'school_division' => trim((string)($values['student_' . $index . '_division'] ?? '')) ?: 'Other',
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
    $descriptor = event_booking_import_descriptor();
    $failed = [];
    $bookings = [];
    $seenUsernames = [];

    foreach ($rows as $index => $row) {
        $line = $row['line'] ?? ($index + 2);
        $values = array_key_exists('values', $row) ? $row['values'] : $row;
        $booking = event_booking_normalise($values);
        $problem = event_booking_validate($conn, $booking, $seenUsernames);

        if ($problem !== null) {
            $failed[] = csv_import_row_failure($line, $descriptor, $problem['field'], $problem['message']);
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
