<?php

require_once __DIR__ . '/../../Public/Staff/staffDepartments.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicSchoolInfoHelpers.php';

const STAFF_EMPLOYEE_CODE_START = 1001;
const STAFF_EMPLOYEE_CODE_PATTERN = '/^[A-Za-z0-9_-]{1,32}$/';
const STAFF_MAX_NOTE_LENGTH = 2000;
const STAFF_MAX_BASIC_SALARY = 99999999.99;

const STAFF_DISPLAY_STYLE_LABELS = [
    'table'     => 'Table Row',
    'highlight' => 'Highlighted Line',
];

function staff_error($message, $code = 400, $field = null) {
    return ["success" => false, "message" => $message, "code" => $code, "field" => $field];
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


function staff_insert_employee($conn, $employee) {
    $stmt = $conn->prepare(
        "INSERT INTO staff_employees
            (employee_code, sort_order, name_en, name_ar, position_en, position_ar,
             subject_en, subject_ar, departments, display_style, is_public,
             email, phone, hire_date, notes, degree_en, degree_ar, fingerprint_code, classification, graduation_year,
             national_id, insurance_number, birth_date, address, basic_salary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->bind_param(
        "sisssssssssssss" . "sssssssss" . "d",
        $employee['employee_code'],
        $employee['sort_order'],
        $employee['name_en'],
        $employee['name_ar'],
        $employee['position_en'],
        $employee['position_ar'],
        $employee['subject_en'],
        $employee['subject_ar'],
        $employee['departments'],
        $employee['display_style'],
        $employee['is_public'],
        $employee['email'],
        $employee['phone'],
        $employee['hire_date'],
        $employee['notes'],
        $employee['degree_en'],
        $employee['degree_ar'],
        $employee['fingerprint_code'],
        $employee['classification'],
        $employee['graduation_year'],
        $employee['national_id'],
        $employee['insurance_number'],
        $employee['birth_date'],
        $employee['address'],
        $employee['basic_salary']
    );

    try {
        $stmt->execute();
        $stmt->close();

        return ['success' => true, 'employee_code' => $employee['employee_code']];
    } catch (mysqli_sql_exception $insertError) {
        $stmt->close();

        if ($conn->errno !== 1062) {
            throw $insertError;
        }

        return ['success' => false, 'duplicate' => true];
    }
}


function staff_import_descriptor() {
    return [
        'employee_code'    => ['required' => false, 'type' => 'text',   'label' => 'Employee ID',      'example' => ''],
        'name_en'          => ['required' => true,  'type' => 'text',   'label' => 'Name (EN)',        'example' => 'Mona Fahmy'],
        'name_ar'          => ['required' => true,  'type' => 'text',   'label' => 'Name (AR)',        'example' => 'منى فهمي'],
        'position_en'      => ['required' => true,  'type' => 'text',   'label' => 'Position (EN)',    'example' => 'Teacher'],
        'position_ar'      => ['required' => true,  'type' => 'text',   'label' => 'Position (AR)',    'example' => 'معلمة'],
        'departments'      => ['required' => true,  'type' => 'text',   'label' => 'Departments',      'example' => 'national,british'],
        'subject_en'       => ['required' => false, 'type' => 'text',   'label' => 'Subject (EN)',     'example' => 'Mathematics'],
        'subject_ar'       => ['required' => false, 'type' => 'text',   'label' => 'Subject (AR)',     'example' => 'الرياضيات'],
        'degree_en'        => ['required' => false, 'type' => 'text',   'label' => 'Degree (EN)',      'example' => 'BSc Education'],
        'degree_ar'        => ['required' => false, 'type' => 'text',   'label' => 'Degree (AR)',      'example' => 'بكالوريوس تربية'],
        'display_style'    => ['required' => false, 'type' => 'enum',   'label' => 'Display Style',    'example' => 'Table Row', 'values' => ['Table Row', 'Highlighted Line']],
        'is_public'        => ['required' => false, 'type' => 'enum',   'label' => 'Shown Publicly',   'example' => 'No', 'values' => ['Yes', 'No']],
        'email'            => ['required' => false, 'type' => 'text',   'label' => 'Email',            'example' => 'mona@harvestschools.com'],
        'phone'            => ['required' => false, 'type' => 'text',   'label' => 'Phone',            'example' => '01000000000'],
        'hire_date'        => ['required' => false, 'type' => 'date',   'label' => 'Hire Date',        'example' => '2016-09-01'],
        'birth_date'       => ['required' => false, 'type' => 'date',   'label' => 'Date Of Birth',    'example' => '1990-04-17'],
        'national_id'      => ['required' => false, 'type' => 'text',   'label' => 'National ID',      'example' => '29004170101234'],
        'insurance_number' => ['required' => false, 'type' => 'text',   'label' => 'Insurance Number', 'example' => ''],
        'fingerprint_code' => ['required' => false, 'type' => 'text',   'label' => 'Fingerprint Code', 'example' => ''],
        'classification'   => ['required' => false, 'type' => 'text',   'label' => 'Classification',   'example' => ''],
        'graduation_year'  => ['required' => false, 'type' => 'text',   'label' => 'Graduation Year',  'example' => '2012'],
        'address'          => ['required' => false, 'type' => 'text',   'label' => 'Address',          'example' => ''],
        'basic_salary'     => ['required' => false, 'type' => 'number', 'label' => 'Basic Salary',     'example' => '0'],
        'notes'            => ['required' => false, 'type' => 'text',   'label' => 'Notes',            'example' => ''],
    ];
}


function staff_import_authorise($conn) {
    global $STAFF_DIRECTORY_MANAGEMENT;

    return check_admin_user_permission($conn, $STAFF_DIRECTORY_MANAGEMENT);
}


function staff_add_employees($conn, array $rows, array $context = []) {
    $descriptor = staff_import_descriptor();
    $failed = [];
    $prepared = [];

    foreach ($rows as $index => $row) {
        $line = $row['line'] ?? ($index + 2);
        $values = array_key_exists('values', $row) ? $row['values'] : $row;

        $values = array_filter($values, static function ($value) {
            return $value !== '' && $value !== null;
        });

        $validation = staff_validate_employee($conn, $values, true);

        if (!$validation['success']) {
            $failed[] = csv_import_row_failure($line, $descriptor, $validation['field'] ?? null, $validation['message']);
            continue;
        }

        $prepared[] = ['line' => $line, 'values' => $values];
    }

    if ($failed !== []) {
        return ['ok' => 0, 'failed' => $failed];
    }

    $imported = 0;
    $codes = [];
    $conn->begin_transaction();

    try {
        foreach ($prepared as $row) {
            $validation = staff_validate_employee($conn, $row['values'], true);

            if (!$validation['success']) {
                $conn->rollback();

                return ['ok' => 0, 'failed' => [csv_import_row_failure($row['line'], $descriptor, $validation['field'] ?? null, $validation['message'])]];
            }

            $insert = staff_insert_employee($conn, $validation['employee']);

            if (!$insert['success']) {
                $conn->rollback();

                return ['ok' => 0, 'failed' => [csv_import_row_failure($row['line'], $descriptor, 'employee_code', 'That employee ID is already in use.')]];
            }

            $codes[] = $insert['employee_code'];
            $imported++;
        }

        $conn->commit();
    } catch (Throwable $insertError) {
        $conn->rollback();

        throw $insertError;
    }

    return ['ok' => $imported, 'failed' => [], 'codes' => $codes];
}

function staff_validate_employee($conn, $data, $isNew) {
    $nameEn = staff_trim($data['name_en'] ?? '', 150);
    $nameAr = staff_trim($data['name_ar'] ?? '', 150);

    if ($nameEn === '') {
        return staff_error("The English name is required.", 400, 'name_en');
    }

    if ($nameAr === '') {
        return staff_error("The Arabic name is required.", 400, 'name_ar');
    }

    $employeeCode = staff_trim($data['employee_code'] ?? '', 32);

    if ($employeeCode === '') {
        if (!$isNew) {
            return staff_error("The employee ID is required.");
        }

        $employeeCode = staff_next_employee_code($conn);
    } elseif (!preg_match(STAFF_EMPLOYEE_CODE_PATTERN, $employeeCode)) {
        return staff_error("The employee ID may only contain letters, numbers, dashes and underscores, up to 32 characters.", 400, 'employee_code');
    }

    if ($isNew) {
        $stmt = $conn->prepare("SELECT employee_code FROM staff_employees WHERE employee_code = ?");
        $stmt->bind_param("s", $employeeCode);
        $stmt->execute();
        $clash = $stmt->get_result()->num_rows > 0;
        $stmt->close();

        if ($clash) {
            return staff_error("That employee ID is already in use.", 400, 'employee_code');
        }
    }

    $positionEn = staff_trim($data['position_en'] ?? '', 200);
    $positionAr = staff_trim($data['position_ar'] ?? '', 200);

    if ($positionEn === '' || $positionAr === '') {
        return staff_error("The position is required in both English and Arabic. Separate more than one with a comma.", 400, 'position_en');
    }

    $departments = staff_normalise_departments($data['departments'] ?? '');

    if ($departments === null) {
        return staff_error("Please choose at least one department, or All Departments.", 400, 'departments');
    }

    $displayStyle = staff_display_style_value($data['display_style'] ?? 'table');

    if ($displayStyle === null) {
        return staff_error("Please choose a valid display style.", 400, 'display_style');
    }

    $email = staff_trim($data['email'] ?? '', 255);

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return staff_error("Please enter a valid email address, or leave it blank.", 400, 'email');
    }

    $phone = staff_trim($data['phone'] ?? '', 50);

    if ($phone !== '' && !preg_match('/^[0-9+\-() ]{5,50}$/', $phone)) {
        return staff_error("Please enter a valid phone number, or leave it blank.", 400, 'phone');
    }

    $hireDate = staff_trim($data['hire_date'] ?? '', 10);

    if ($hireDate !== '') {
        $parsed = DateTime::createFromFormat('Y-m-d', $hireDate);

        if (!$parsed || $parsed->format('Y-m-d') !== $hireDate) {
            return staff_error("Please enter the hire date as YYYY-MM-DD, or leave it blank.", 400, 'hire_date');
        }
    }

    $birthDate = staff_trim($data['birth_date'] ?? '', 10);

    if ($birthDate !== '') {
        $parsed = DateTime::createFromFormat('Y-m-d', $birthDate);

        if (!$parsed || $parsed->format('Y-m-d') !== $birthDate) {
            return staff_error("Please enter the date of birth as YYYY-MM-DD, or leave it blank.", 400, 'birth_date');
        }
    }

    $nationalId = staff_trim($data['national_id'] ?? '', 20);

    if ($nationalId !== '' && !preg_match('/^[0-9]{10,20}$/', $nationalId)) {
        return staff_error("The national ID must be 10 to 20 digits, or left blank.", 400, 'national_id');
    }

    $fingerprintCode = staff_trim($data['fingerprint_code'] ?? '', 16);

    if ($fingerprintCode !== '' && !preg_match('/^[A-Za-z0-9_-]{1,16}$/', $fingerprintCode)) {
        return staff_error("The fingerprint code may only contain letters, numbers, dashes and underscores.", 400, 'fingerprint_code');
    }

    $graduationYear = staff_trim($data['graduation_year'] ?? '', 4);

    if ($graduationYear !== '' && !preg_match('/^[0-9]{4}$/', $graduationYear)) {
        return staff_error("The graduation year must be four digits, or left blank.", 400, 'graduation_year');
    }

    $sortOrder = array_key_exists('sort_order', $data) && $data['sort_order'] !== ''
        ? (int)$data['sort_order']
        : ($isNew ? staff_next_sort_order($conn) : 0);

    if ($sortOrder < 0 || $sortOrder > 100000) {
        return staff_error("The ID must be between 0 and 100000.");
    }

    $basicSalary = staff_trim($data['basic_salary'] ?? '', 20);

    if ($basicSalary === '') {
        $basicSalary = '0';
    }

    if (!is_numeric($basicSalary)) {
        return staff_error("The basic salary must be a number, or left blank.", 400, 'basic_salary');
    }

    $basicSalary = round((float)$basicSalary, 2);

    if ($basicSalary < 0 || $basicSalary > STAFF_MAX_BASIC_SALARY) {
        return staff_error("The basic salary must be between 0 and " . number_format(STAFF_MAX_BASIC_SALARY) . ".");
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
            'basic_salary'     => $basicSalary,
        ]
    ];
}
