<?php

require_once __DIR__ . '/../../emailRecipients.php';

const BORROWING_ROLE_PERMISSIONS = [
    'hr'         => '25',
    'accounting' => '26',
    'board'      => '3',
];

const BORROWING_CAPABILITIES = [
    'view_scores',
    'submit_application',
    'view_applications',
    'review_application',
    'override_terms',
    'submit_delay',
    'review_delay',
    'override_delay_cap',
    'view_database',
    'record_payment',
    'correct_payment',
    'submit_edit_request',
    'review_edit_request',
    'edit_policy',
];

const BORROWING_LOCKED_BOARD_CAPABILITIES = [
    'review_application',
    'review_delay',
    'review_edit_request',
    'edit_policy',
];

const BORROWING_EMAIL_EVENTS = [
    'application_submitted',
    'application_decided',
    'application_overridden',
    'delay_requested',
    'delay_decided',
    'payment_recorded',
    'installment_due',
    'installment_overdue',
    'contract_settled',
    'edit_request_decided',
];

const BORROWING_EMAIL_RECIPIENTS = ['employee', 'hr', 'accounting', 'board'];

const BORROWING_MAX_NOTE_LENGTH = 500;
const BORROWING_MAX_REASON_LENGTH = 255;
const BORROWING_HARD_MAX_INSTALLMENTS = 120;


function borrowing_error($message, $code = 400) {
    return ["success" => false, "message" => $message, "code" => $code];
}

function borrowing_trim($value, $limit) {
    return mb_substr(trim((string)($value ?? '')), 0, $limit);
}

function borrowing_money($value) {
    return round((float)$value, 2);
}

function borrowing_valid_date($value) {
    $date = borrowing_trim($value, 10);

    if ($date === '') {
        return null;
    }

    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    return ($parsed && $parsed->format('Y-m-d') === $date) ? $date : null;
}

function borrowing_month_first($date) {
    return date('Y-m-01', strtotime($date));
}

function borrowing_add_months($date, $months) {
    $first = new DateTime(borrowing_month_first($date));
    $first->modify(($months >= 0 ? '+' : '-') . abs((int)$months) . ' month');

    return $first->format('Y-m-d');
}

function borrowing_months_between($from, $to) {
    $start = new DateTime(borrowing_month_first($from));
    $end   = new DateTime(borrowing_month_first($to));
    $diff  = $start->diff($end);
    $months = ($diff->y * 12) + $diff->m;

    return $diff->invert ? -$months : $months;
}


function borrowing_settings($conn, $refresh = false) {
    static $cache = null;

    if ($cache !== null && !$refresh) {
        return $cache;
    }

    $cache = [];
    $result = $conn->query(
        "SELECT setting_key, setting_value, value_kind, options, setting_group, description, sort_order,
                UNIX_TIMESTAMP(updated_at) AS updated_stamp
         FROM borrowing_settings
         ORDER BY sort_order ASC"
    );

    while ($row = $result->fetch_assoc()) {
        $cache[$row['setting_key']] = $row;
    }

    return $cache;
}

function borrowing_setting($conn, $key, $default = '') {
    $settings = borrowing_settings($conn);

    return isset($settings[$key]) ? $settings[$key]['setting_value'] : $default;
}

function borrowing_setting_int($conn, $key, $default = 0) {
    return (int)borrowing_setting($conn, $key, (string)$default);
}

function borrowing_setting_float($conn, $key, $default = 0.0) {
    return (float)borrowing_setting($conn, $key, (string)$default);
}

function borrowing_setting_is($conn, $key, $value) {
    return borrowing_setting($conn, $key) === $value;
}

function borrowing_policy_version($conn) {
    $row = $conn->query("SELECT COALESCE(MAX(UNIX_TIMESTAMP(updated_at)), 0) AS version FROM borrowing_settings")->fetch_assoc();

    return (int)($row['version'] ?? 0);
}


