<?php

require_once __DIR__ . '/../../Public/Staff/staffDepartments.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicSchoolInfoHelpers.php';

const STAFF_EMPLOYEE_CODE_START = 1001;
const STAFF_EMPLOYEE_CODE_PATTERN = '/^[A-Za-z0-9_-]{1,32}$/';
const STAFF_MAX_NOTE_LENGTH = 2000;

const STAFF_DISPLAY_STYLE_LABELS = [
    'table'     => 'Table Row',
    'highlight' => 'Highlighted Line',
];

function staff_error($message, $code = 400) {
    return ["success" => false, "message" => $message, "code" => $code];
}


function staff_yes_no_to_int($value) {
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    return in_array(strtolower(trim((string)$value)), ['yes', '1', 'true'], true) ? 1 : 0;
}

function staff_int_to_yes_no($value) {
    return ((int)$value) === 1 ? 'Yes' : 'No';
}

function staff_trim($value, $limit) {
    return mb_substr(trim((string)($value ?? '')), 0, $limit);
}

function staff_display_style_label($value) {
    return STAFF_DISPLAY_STYLE_LABELS[$value] ?? (string)$value;
}


function staff_display_style_value($input) {
    $needle = strtolower(trim((string)$input));

    foreach (STAFF_DISPLAY_STYLE_LABELS as $value => $label) {
        if ($needle === strtolower($value) || $needle === strtolower($label)) {
            return $value;
        }
    }

    return null;
}


function staff_next_employee_code($conn) {
    $result = $conn->query(
        "SELECT MAX(CAST(employee_code AS UNSIGNED)) AS highest
         FROM staff_employees
         WHERE employee_code REGEXP '^[0-9]+$'"
    );

    $highest = (int)($result->fetch_assoc()['highest'] ?? 0);

    return (string)max(STAFF_EMPLOYEE_CODE_START, $highest + 1);
}

function staff_next_sort_order($conn) {
    $result = $conn->query("SELECT MAX(sort_order) AS highest FROM staff_employees");

    return (int)($result->fetch_assoc()['highest'] ?? 0) + 1;
}