function borrowing_permission_levels($conn) {
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

function borrowing_roles_for_permissions($levels) {
    $roles = [];

    foreach (BORROWING_ROLE_PERMISSIONS as $roleKey => $permission) {
        if (in_array($permission, $levels, true)) {
            $roles[] = $roleKey;
        }
    }

    return $roles;
}

function borrowing_capabilities_for_roles($conn, $roles) {
    $granted = array_fill_keys(BORROWING_CAPABILITIES, false);

    if ($roles === []) {
        return $granted;
    }

    $result = $conn->query("SELECT role_key, capability_key, is_enabled FROM borrowing_role_capabilities");

    while ($row = $result->fetch_assoc()) {
        if (in_array($row['role_key'], $roles, true) && (int)$row['is_enabled'] === 1
            && array_key_exists($row['capability_key'], $granted)) {
            $granted[$row['capability_key']] = true;
        }
    }

    return $granted;
}

function borrowing_apply_approval_chain($conn, $roles, $capabilities) {
    $chain = borrowing_setting($conn, 'approval_chain', 'hr_board_accounting');

    if ($chain === 'hr_accounting' && in_array('accounting', $roles, true)) {
        $capabilities['review_application'] = true;
    }

    if ($chain === 'hr_board' && $roles === ['accounting']) {
        $capabilities['view_applications'] = false;
    }

    return $capabilities;
}

function borrowing_authorise($conn) {
    global $JACK_OF_ALL_TRADES;

    $sessionCheck = validate_admin_session($conn);

    if (!$sessionCheck['success']) {
        return $sessionCheck;
    }

    $levels   = borrowing_permission_levels($conn);
    $isMaster = in_array((string)$JACK_OF_ALL_TRADES, $levels, true);
    $roles    = borrowing_roles_for_permissions($levels);

    if ($isMaster) {
        $roles        = array_keys(BORROWING_ROLE_PERMISSIONS);
        $capabilities = array_fill_keys(BORROWING_CAPABILITIES, true);
    } else {
        $capabilities = borrowing_capabilities_for_roles($conn, $roles);
        $capabilities = borrowing_apply_approval_chain($conn, $roles, $capabilities);
    }

    if ($roles === [] || !in_array(true, $capabilities, true)) {
        return borrowing_error("Permission denied", 403);
    }

    return [
        "success"      => true,
        "code"         => 200,
        "user_id"      => (int)$sessionCheck['user_id'],
        "levels"       => $levels,
        "roles"        => $roles,
        "isMaster"     => $isMaster,
        "capabilities" => $capabilities,
    ];
}

function borrowing_can($authorisation, $capability) {
    return !empty($authorisation['capabilities'][$capability]);
}

function borrowing_require($authorisation, $capability) {
    return borrowing_can($authorisation, $capability)
        ? null
        : borrowing_error("Permission denied", 403);
}

function borrowing_primary_role($authorisation) {
    foreach (['board', 'accounting', 'hr'] as $roleKey) {
        if (in_array($roleKey, $authorisation['roles'], true)) {
            return $roleKey;
        }
    }

    return '';
}


function borrowing_contract_year($conn, $date = null) {
    $startMonth = borrowing_setting_int($conn, 'contract_year_start_month', 9);
    $startMonth = ($startMonth >= 1 && $startMonth <= 12) ? $startMonth : 9;
    $stamp      = $date === null ? time() : strtotime($date);
    $year       = (int)date('Y', $stamp);

    return (int)date('n', $stamp) < $startMonth ? $year - 1 : $year;
}

function borrowing_contract_year_label($conn, $contractYear) {
    $startMonth = borrowing_setting_int($conn, 'contract_year_start_month', 9);
    $monthName  = date('F', mktime(0, 0, 0, $startMonth, 1));

    return $contractYear . '/' . ($contractYear + 1) . ' (from ' . $monthName . ')';
}

function borrowing_years_of_service($hireDate, $asOf = null) {
    if (empty($hireDate) || $hireDate === '0000-00-00') {
        return null;
    }

    $hire = new DateTime($hireDate);
    $now  = new DateTime($asOf === null ? 'now' : $asOf);

    if ($hire > $now) {
        return 0.0;
    }

    $days = (int)$hire->diff($now)->days;

    return round($days / 365.25, 2);
}


function borrowing_score_bands($conn, $factor) {
    static $cache = [];

    if (isset($cache[$factor])) {
        return $cache[$factor];
    }

    $stmt = $conn->prepare(
        "SELECT band_index, threshold, score, label
         FROM borrowing_score_bands
         WHERE factor = ?
         ORDER BY band_index ASC"
    );
    $stmt->bind_param("s", $factor);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $bands = [];

    while ($row = $result->fetch_assoc()) {
        $bands[] = [
            'index'     => (int)$row['band_index'],
            'threshold' => $row['threshold'] === null ? null : (int)$row['threshold'],
            'score'     => (int)$row['score'],
            'label'     => (string)$row['label'],
        ];
    }

    $cache[$factor] = $bands;

    return $bands;
}

function borrowing_attendance_band_for_days($conn, $days) {
    foreach (borrowing_score_bands($conn, 'attendance') as $band) {
        if ($band['threshold'] === null || (int)$days <= $band['threshold']) {
            return $band;
        }
    }

    return null;
}

function borrowing_attendance_choices($conn) {
    $choices = [];

    foreach (borrowing_score_bands($conn, 'attendance') as $band) {
        $choices[] = $band['label'];
    }

    return $choices;
}

function borrowing_commitment_choices($conn) {
    $choices = [];

    foreach (borrowing_score_bands($conn, 'commitment') as $band) {
        $choices[] = $band['label'];
    }

    return $choices;
}

function borrowing_band_score_for_label($conn, $factor, $label) {
    foreach (borrowing_score_bands($conn, $factor) as $band) {
        if ($band['label'] === $label) {
            return $band['score'];
        }
    }

    return null;
}

function borrowing_band_label_for_score($conn, $factor, $score) {
    foreach (borrowing_score_bands($conn, $factor) as $band) {
        if ((int)$band['score'] === (int)$score) {
            return $band['label'];
        }
    }

    return '';
}

function borrowing_completed_years($years) {
    return $years === null ? 0 : (int)floor($years);
}

function borrowing_years_points($conn, $years) {
    if ($years === null) {
        return 0;
    }

    $completed = borrowing_completed_years($years);

    foreach (borrowing_score_bands($conn, 'years_bonus') as $band) {
        if ($band['threshold'] !== null && $completed >= $band['threshold']) {
            return $band['score'];
        }
    }

    return 0;
}

function borrowing_years_bracket($conn, $years) {
    $brackets  = borrowing_score_bands($conn, 'years_bracket');
    $completed = borrowing_completed_years($years);

    foreach ($brackets as $band) {
        if ($band['threshold'] === null || $completed <= $band['threshold']) {
            return $band['index'];
        }
    }

    return count($brackets) > 0 ? $brackets[count($brackets) - 1]['index'] : 0;
}

function borrowing_years_bracket_labels($conn) {
    $labels = [];

    foreach (borrowing_score_bands($conn, 'years_bracket') as $band) {
        $labels[] = $band['label'];
    }

    return $labels;
}

function borrowing_matrix($conn) {
    static $cache = null;

    if ($cache !== null) {
        return $cache;
    }

    $cache  = [];
    $result = $conn->query(
        "SELECT score_min, score_max, grade_label, m0, m1, m2, m3, m4, f0, f1, f2, f3, f4, sort_order
         FROM borrowing_limit_matrix
         ORDER BY sort_order ASC"
    );

    while ($row = $result->fetch_assoc()) {
        $cache[] = [
            'scoreMin'    => (int)$row['score_min'],
            'scoreMax'    => (int)$row['score_max'],
            'grade'       => (string)$row['grade_label'],
            'multipliers' => [(float)$row['m0'], (float)$row['m1'], (float)$row['m2'], (float)$row['m3'], (float)$row['m4']],
            'flats'       => [(float)$row['f0'], (float)$row['f1'], (float)$row['f2'], (float)$row['f3'], (float)$row['f4']],
            'sortOrder'   => (int)$row['sort_order'],
        ];
    }

    return $cache;
}

function borrowing_matrix_row($conn, $score) {
    foreach (borrowing_matrix($conn) as $row) {
        if ($score >= $row['scoreMin'] && $score <= $row['scoreMax']) {
            return $row;
        }
    }

    return null;
}

function borrowing_grade($conn, $score) {
    $row = borrowing_matrix_row($conn, $score);

    return $row === null ? '' : $row['grade'];
}

function borrowing_ceiling($conn, $score, $years, $salary) {
    $row = borrowing_matrix_row($conn, $score);

    if ($row === null) {
        return ['amount' => 0.0, 'multiplier' => 0.0, 'flat' => 0.0, 'bracket' => 0];
    }

    $bracket    = borrowing_years_bracket($conn, $years);
    $multiplier = $row['multipliers'][$bracket] ?? 0.0;
    $flat       = $row['flats'][$bracket] ?? 0.0;
    $mode       = borrowing_setting($conn, 'ceiling_mode', 'salary_multiplier');

    if ($mode === 'flat_amount') {
        $amount = $flat;
    } elseif ($mode === 'lower_of_both') {
        $fromSalary = $multiplier * (float)$salary;
        $amount     = ($multiplier <= 0 || $flat <= 0) ? 0.0 : min($fromSalary, $flat);
    } else {
        $amount = $multiplier * (float)$salary;
    }

    return [
        'amount'     => borrowing_money($amount),
        'multiplier' => $multiplier,
        'flat'       => $flat,
        'bracket'    => $bracket,
    ];
}

function borrowing_employee($conn, $employeeCode) {
    $stmt = $conn->prepare(
        "SELECT employee_code, name_en, name_ar, position_en, departments, email,
                hire_date, basic_salary, attendance_band, attendance_days, attendance_year,
                commitment_band, commitment_year
         FROM staff_employees
         WHERE employee_code = ?"
    );
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

function borrowing_computed_commitment($conn, $employeeCode) {
    $stmt = $conn->prepare(
        "SELECT
             (SELECT COUNT(*) FROM borrowing_applications
               WHERE employee_code = ? AND status = 'approved') AS contracts,
             (SELECT COUNT(*) FROM borrowing_installments i
                JOIN borrowing_applications a ON a.id = i.application_id
               WHERE a.employee_code = ? AND i.status = 'skipped') AS skipped,
             (SELECT COUNT(*) FROM borrowing_installments i
                JOIN borrowing_applications a ON a.id = i.application_id
               WHERE a.employee_code = ? AND i.status = 'scheduled'
                 AND i.due_month < DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS overdue"
    );
    $stmt->bind_param("sss", $employeeCode, $employeeCode, $employeeCode);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $bands = borrowing_score_bands($conn, 'commitment');

    if ($bands === []) {
        return ['score' => 100, 'label' => '', 'detail' => 'No commitment bands are configured'];
    }

    $contracts = (int)($row['contracts'] ?? 0);
    $overdue   = (int)($row['overdue'] ?? 0);
    $lapses    = (int)($row['skipped'] ?? 0) + $overdue;

    if ($contracts === 0) {
        return ['score' => $bands[0]['score'], 'label' => $bands[0]['label'], 'detail' => 'No previous advances on record'];
    }

    if ($overdue > 0) {
        $band = $bands[count($bands) - 1];

        return ['score' => $band['score'], 'label' => $band['label'],
                'detail' => $overdue . ' installment' . ($overdue === 1 ? '' : 's') . ' past due and unpaid'];
    }

    $partialFrom = borrowing_setting_int($conn, 'late_installments_for_partial', 1);
    $poorFrom    = borrowing_setting_int($conn, 'late_installments_for_poor', 3);

    if ($lapses >= $poorFrom && isset($bands[2])) {
        return ['score' => $bands[2]['score'], 'label' => $bands[2]['label'],
                'detail' => $lapses . ' delayed installments across ' . $contracts . ' advance' . ($contracts === 1 ? '' : 's')];
    }

    if ($lapses >= $partialFrom && isset($bands[1])) {
        return ['score' => $bands[1]['score'], 'label' => $bands[1]['label'],
                'detail' => $lapses . ' delayed installment' . ($lapses === 1 ? '' : 's')];
    }

    return ['score' => $bands[0]['score'], 'label' => $bands[0]['label'],
            'detail' => $contracts . ' advance' . ($contracts === 1 ? '' : 's') . ' repaid without a delay'];
}

function borrowing_open_balance($conn, $employeeCode, $ignoreApplicationId = 0) {
    $stmt = $conn->prepare(
        "SELECT COALESCE(SUM(i.amount), 0) AS owed
         FROM borrowing_installments i
         JOIN borrowing_applications a ON a.id = i.application_id
         WHERE a.employee_code = ?
           AND a.status = 'approved'
           AND a.settled_at IS NULL
           AND a.id <> ?
           AND i.status = 'scheduled'"
    );
    $stmt->bind_param("si", $employeeCode, $ignoreApplicationId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return borrowing_money($row['owed'] ?? 0);
}


function borrowing_eligibility($conn, $employeeCode) {
    $employee = borrowing_employee($conn, $employeeCode);

    if ($employee === null) {
        return borrowing_error("That employee is not in the staff directory.", 404);
    }

    $contractYear = borrowing_contract_year($conn);
    $years        = borrowing_years_of_service($employee['hire_date']);
    $salary       = (float)$employee['basic_salary'];
    $missing      = [];

    if ($years === null) {
        $missing[] = 'a hire date';
    }

    if ($salary <= 0 && !borrowing_setting_is($conn, 'ceiling_mode', 'flat_amount')) {
        $missing[] = 'a basic salary';
    }

    $attendanceMode = borrowing_setting($conn, 'attendance_input_mode', 'bands');
    $attendanceUsable = false;
    $attendanceScore  = 0;
    $attendanceLabel  = '';
    $attendanceDetail = '';

    if ($attendanceMode === 'not_scored') {
        $attendanceUsable = true;
        $attendanceLabel  = 'Not scored';
        $attendanceDetail = 'The attendance factor is switched off';
    } elseif ((int)$employee['attendance_year'] !== $contractYear) {
        $missing[] = 'an attendance figure for this contract year';
    } elseif ($attendanceMode === 'exact_days') {
        $days = (int)$employee['attendance_days'];

        if ($days < 0) {
            $missing[] = 'an attendance figure for this contract year';
        } else {
            $band = borrowing_attendance_band_for_days($conn, $days);
            $attendanceUsable = $band !== null;
            $attendanceScore  = $band === null ? 0 : $band['score'];
            $attendanceLabel  = $band === null ? '' : $band['label'];
            $attendanceDetail = $days . ' day' . ($days === 1 ? '' : 's') . ' absent this contract year';
        }
    } else {
        $band = (int)$employee['attendance_band'];

        if ($band < 0) {
            $missing[] = 'an attendance figure for this contract year';
        } else {
            $attendanceUsable = true;
            $attendanceScore  = $band;
            $attendanceLabel  = borrowing_band_label_for_score($conn, 'attendance', $band);
            $attendanceDetail = 'Recorded on the ' . $contractYear . '/' . ($contractYear + 1) . ' contract year';
        }
    }

    $commitmentMode = borrowing_setting($conn, 'commitment_input_mode', 'computed');
    $commitment     = borrowing_computed_commitment($conn, $employeeCode);
    $storedBand     = (int)$employee['commitment_band'];
    $bandIsCurrent  = $storedBand >= 0 && (int)$employee['commitment_year'] === $contractYear;

    if ($commitmentMode === 'bands') {
        if (!$bandIsCurrent) {
            $missing[] = 'a repayment commitment band for this contract year';
        } else {
            $commitment = [
                'score'  => $storedBand,
                'label'  => borrowing_band_label_for_score($conn, 'commitment', $storedBand),
                'detail' => 'Selected on the application',
            ];
        }
    } elseif ($commitmentMode === 'computed_with_override' && $bandIsCurrent) {
        $commitment = [
            'score'  => $storedBand,
            'label'  => borrowing_band_label_for_score($conn, 'commitment', $storedBand),
            'detail' => 'Overriding the computed value of ' . $commitment['score'] . ' of 100',
        ];
    }

    $weightCommitment = borrowing_setting_int($conn, 'weight_commitment', 40);
    $weightAttendance = borrowing_setting_int($conn, 'weight_attendance', 40);
    $weightYears      = borrowing_setting_int($conn, 'weight_years', 20);

    if ($attendanceMode === 'not_scored') {
        $weightAttendance = 0;
    }

    $weightTotal = $weightCommitment + $weightAttendance + $weightYears;
    $scale       = $weightTotal > 0 ? 100 / $weightTotal : 0;

    $commitmentPoints = ($commitment['score'] / 100) * $weightCommitment * $scale;
    $attendancePoints = ($attendanceScore / 100) * $weightAttendance * $scale;
    $yearsPointsRaw   = borrowing_years_points($conn, $years);
    $yearsCeiling     = 0;

    foreach (borrowing_score_bands($conn, 'years_bonus') as $band) {
        $yearsCeiling = max($yearsCeiling, $band['score']);
    }

    $yearsPoints = $yearsCeiling > 0 ? ($yearsPointsRaw / $yearsCeiling) * $weightYears * $scale : 0;
    $scoringOn   = borrowing_setting_is($conn, 'scoring_enabled', 'yes');
    $score       = $scoringOn ? (int)round($commitmentPoints + $attendancePoints + $yearsPoints) : 100;

    $ceiling  = borrowing_ceiling($conn, $score, $years, $salary);
    $reasons  = [];
    $blocking = [];

    if ($missing !== []) {
        $reasons[] = 'This employee needs ' . borrowing_join_words($missing) . ' before an application can be scored.';

        $blocking[] = end($reasons);
    }

    if ($scoringOn && $missing === []) {
        $minScore = borrowing_setting_int($conn, 'min_score', 50);
        $minYears = borrowing_setting_int($conn, 'min_years_of_service', 0);

        if ($score < $minScore) {
            $reasons[] = 'The credit score of ' . $score . ' is below the minimum of ' . $minScore . '.';
        }

        if ($years !== null && $years < $minYears) {
            $reasons[] = 'Years of service, ' . $years . ', is below the minimum of ' . $minYears . '.';
        }

        if ($ceiling['amount'] <= 0) {
            $reasons[] = 'A score of ' . $score . ' with ' . ($years === null ? 'no' : $years)
                       . ' years of service allows no advance under the current limits.';
        }
    }

    $capacity = borrowing_capacity($conn, $employeeCode, $contractYear);

    foreach ($capacity['reasons'] as $reason) {
        $reasons[]  = $reason;
        $blocking[] = $reason;
    }

    if ($missing !== []) {
        $ceiling['amount']     = 0.0;
        $ceiling['multiplier'] = 0.0;
    }

    $available = $ceiling['amount'];

    if (borrowing_setting_is($conn, 'ceiling_counts_open_balance', 'yes')) {
        $available = max(0, borrowing_money($ceiling['amount'] - $capacity['openBalance']));

        if ($capacity['openBalance'] > 0 && $available <= 0 && $ceiling['amount'] > 0) {
            $reasons[] = 'An outstanding balance of ' . number_format($capacity['openBalance'], 2)
                       . ' EGP already uses the whole ceiling.';
        }
    }

    return [
        "success"      => true,
        "code"         => 200,
        "employee"     => [
            'employeeCode' => (string)$employee['employee_code'],
            'nameEn'       => (string)$employee['name_en'],
            'nameAr'       => (string)$employee['name_ar'],
            'position'     => (string)$employee['position_en'],
            'departments'  => (string)$employee['departments'],
            'email'        => (string)$employee['email'],
            'hireDate'     => (string)($employee['hire_date'] ?? ''),
            'salary'       => borrowing_money($salary),
            'years'        => $years,
        ],
        "contractYear" => $contractYear,
        "scoringOn"    => $scoringOn,
        "scoreable"    => $missing === [],
        "score"        => $score,
        "grade"        => borrowing_grade($conn, $score),
        "factors"      => [
            'commitment' => [
                'label'  => $commitment['label'],
                'detail' => $commitment['detail'],
                'raw'    => $commitment['score'],
                'points' => round($commitmentPoints, 1),
                'max'    => round($weightCommitment * $scale, 1),
                'mode'   => $commitmentMode,
                'recorded' => $commitmentMode !== 'bands' || $bandIsCurrent,
            ],
            'attendance' => [
                'label'  => $attendanceLabel,
                'detail' => $attendanceDetail,
                'raw'    => $attendanceScore,
                'points' => round($attendancePoints, 1),
                'max'    => round($weightAttendance * $scale, 1),
                'mode'   => $attendanceMode,
                'recorded' => $attendanceUsable,
            ],
            'years' => [
                'label'  => $years === null ? 'No hire date on file' : $years . ' years',
                'detail' => $years === null ? '' : 'Bracket: ' . (borrowing_years_bracket_labels($conn)[$ceiling['bracket']] ?? ''),
                'raw'    => $yearsPointsRaw,
                'points' => round($yearsPoints, 1),
                'max'    => round($weightYears * $scale, 1),
                'mode'   => 'computed',
                'recorded' => $years !== null,
            ],
        ],
        "multiplier"  => $ceiling['multiplier'],
        "maxAmount"   => $ceiling['amount'],
        "available"   => $available,
        "openBalance" => $capacity['openBalance'],
        "missing"     => $missing,
        "eligible"    => $reasons === [],
        "reasons"     => $reasons,
        "blocking"    => $blocking,
    ];
}

function borrowing_join_words($words) {
    if (count($words) === 1) {
        return $words[0];
    }

    $last = array_pop($words);

    return implode(', ', $words) . ' and ' . $last;
}

function borrowing_capacity($conn, $employeeCode, $contractYear) {
    $reasons = [];

    $stmt = $conn->prepare(
        "SELECT
            SUM(status = 'pending') AS pending,
            SUM(status = 'approved' AND contract_year = ?) AS approved_this_year,
            SUM(status = 'rejected' AND contract_year = ?) AS rejected_this_year,
            SUM(status = 'approved' AND settled_at IS NULL) AS running,
            MAX(CASE WHEN status = 'approved' AND settled_at IS NOT NULL THEN settled_at END) AS last_settled
         FROM borrowing_applications
         WHERE employee_code = ?"
    );
    $stmt->bind_param("iis", $contractYear, $contractYear, $employeeCode);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $pending  = (int)($row['pending'] ?? 0);
    $approved = (int)($row['approved_this_year'] ?? 0);
    $rejected = (int)($row['rejected_this_year'] ?? 0);
    $running  = (int)($row['running'] ?? 0);

    if ($pending > 0) {
        $reasons[] = 'An application for this employee is already waiting for a decision.';
    }

    $maxPerYear = borrowing_setting_int($conn, 'max_advances_per_year', 2);

    if ($maxPerYear > 0 && $approved >= $maxPerYear) {
        $reasons[] = 'This employee has already taken ' . $approved . ' advance'
                   . ($approved === 1 ? '' : 's') . ' this contract year, and the limit is ' . $maxPerYear . '.';
    }

    if ($rejected > 0 && borrowing_setting_is($conn, 'resubmit_rejected', 'no')) {
        $reasons[] = 'An application for this employee was rejected this contract year, and resubmission is switched off.';
    }

    if ($running > 0 && !borrowing_setting_is($conn, 'ceiling_counts_open_balance', 'yes')) {
        $reasons[] = 'This employee still has an advance being repaid.';
    }

    $waitMonths = borrowing_setting_int($conn, 'wait_months_between_advances', 3);

    if ($waitMonths > 0 && !empty($row['last_settled'])) {
        $eligibleFrom = borrowing_add_months($row['last_settled'], $waitMonths);

        if (strtotime($eligibleFrom) > time()) {
            $reasons[] = 'The waiting period after the last advance runs until ' . date('j F Y', strtotime($eligibleFrom)) . '.';
        }
    }

    return [
        'reasons'     => $reasons,
        'openBalance' => borrowing_open_balance($conn, $employeeCode),
        'running'     => $running,
        'pending'     => $pending,
    ];
}


function borrowing_split_amount($conn, $amount, $count) {
    $amount = borrowing_money($amount);
    $count  = max(1, (int)$count);
    $mode   = borrowing_setting($conn, 'installment_rounding', 'ceil');
    $exact  = $amount / $count;

    if ($mode === 'nearest') {
        $each = round($exact);
    } elseif ($mode === 'remainder_on_last') {
        $each = floor($exact);
    } else {
        $each = ceil($exact);
    }

    $each    = max(0, (float)$each);
    $amounts = array_fill(0, $count, borrowing_money($each));
    $last    = borrowing_money($amount - ($each * ($count - 1)));

    if ($last < 0) {
        $cents   = (int)round($amount * 100);
        $base    = intdiv($cents, $count);
        $extra   = $cents - ($base * $count);
        $amounts = [];

        for ($index = 0; $index < $count; $index++) {
            $amounts[] = borrowing_money(($base + ($index < $extra ? 1 : 0)) / 100);
        }

        return $amounts;
    }

    $amounts[$count - 1] = $last;

    return $amounts;
}

function borrowing_write_schedule($conn, $applicationId, $firstDueMonth, $amounts) {
    $stmt = $conn->prepare("DELETE FROM borrowing_installments WHERE application_id = ? AND status = 'scheduled'");
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("SELECT COALESCE(MAX(installment_number), 0) AS highest FROM borrowing_installments WHERE application_id = ?");
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $number = (int)($stmt->get_result()->fetch_assoc()['highest'] ?? 0);
    $stmt->close();

    $stmt = $conn->prepare(
        "INSERT INTO borrowing_installments (application_id, installment_number, due_month, amount, status, is_manual_amount)
         VALUES (?, ?, ?, ?, 'scheduled', ?)"
    );

    foreach ($amounts as $offset => $entry) {
        $number += 1;
        $amount  = is_array($entry) ? borrowing_money($entry['amount']) : borrowing_money($entry);
        $manual  = is_array($entry) && !empty($entry['manual']) ? 1 : 0;
        $dueMonth = is_array($entry) && !empty($entry['due_month'])
            ? borrowing_month_first($entry['due_month'])
            : borrowing_add_months($firstDueMonth, $offset);

        $stmt->bind_param("iisdi", $applicationId, $number, $dueMonth, $amount, $manual);
        $stmt->execute();
    }

    $stmt->close();
}

function borrowing_generate_schedule($conn, $applicationId, $amount, $count, $firstDueMonth, $customAmounts = null) {
    $amounts = $customAmounts !== null ? $customAmounts : borrowing_split_amount($conn, $amount, $count);

    borrowing_write_schedule($conn, $applicationId, $firstDueMonth, $amounts);
}

function borrowing_rebuild_schedule($conn, $applicationId) {
    $stmt = $conn->prepare(
        "SELECT approved_amount, installment_count, first_due_month, settled_at, status
         FROM borrowing_applications WHERE id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $application = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$application || $application['status'] !== 'approved' || $application['settled_at'] !== null) {
        return false;
    }

    $stmt = $conn->prepare(
        "SELECT COALESCE(SUM(CASE WHEN status IN ('paid', 'forgiven') THEN amount ELSE 0 END), 0) AS settled,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS remaining,
                MIN(CASE WHEN status = 'scheduled' THEN due_month END) AS next_due
         FROM borrowing_installments WHERE application_id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $totals = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $outstanding = borrowing_money((float)$application['approved_amount'] - (float)$totals['settled']);

    if ($outstanding <= 0 || (int)$totals['remaining'] === 0) {
        return false;
    }

    $maxInstallments = borrowing_setting_int($conn, 'max_installments', 10);
    $count           = min(max(1, (int)$totals['remaining']), max(1, $maxInstallments));
    $firstDue        = $totals['next_due'] ?: borrowing_month_first(date('Y-m-d'));

    borrowing_generate_schedule($conn, $applicationId, $outstanding, $count, $firstDue);

    return true;
}

const BORROWING_CONTRACT_SETTINGS = [
    'delay_effect',
    'max_delays_per_contract',
    'repayment_mode',
    'installment_rounding',
];

function borrowing_effective_settings($conn) {
    $effective = [];

    foreach (BORROWING_CONTRACT_SETTINGS as $key) {
        $effective[$key] = borrowing_setting($conn, $key);
    }

    return json_encode($effective);
}

function borrowing_stamp_effective_settings($conn, $applicationId) {
    $json = borrowing_effective_settings($conn);
    $stmt = $conn->prepare("UPDATE borrowing_applications SET effective_settings = ? WHERE id = ?");
    $stmt->bind_param("si", $json, $applicationId);
    $stmt->execute();
    $stmt->close();
}

function borrowing_contract_setting($conn, $applicationId, $key) {
    static $cache = [];

    if (!array_key_exists($applicationId, $cache)) {
        $stmt = $conn->prepare("SELECT effective_settings FROM borrowing_applications WHERE id = ?");
        $stmt->bind_param("i", $applicationId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $cache[$applicationId] = json_decode((string)($row['effective_settings'] ?? ''), true) ?: [];
    }

    return array_key_exists($key, $cache[$applicationId])
        ? $cache[$applicationId][$key]
        : borrowing_setting($conn, $key);
}

function borrowing_manual_ledger_allowed($conn, $applicationId = 0) {
    $mode = $applicationId > 0
        ? borrowing_contract_setting($conn, $applicationId, 'repayment_mode')
        : borrowing_setting($conn, 'repayment_mode');

    return $mode !== 'auto';
}

function borrowing_manual_ledger_refusal($conn) {
    return borrowing_error(
        "Instalments settle by their due date under the current repayment method, so they cannot be "
        . "recorded or corrected by hand. Switch the repayment method to allow corrections, or to manual."
    );
}

function borrowing_advance_ledger($conn, $applicationId = 0) {
    $liveMode = borrowing_setting($conn, 'repayment_mode');

    $sql = "UPDATE borrowing_installments i
            JOIN borrowing_applications a ON a.id = i.application_id
            SET i.status = 'paid', i.paid_at = NOW()
            WHERE i.status = 'scheduled'
              AND i.due_month < DATE_FORMAT(CURDATE(), '%Y-%m-01')
              AND COALESCE(JSON_VALUE(a.effective_settings, '$.repayment_mode'), ?) <> 'manual'";

    if ($applicationId > 0) {
        $sql .= " AND i.application_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $liveMode, $applicationId);
    } else {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $liveMode);
    }

    $stmt->execute();
    $moved = $stmt->affected_rows;
    $stmt->close();

    return $moved;
}

function borrowing_settle_completed($conn) {
    $conn->query(
        "UPDATE borrowing_applications a
         SET a.settled_at = NOW()
         WHERE a.status = 'approved'
           AND a.settled_at IS NULL
           AND NOT EXISTS (
               SELECT 1 FROM borrowing_installments i
               WHERE i.application_id = a.id AND i.status = 'scheduled'
           )
           AND EXISTS (
               SELECT 1 FROM borrowing_installments i WHERE i.application_id = a.id
           )"
    );

    return $conn->affected_rows;
}

function borrowing_ledger($conn, $applicationId) {
    $stmt = $conn->prepare(
        "SELECT approved_amount FROM borrowing_applications WHERE id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $borrowed = borrowing_money($stmt->get_result()->fetch_assoc()['approved_amount'] ?? 0);
    $stmt->close();

    $stmt = $conn->prepare(
        "SELECT
            COALESCE(SUM(CASE WHEN status = 'paid' AND due_month <> DATE_FORMAT(CURDATE(), '%Y-%m-01')
                              THEN amount ELSE 0 END), 0) AS repaid,
            COALESCE(SUM(CASE WHEN status = 'forgiven' THEN amount ELSE 0 END), 0) AS forgiven,
            COALESCE(SUM(CASE WHEN due_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
                              AND status IN ('scheduled', 'paid') THEN amount ELSE 0 END), 0) AS this_month,
            COALESCE(SUM(CASE WHEN due_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
                              AND status = 'skipped' THEN 1 ELSE 0 END), 0) AS this_month_skipped,
            COUNT(*) AS total_installments,
            COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS remaining
         FROM borrowing_installments
         WHERE application_id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $repaid    = borrowing_money($row['repaid'] ?? 0);
    $forgiven  = borrowing_money($row['forgiven'] ?? 0);
    $thisMonth = borrowing_money($row['this_month'] ?? 0);
    $skipped   = (int)($row['this_month_skipped'] ?? 0) > 0;

    return [
        'borrowed'    => $borrowed,
        'repaid'      => $repaid,
        'forgiven'    => $forgiven,
        'thisMonth'   => $skipped ? 0.0 : $thisMonth,
        'skipped'     => $skipped,
        'outstanding' => borrowing_money($borrowed - $repaid - $forgiven - ($skipped ? 0 : $thisMonth)),
        'remaining'   => (int)($row['remaining'] ?? 0),
        'total'       => (int)($row['total_installments'] ?? 0),
    ];
}

function borrowing_schedule_rows($conn, $applicationId) {
    $delayEffect = borrowing_contract_setting($conn, $applicationId, 'delay_effect');
    $stmt = $conn->prepare(
        "SELECT i.id, i.installment_number, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                i.amount, i.status, i.is_manual_amount,
                DATE_FORMAT(i.paid_at, '%Y-%m-%d %H:%i') AS paid_label, i.note,
                COALESCE(d.kind, '') AS pending_kind,
                COALESCE(d.requested_status, '') AS pending_status
         FROM borrowing_installments i
         LEFT JOIN borrowing_delay_requests d
                ON d.installment_id = i.id AND d.status = 'pending'
         WHERE i.application_id = ?
         ORDER BY i.due_month ASC, i.installment_number ASC"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'id'       => (int)$row['id'],
            'number'   => (int)$row['installment_number'],
            'dueMonth' => (string)$row['due_month'],
            'label'    => date('M Y', strtotime($row['due_month'])),
            'amount'   => borrowing_money($row['amount']),
            'status'   => (string)$row['status'],
            'statusLabel' => borrowing_installment_status_label((string)$row['status'], $delayEffect),
            'manual'   => (int)$row['is_manual_amount'] === 1,
            'paidAt'   => (string)($row['paid_label'] ?? ''),
            'note'     => (string)$row['note'],
            'pending'  => borrowing_request_label(
                (string)$row['pending_kind'], (string)$row['pending_status']
            ),
        ];
    }

    return $rows;
}

const BORROWING_CAPTURED_FIGURES = [
    'a hire date'                                 => 'hire_date_capture',
    'a basic salary'                              => 'salary_capture',
    'an attendance figure for this contract year' => 'attendance_capture',
];

function borrowing_capture_is_form($conn, $missingItem) {
    $key = BORROWING_CAPTURED_FIGURES[$missingItem] ?? null;

    return $key !== null && borrowing_setting_is($conn, $key, 'eligibility_form');
}

function borrowing_installment_status_label($status, $delayEffect = null) {
    if ($status === 'skipped') {
        if ($delayEffect === 'append') {
            return 'Moved to the end';
        }

        if ($delayEffect === 'spread') {
            return 'Spread over later months';
        }

        return 'Skipped';
    }

    $labels = [
        'scheduled' => 'Unpaid',
        'paid'      => 'Paid',
        'forgiven'  => 'Written off',
    ];

    return $labels[$status] ?? ucfirst((string)$status);
}

function borrowing_request_label($kind, $requestedStatus) {
    if ($kind === 'delay') {
        return 'Delay';
    }

    if ($kind === 'payment_correction') {
        return $requestedStatus === 'paid' ? 'Correction to paid' : 'Correction to unpaid';
    }

    return '';
}

function borrowing_approved_delay_count($conn, $applicationId) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS taken FROM borrowing_delay_requests
         WHERE application_id = ? AND kind = 'delay' AND status = 'approved'"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $taken = (int)($stmt->get_result()->fetch_assoc()['taken'] ?? 0);
    $stmt->close();

    return $taken;
}

function borrowing_apply_delay($conn, $applicationId, $installmentId) {
    $stmt = $conn->prepare(
        "SELECT id, amount, due_month, installment_number
         FROM borrowing_installments WHERE id = ? AND application_id = ?"
    );
    $stmt->bind_param("ii", $installmentId, $applicationId);
    $stmt->execute();
    $installment = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$installment) {
        return borrowing_error("That installment is not part of this contract.", 404);
    }

    $effect = borrowing_contract_setting($conn, $applicationId, 'delay_effect');
    $amount = borrowing_money($installment['amount']);

    if ($effect === 'forgive') {
        $stmt = $conn->prepare("UPDATE borrowing_installments SET status = 'forgiven' WHERE id = ?");
        $stmt->bind_param("i", $installmentId);
        $stmt->execute();
        $stmt->close();

        return ["success" => true, "effect" => 'forgive', "message" => 'The installment was forgiven.'];
    }

    $stmt = $conn->prepare("UPDATE borrowing_installments SET status = 'skipped' WHERE id = ?");
    $stmt->bind_param("i", $installmentId);
    $stmt->execute();
    $stmt->close();

    if ($effect === 'spread') {
        $stmt = $conn->prepare(
            "SELECT id FROM borrowing_installments
             WHERE application_id = ? AND status = 'scheduled' AND id <> ?
             ORDER BY due_month ASC"
        );
        $stmt->bind_param("ii", $applicationId, $installmentId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        $ids = [];

        while ($row = $result->fetch_assoc()) {
            $ids[] = (int)$row['id'];
        }

        if ($ids === []) {
            $stmt = $conn->prepare("UPDATE borrowing_installments SET status = 'scheduled' WHERE id = ?");
            $stmt->bind_param("i", $installmentId);
            $stmt->execute();
            $stmt->close();

            return borrowing_error("There are no later installments to spread this one across.");
        }

        $share     = borrowing_money($amount / count($ids));
        $remainder = borrowing_money($amount - ($share * count($ids)));
        $stmt      = $conn->prepare("UPDATE borrowing_installments SET amount = amount + ? WHERE id = ?");

        foreach ($ids as $position => $id) {
            $add = $position === 0 ? borrowing_money($share + $remainder) : $share;
            $stmt->bind_param("di", $add, $id);
            $stmt->execute();
        }

        $stmt->close();

        return ["success" => true, "effect" => 'spread',
                "message" => 'The installment was spread across the ' . count($ids) . ' months that follow.'];
    }

    $stmt = $conn->prepare(
        "SELECT COALESCE(MAX(installment_number), 0) AS highest,
                MAX(due_month) AS last_due
         FROM borrowing_installments WHERE application_id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $tail = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $number   = (int)$tail['highest'] + 1;
    $dueMonth = borrowing_add_months($tail['last_due'], 1);

    $stmt = $conn->prepare(
        "INSERT INTO borrowing_installments (application_id, installment_number, due_month, amount, status, note)
         VALUES (?, ?, ?, ?, 'scheduled', 'Added by an approved delay')"
    );
    $stmt->bind_param("iisd", $applicationId, $number, $dueMonth, $amount);
    $stmt->execute();
    $stmt->close();

    return ["success" => true, "effect" => 'append',
            "message" => 'The installment moved to ' . date('F Y', strtotime($dueMonth)) . '.'];
}

function borrowing_log_override($conn, $applicationId, $type, $oldValue, $newValue, $reason, $userId) {
    $stmt = $conn->prepare(
        "INSERT INTO borrowing_overrides (application_id, override_type, old_value, new_value, reason, created_by)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $old    = borrowing_trim($oldValue, 255);
    $new    = borrowing_trim($newValue, 255);
    $why    = borrowing_trim($reason, BORROWING_MAX_NOTE_LENGTH);
    $stmt->bind_param("issssi", $applicationId, $type, $old, $new, $why, $userId);
    $stmt->execute();
    $stmt->close();
}

function borrowing_overrides_for($conn, $applicationId) {
    $stmt = $conn->prepare(
        "SELECT o.override_type, o.old_value, o.new_value, o.reason,
                DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i') AS created_label,
                COALESCE(u.name, '') AS created_by_name
         FROM borrowing_overrides o
         LEFT JOIN admin_users u ON u.id = o.created_by
         WHERE o.application_id = ?
         ORDER BY o.id ASC"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $rows = [];

    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'type'      => (string)$row['override_type'],
            'oldValue'  => (string)$row['old_value'],
            'newValue'  => (string)$row['new_value'],
            'reason'    => (string)$row['reason'],
            'createdAt' => (string)$row['created_label'],
            'createdBy' => (string)$row['created_by_name'],
        ];
    }

    return $rows;
}


function borrowing_on_employee_removed($conn, $employeeCode) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS running FROM borrowing_applications
         WHERE employee_code = ? AND status = 'approved' AND settled_at IS NULL"
    );
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $running = (int)($stmt->get_result()->fetch_assoc()['running'] ?? 0);
    $stmt->close();

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS pending FROM borrowing_applications
         WHERE employee_code = ? AND status = 'pending'"
    );
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $pending = (int)($stmt->get_result()->fetch_assoc()['pending'] ?? 0);
    $stmt->close();

    if ($running === 0 && $pending === 0) {
        return ["success" => true, "message" => ""];
    }

    $mode = borrowing_setting($conn, 'on_employee_removed', 'freeze');

    if ($mode === 'keep_running') {
        return borrowing_error(
            "This employee still has " . $running . " advance" . ($running === 1 ? '' : 's')
            . " being repaid. The borrowing settings keep those running, so the employee record "
            . "cannot be deleted. Settle the advance first, or change what happens when an "
            . "employee is removed."
        );
    }

    if ($pending > 0) {
        $stmt = $conn->prepare(
            "UPDATE borrowing_applications
             SET status = 'rejected', decided_at = NOW(),
                 decision_note = 'Rejected automatically: the employee was removed from the staff directory'
             WHERE employee_code = ? AND status = 'pending'"
        );
        $stmt->bind_param("s", $employeeCode);
        $stmt->execute();
        $stmt->close();
    }

    if ($running > 0) {
        $newStatus = $mode === 'settle' ? 'forgiven' : 'skipped';
        $stmt = $conn->prepare(
            "UPDATE borrowing_installments i
             JOIN borrowing_applications a ON a.id = i.application_id
             SET i.status = ?,
                 i.note = CASE WHEN ? = 'forgiven'
                               THEN 'Written off: the employee was removed from the staff directory'
                               ELSE 'Frozen: the employee was removed from the staff directory' END
             WHERE a.employee_code = ? AND a.settled_at IS NULL AND i.status = 'scheduled'"
        );
        $stmt->bind_param("sss", $newStatus, $newStatus, $employeeCode);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare(
            "UPDATE borrowing_applications
             SET settled_at = NOW(),
                 decision_note = CONCAT(decision_note, ' · Closed: the employee was removed from the staff directory')
             WHERE employee_code = ? AND status = 'approved' AND settled_at IS NULL"
        );
        $stmt->bind_param("s", $employeeCode);
        $stmt->execute();
        $stmt->close();
    }

    return [
        "success" => true,
        "message" => $mode === 'settle'
            ? "Their outstanding advance was written off."
            : "Their outstanding advance was frozen and closed.",
    ];
}

function borrowing_editable_fields($targetType) {
    if ($targetType === 'application') {
        return [
            'approved_amount'   => ['label' => 'Approved amount', 'kind' => 'decimal'],
            'installment_count' => ['label' => 'Number of instalments', 'kind' => 'number'],
            'reason'            => ['label' => 'Reason', 'kind' => 'text'],
        ];
    }

    return [
        'hire_date'    => ['label' => 'Hire date', 'kind' => 'date'],
        'basic_salary' => ['label' => 'Basic salary', 'kind' => 'decimal'],
        'email'        => ['label' => 'Email address', 'kind' => 'text'],
    ];
}

function borrowing_queue_employee_change($conn, $employeeCode, $stored, $changes, $reason, $userId, $role) {
    $applied = [];
    $queued  = [];

    foreach ($changes as $field => $value) {
        if ($value === '' || $value === null) {
            continue;
        }

        $current = trim((string)($stored[$field] ?? ''));

        if ($field === 'basic_salary') {
            $matches = abs((float)$current - (float)$value) < 0.005;
        } else {
            $matches = $current === (string)$value;
        }

        if ($matches) {
            continue;
        }

        if ($current === '' || $current === '0' || $current === '0.00') {
            $applied[$field] = $value;
        } else {
            $queued[$field] = $value;
        }
    }

    if ($applied !== []) {
        borrowing_apply_edit_request($conn, 'employee', $employeeCode, $applied);
    }

    if ($queued !== []) {
        $stmt = $conn->prepare(
            "SELECT 1 FROM borrowing_edit_requests
             WHERE target_type = 'employee' AND target_key = ? AND status = 'pending'"
        );
        $stmt->bind_param("s", $employeeCode);
        $stmt->execute();
        $alreadyPending = $stmt->get_result()->num_rows > 0;
        $stmt->close();

        if ($alreadyPending) {
            return ['applied' => $applied, 'queued' => [], 'blocked' => true];
        }

        $changesJson = json_encode($queued);
        $stmt = $conn->prepare(
            "INSERT INTO borrowing_edit_requests
                (target_type, target_key, changes_json, reason, requested_by, requester_role)
             VALUES ('employee', ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssis", $employeeCode, $changesJson, $reason, $userId, $role);
        $stmt->execute();
        $stmt->close();
    }

    return ['applied' => $applied, 'queued' => $queued, 'blocked' => false];
}

function borrowing_edit_current_values($conn, $targetType, $targetKey, $fields) {
    $allowed = borrowing_editable_fields($targetType);
    $wanted  = array_values(array_intersect($fields, array_keys($allowed)));

    if ($wanted === []) {
        return [];
    }

    $columns = implode(', ', $wanted);

    if ($targetType === 'application') {
        $stmt = $conn->prepare("SELECT $columns FROM borrowing_applications WHERE id = ?");
        $id   = (int)$targetKey;
        $stmt->bind_param("i", $id);
    } else {
        $stmt = $conn->prepare("SELECT $columns FROM staff_employees WHERE employee_code = ?");
        $stmt->bind_param("s", $targetKey);
    }

    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $current = [];

    foreach ($wanted as $field) {
        $current[$field] = $row === null ? '' : (string)($row[$field] ?? '');
    }

    return $current;
}

function borrowing_apply_edit_request($conn, $targetType, $targetKey, $changes) {
    $allowed = borrowing_editable_fields($targetType);
    $sets    = [];
    $values  = [];
    $types   = '';

    foreach ($changes as $field => $value) {
        if (!isset($allowed[$field])) {
            continue;
        }

        $sets[]   = "`$field` = ?";
        $values[] = $value;
        $types   .= $allowed[$field]['kind'] === 'number' ? 'i'
                  : ($allowed[$field]['kind'] === 'decimal' ? 'd' : 's');
    }

    if ($sets === []) {
        return false;
    }

    if ($targetType === 'application') {
        $sql      = "UPDATE borrowing_applications SET " . implode(', ', $sets) . " WHERE id = ?";
        $values[] = (int)$targetKey;
        $types   .= 'i';
    } else {
        $sql      = "UPDATE staff_employees SET " . implode(', ', $sets) . " WHERE employee_code = ?";
        $values[] = (string)$targetKey;
        $types   .= 's';
    }

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();
    $stmt->close();

    if ($targetType === 'employee' && array_key_exists('attendance_band', $changes)) {
        $stmt = $conn->prepare("UPDATE staff_employees SET attendance_year = ? WHERE employee_code = ?");
        $year = borrowing_contract_year($conn);
        $stmt->bind_param("is", $year, $targetKey);
        $stmt->execute();
        $stmt->close();
    }

    return true;
}

function borrowing_email_rules($conn) {
    static $cache = null;

    if ($cache !== null) {
        return $cache;
    }

    $cache  = [];
    $result = $conn->query("SELECT event_key, recipient_key, is_enabled FROM borrowing_email_rules");

    while ($row = $result->fetch_assoc()) {
        $cache[$row['event_key']][$row['recipient_key']] = (int)$row['is_enabled'] === 1;
    }

    return $cache;
}

function borrowing_role_addresses($conn, $roleKey) {
    $permissions = [BORROWING_ROLE_PERMISSIONS[$roleKey] ?? ''];

    $placeholders = implode(',', array_fill(0, count($permissions), '?'));
    $types        = str_repeat('s', count($permissions));

    $stmt = $conn->prepare(
        "SELECT DISTINCT u.email
         FROM admin_users u
         JOIN admin_users_permissions_linker p ON p.admin_user_id = u.id
         WHERE p.permission_level_id IN ($placeholders)
           AND u.email IS NOT NULL AND u.email <> ''"
    );
    $stmt->bind_param($types, ...$permissions);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $addresses = [];

    while ($row = $result->fetch_assoc()) {
        if (filter_var($row['email'], FILTER_VALIDATE_EMAIL) !== false) {
            $addresses[] = $row['email'];
        }
    }

    if ($addresses === []) {
        $fallback = configured_email('borrowing-notifications');

        if ($fallback) {
            $addresses[] = $fallback;
        }
    }

    return $addresses;
}

function borrowing_send_email($toAddress, $subject, $bodyText) {
    if (empty($toAddress)) {
        return false;
    }

    $from = configured_email('admin-system-sender') ?: configured_email('system-sender');

    if (!$from) {
        return false;
    }

    $body = $bodyText . "\r\n\r\n"
        . "Best regards,\r\n"
        . "Harvest International School\r\n";

    $headers  = "From: Harvest Schools Borrowing System <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Auto-Response-Suppress: All\r\n";
    $headers .= "Auto-Submitted: auto-generated\r\n";

    return @mail($toAddress, $subject, $body, $headers, "-f {$from}");
}

function borrowing_notify($conn, $eventKey, $context) {
    if (!borrowing_setting_is($conn, 'emails_enabled', 'yes')) {
        return ['sent' => 0, 'skipped' => 'Notifications are switched off'];
    }

    $rules = borrowing_email_rules($conn);

    if (!isset($rules[$eventKey])) {
        return ['sent' => 0, 'skipped' => 'No rule for this event'];
    }

    $subject = (string)($context['subject'] ?? 'Harvest Schools borrowing system');
    $body    = (string)($context['body'] ?? '');
    $sent    = 0;
    $reached = [];

    foreach (BORROWING_EMAIL_RECIPIENTS as $recipientKey) {
        if (empty($rules[$eventKey][$recipientKey])) {
            continue;
        }

        if (!borrowing_setting_is($conn, 'emails_to_' . $recipientKey, 'yes')) {
            continue;
        }

        $addresses = $recipientKey === 'employee'
            ? array_filter([(string)($context['employeeEmail'] ?? '')])
            : borrowing_role_addresses($conn, $recipientKey);

        foreach ($addresses as $address) {
            if (filter_var($address, FILTER_VALIDATE_EMAIL) === false || in_array($address, $reached, true)) {
                continue;
            }

            $prefix = $recipientKey === 'employee' ? '' : "This is a notification for the "
                    . ucfirst($recipientKey) . " role.\r\n\r\n";

            if (borrowing_send_email($address, $subject, $prefix . $body)) {
                $reached[] = $address;
                $sent += 1;
            }
        }
    }

    return ['sent' => $sent, 'recipients' => $reached];
}

function borrowing_notification_already_sent($conn, $eventKey, $targetKey, $day) {
    $stmt = $conn->prepare(
        "SELECT 1 FROM borrowing_notification_log WHERE event_key = ? AND target_key = ? AND sent_on = ?"
    );
    $stmt->bind_param("sss", $eventKey, $targetKey, $day);
    $stmt->execute();
    $found = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    return $found;
}

function borrowing_record_notification($conn, $eventKey, $targetKey, $day, $recipients) {
    $stmt = $conn->prepare(
        "INSERT IGNORE INTO borrowing_notification_log (event_key, target_key, sent_on, recipients)
         VALUES (?, ?, ?, ?)"
    );
    $list = borrowing_trim(implode(', ', $recipients), 500);
    $stmt->bind_param("ssss", $eventKey, $targetKey, $day, $list);
    $stmt->execute();
    $stmt->close();
}


function borrowing_sweep_notifications($conn) {
    $today = date('Y-m-d');

    borrowing_advance_ledger($conn);
    borrowing_settle_completed($conn);

    if (!borrowing_setting_is($conn, 'emails_enabled', 'yes')) {
        return ['due' => 0, 'overdue' => 0, 'settled' => 0, 'skipped' => 'Notifications are switched off'];
    }

    $counts = ['due' => 0, 'overdue' => 0, 'settled' => 0];

    $result = $conn->query(
        "SELECT i.id, i.amount, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                a.id AS application_id, a.approved_amount,
                e.name_en, e.email
         FROM borrowing_installments i
         JOIN borrowing_applications a ON a.id = i.application_id
         JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE i.status = 'scheduled'
           AND i.due_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')"
    );

    while ($row = $result->fetch_assoc()) {
        $targetKey = 'installment-' . $row['id'];

        if (borrowing_notification_already_sent($conn, 'installment_due', $targetKey, $today)) {
            continue;
        }

        $ledger = borrowing_ledger($conn, (int)$row['application_id']);
        $sent   = borrowing_notify($conn, 'installment_due', [
            'employeeEmail' => $row['email'],
            'subject'       => 'Salary advance instalment due this month',
            'body'          => $row['name_en'] . ",\r\n\r\n"
                . "An instalment of " . number_format((float)$row['amount'], 2) . " EGP on your salary advance "
                . "is due in " . date('F Y', strtotime($row['due_month'])) . ".\r\n\r\n"
                . "Advance total: " . number_format($ledger['borrowed'], 2) . " EGP\r\n"
                . "Repaid so far: " . number_format($ledger['repaid'], 2) . " EGP\r\n"
                . "Outstanding after this month: " . number_format($ledger['outstanding'], 2) . " EGP",
        ]);

        borrowing_record_notification($conn, 'installment_due', $targetKey, $today, $sent['recipients'] ?? []);
        $counts['due'] += 1;
    }

    $overdueAfter = borrowing_setting_int($conn, 'overdue_after_days', 5);
    $stmt = $conn->prepare(
        "SELECT i.id, i.amount, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                a.id AS application_id, e.name_en, e.email
         FROM borrowing_installments i
         JOIN borrowing_applications a ON a.id = i.application_id
         JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE i.status = 'scheduled'
           AND i.due_month < DATE_FORMAT(CURDATE(), '%Y-%m-01')
           AND DATEDIFF(CURDATE(), LAST_DAY(i.due_month)) >= ?"
    );
    $stmt->bind_param("i", $overdueAfter);
    $stmt->execute();
    $overdue = $stmt->get_result();
    $stmt->close();

    while ($row = $overdue->fetch_assoc()) {
        $targetKey = 'installment-' . $row['id'];

        if (borrowing_notification_already_sent($conn, 'installment_overdue', $targetKey, $today)) {
            continue;
        }

        $sent = borrowing_notify($conn, 'installment_overdue', [
            'employeeEmail' => $row['email'],
            'subject'       => 'Salary advance instalment overdue',
            'body'          => $row['name_en'] . ",\r\n\r\n"
                . "The instalment of " . number_format((float)$row['amount'], 2) . " EGP due in "
                . date('F Y', strtotime($row['due_month'])) . " has not been recorded as paid.\r\n\r\n"
                . "Please contact the accounting department if this is not correct.",
        ]);

        borrowing_record_notification($conn, 'installment_overdue', $targetKey, $today, $sent['recipients'] ?? []);
        $counts['overdue'] += 1;
    }

    $settled = $conn->query(
        "SELECT a.id, e.name_en, e.email, a.approved_amount
         FROM borrowing_applications a
         JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE a.settled_at IS NOT NULL AND a.settled_at >= NOW() - INTERVAL 2 DAY"
    );

    while ($row = $settled->fetch_assoc()) {
        $targetKey = 'application-' . $row['id'];

        if (borrowing_notification_already_sent($conn, 'contract_settled', $targetKey, $today)) {
            continue;
        }

        $sent = borrowing_notify($conn, 'contract_settled', [
            'employeeEmail' => $row['email'],
            'subject'       => 'Salary advance fully repaid',
            'body'          => $row['name_en'] . ",\r\n\r\n"
                . "Your salary advance of " . number_format((float)$row['approved_amount'], 2)
                . " EGP has been repaid in full. Nothing further will be deducted.",
        ]);

        borrowing_record_notification($conn, 'contract_settled', $targetKey, $today, $sent['recipients'] ?? []);
        $counts['settled'] += 1;
    }

    return $counts;
}