function staff_validate_employee($conn, $data, $isNew) {
    $nameEn = staff_trim($data['name_en'] ?? '', 150);
    $nameAr = staff_trim($data['name_ar'] ?? '', 150);

    if ($nameEn === '') {
        return staff_error("The English name is required.");
    }

    if ($nameAr === '') {
        return staff_error("The Arabic name is required.");
    }

    $employeeCode = staff_trim($data['employee_code'] ?? '', 32);

    if ($employeeCode === '') {
        if (!$isNew) {
            return staff_error("The employee ID is required.");
        }

        $employeeCode = staff_next_employee_code($conn);
    } elseif (!preg_match(STAFF_EMPLOYEE_CODE_PATTERN, $employeeCode)) {
        return staff_error("The employee ID may only contain letters, numbers, dashes and underscores, up to 32 characters.");
    }

    if ($isNew) {
        $stmt = $conn->prepare("SELECT employee_code FROM staff_employees WHERE employee_code = ?");
        $stmt->bind_param("s", $employeeCode);
        $stmt->execute();
        $clash = $stmt->get_result()->num_rows > 0;
        $stmt->close();

        if ($clash) {
            return staff_error("That employee ID is already in use.");
        }
    }

    $positionEn = staff_trim($data['position_en'] ?? '', 200);
    $positionAr = staff_trim($data['position_ar'] ?? '', 200);

    if ($positionEn === '' || $positionAr === '') {
        return staff_error("The position is required in both English and Arabic. Separate more than one with a comma.");
    }

    $departments = staff_normalise_departments($data['departments'] ?? '');

    if ($departments === null) {
        return staff_error("Please choose at least one department, or All Departments.");
    }

    $displayStyle = staff_display_style_value($data['display_style'] ?? 'table');

    if ($displayStyle === null) {
        return staff_error("Please choose a valid display style.");
    }

    $email = staff_trim($data['email'] ?? '', 255);

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return staff_error("Please enter a valid email address, or leave it blank.");
    }

    $phone = staff_trim($data['phone'] ?? '', 50);

    if ($phone !== '' && !preg_match('/^[0-9+\-() ]{5,50}$/', $phone)) {
        return staff_error("Please enter a valid phone number, or leave it blank.");
    }

    $hireDate = staff_trim($data['hire_date'] ?? '', 10);

    if ($hireDate !== '') {
        $parsed = DateTime::createFromFormat('Y-m-d', $hireDate);

        if (!$parsed || $parsed->format('Y-m-d') !== $hireDate) {
            return staff_error("Please enter the hire date as YYYY-MM-DD, or leave it blank.");
        }
    }

    $birthDate = staff_trim($data['birth_date'] ?? '', 10);

    if ($birthDate !== '') {
        $parsed = DateTime::createFromFormat('Y-m-d', $birthDate);

        if (!$parsed || $parsed->format('Y-m-d') !== $birthDate) {
            return staff_error("Please enter the date of birth as YYYY-MM-DD, or leave it blank.");
        }
    }

    $nationalId = staff_trim($data['national_id'] ?? '', 20);

    if ($nationalId !== '' && !preg_match('/^[0-9]{10,20}$/', $nationalId)) {
        return staff_error("The national ID must be 10 to 20 digits, or left blank.");
    }

    $fingerprintCode = staff_trim($data['fingerprint_code'] ?? '', 16);

    if ($fingerprintCode !== '' && !preg_match('/^[A-Za-z0-9_-]{1,16}$/', $fingerprintCode)) {
        return staff_error("The fingerprint code may only contain letters, numbers, dashes and underscores.");
    }

    $graduationYear = staff_trim($data['graduation_year'] ?? '', 4);

    if ($graduationYear !== '' && !preg_match('/^[0-9]{4}$/', $graduationYear)) {
        return staff_error("The graduation year must be four digits, or left blank.");
    }

    $sortOrder = array_key_exists('sort_order', $data) && $data['sort_order'] !== ''
        ? (int)$data['sort_order']
        : ($isNew ? staff_next_sort_order($conn) : 0);

    if ($sortOrder < 0 || $sortOrder > 100000) {
        return staff_error("The ID must be between 0 and 100000.");
    }

    return [
        "success"  => true,
        "employee" => [
            'employee_code' => $employeeCode,
            'sort_order'    => $sortOrder,
            'name_en'       => $nameEn,
            'name_ar'       => $nameAr,
            'position_en'   => $positionEn,
            'position_ar'   => $positionAr,
            'subject_en'    => staff_trim($data['subject_en'] ?? '', 200),
            'subject_ar'    => staff_trim($data['subject_ar'] ?? '', 200),
            'departments'   => $departments,
            'display_style' => $displayStyle,
            'is_public'     => staff_yes_no_to_int($data['is_public'] ?? 'No'),
            'email'         => $email,
            'phone'         => $phone,
            'hire_date'     => $hireDate === '' ? null : $hireDate,
            'notes'         => staff_trim($data['notes'] ?? '', STAFF_MAX_NOTE_LENGTH),
            'degree_en'     => staff_trim($data['degree_en'] ?? '', 150),
            'degree_ar'     => staff_trim($data['degree_ar'] ?? '', 150),
            'fingerprint_code' => $fingerprintCode,
            'classification'   => staff_trim($data['classification'] ?? '', 50),
            'graduation_year'  => $graduationYear,
            'national_id'      => $nationalId,
            'insurance_number' => staff_trim($data['insurance_number'] ?? '', 32),
            'birth_date'       => $birthDate === '' ? null : $birthDate,
            'address'          => staff_trim($data['address'] ?? '', 255),
        ]
    ];
}
