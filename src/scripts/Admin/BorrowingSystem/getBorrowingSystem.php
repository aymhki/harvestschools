<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/borrowingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $authorisation = borrowing_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    borrowing_advance_ledger($conn);
    borrowing_settle_completed($conn);

    $contractYear = borrowing_contract_year($conn);
    $data = [
        "capabilities"      => $authorisation['capabilities'],
        "roles"             => $authorisation['roles'],
        "isMaster"          => $authorisation['isMaster'],
        "contractYear"      => $contractYear,
        "contractYearLabel" => borrowing_contract_year_label($conn, $contractYear),
        "maxInstallments"   => borrowing_setting_int($conn, 'max_installments', 10),
        "hardMaxInstallments" => BORROWING_HARD_MAX_INSTALLMENTS,
        "minAmount"         => borrowing_setting_float($conn, 'min_amount', 0),
        "maxDelays"         => borrowing_setting_int($conn, 'max_delays_per_contract', 3),
        "repaymentMode"     => borrowing_setting($conn, 'repayment_mode', 'auto'),
        "attendanceMode"    => borrowing_setting($conn, 'attendance_input_mode', 'bands'),
        "attendanceCapture" => borrowing_setting($conn, 'attendance_capture', 'eligibility_form'),
        "salaryCapture"     => borrowing_setting($conn, 'salary_capture', 'eligibility_form'),
        "hireDateCapture"   => borrowing_setting($conn, 'hire_date_capture', 'from_database'),
        "commitmentMode"    => borrowing_setting($conn, 'commitment_input_mode', 'computed'),
        "delayEffect"       => borrowing_setting($conn, 'delay_effect', 'append'),
        "settingsApplyTo"   => borrowing_setting($conn, 'settings_apply_to', 'ask'),
        "allowFirstMonth"   => borrowing_setting_is($conn, 'allow_manual_first_month', 'yes'),
        "allowAboveLimit"   => borrowing_setting_is($conn, 'allow_applying_above_limit', 'yes'),
        "attendanceChoices" => borrowing_attendance_choices($conn),
        "commitmentChoices" => borrowing_commitment_choices($conn),
    ];

    if (borrowing_can($authorisation, 'view_scores') || borrowing_can($authorisation, 'submit_application')
        || borrowing_can($authorisation, 'submit_edit_request')) {
        $result = $conn->query(
            "SELECT employee_code, name_en, position_en, email, hire_date, basic_salary,
                    attendance_band, attendance_days, attendance_year
             FROM staff_employees
             ORDER BY name_en ASC"
        );

        $choices = [];
        $index   = [];

        while ($row = $result->fetch_assoc()) {
            $label = $row['name_en'] . ' · ' . $row['employee_code'];
            $choices[] = $label;
            $index[$label] = [
                'code'      => (string)$row['employee_code'],
                'name'      => (string)$row['name_en'],
                'position'  => (string)$row['position_en'],
                'hasEmail'  => trim((string)$row['email']) !== '',
                'hasHire'   => !empty($row['hire_date']),
                'hasSalary' => (float)$row['basic_salary'] > 0,
                'hasBand'   => (int)$row['attendance_year'] === $contractYear,
                'band'      => (int)$row['attendance_year'] === $contractYear
                    ? borrowing_band_label_for_score($conn, 'attendance', (int)$row['attendance_band'])
                    : '',
                'days'      => (int)$row['attendance_year'] === $contractYear && (int)$row['attendance_days'] >= 0
                    ? (string)$row['attendance_days'] : '',
            ];
        }

        $data['employeeChoices'] = $choices;
        $data['employeeIndex']   = $index;
    }

    if (borrowing_can($authorisation, 'view_applications')) {
        $headers = ["ID", "Employee", "Position", "Year", "Amount", "Instalments", "Score", "Grade",
                    "Status", "Exception", "Submitted By", "Submitted", "Decided", "Application ID"];
        $rows = [];

        $result = $conn->query(
            "SELECT a.id, a.employee_code, a.contract_year, a.requested_amount, a.approved_amount,
                    a.installment_count, a.snap_score, a.snap_grade, a.status,
                    DATE_FORMAT(a.submitted_at, '%Y-%m-%d %H:%i') AS submitted_label,
                    DATE_FORMAT(a.decided_at, '%Y-%m-%d %H:%i') AS decided_label,
                    a.settled_at,
                    e.name_en, e.position_en,
                    COALESCE(su.name, '') AS submitted_by_name,
                    (SELECT COUNT(*) FROM borrowing_overrides o WHERE o.application_id = a.id) AS override_count
             FROM borrowing_applications a
             LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
             LEFT JOIN admin_users su ON su.id = a.submitted_by
             ORDER BY a.id DESC"
        );

        while ($row = $result->fetch_assoc()) {
            $status = (string)$row['status'];

            if ($status === 'approved') {
                $status = $row['settled_at'] === null ? 'Approved · repaying' : 'Approved · settled';
            } else {
                $status = ucfirst($status);
            }

            $amount = (float)$row['approved_amount'] > 0
                ? (float)$row['approved_amount']
                : (float)$row['requested_amount'];

            $rows[] = [
                (string)$row['id'],
                (string)$row['name_en'],
                (string)$row['position_en'],
                (string)$row['contract_year'],
                number_format($amount, 2, '.', ''),
                (string)$row['installment_count'],
                (string)$row['snap_score'],
                (string)$row['snap_grade'],
                $status,
                (int)$row['override_count'] > 0 ? 'Yes' : 'No',
                (string)$row['submitted_by_name'],
                (string)$row['submitted_label'],
                (string)($row['decided_label'] ?? ''),
                (string)$row['id'],
            ];
        }

        $data['applications'] = array_merge([$headers], $rows);
    }

    if (borrowing_can($authorisation, 'submit_delay') || borrowing_can($authorisation, 'review_delay')
        || borrowing_can($authorisation, 'correct_payment')) {
        $headers = ["ID", "Type", "Employee", "Instalment", "Amount", "Instalment Now", "Reason",
                    "Status", "Beyond Cap", "Requested By", "Requested", "Request ID", "Effect"];
        $rows = [];

        $result = $conn->query(
            "SELECT d.id, d.application_id, d.kind, d.requested_status, d.reason, d.status, d.over_cap,
                    DATE_FORMAT(d.requested_at, '%Y-%m-%d %H:%i') AS requested_label,
                    i.amount, i.status AS installment_status,
                    DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                    e.name_en, COALESCE(ru.name, '') AS requested_by_name
             FROM borrowing_delay_requests d
             LEFT JOIN borrowing_installments i ON i.id = d.installment_id
             LEFT JOIN borrowing_applications a ON a.id = d.application_id
             LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
             LEFT JOIN admin_users ru ON ru.id = d.requested_by
             ORDER BY d.id DESC"
        );

        while ($row = $result->fetch_assoc()) {
            $rows[] = [
                (string)$row['id'],
                borrowing_request_label((string)$row['kind'], (string)$row['requested_status']),
                (string)$row['name_en'],
                $row['due_month'] ? date('M Y', strtotime($row['due_month'])) : '',
                number_format((float)$row['amount'], 2, '.', ''),
                borrowing_installment_status_label((string)$row['installment_status']),
                (string)$row['reason'],
                ucfirst((string)$row['status']),
                (int)$row['over_cap'] === 1 ? 'Yes' : 'No',
                (string)$row['requested_by_name'],
                (string)$row['requested_label'],
                (string)$row['id'],
                borrowing_contract_setting($conn, (int)$row['application_id'], 'delay_effect'),
            ];
        }

        $data['delayRequests'] = array_merge([$headers], $rows);
    }

    if (borrowing_can($authorisation, 'view_database')) {
        $headers = ["Employee", "Position", "Borrowed", "Repaid to Date", "This Month",
                    "Forgiven", "Outstanding", "Months Left", "Status", "Contact", "Application ID"];
        $rows = [];

        $result = $conn->query(
            "SELECT a.id, a.approved_amount, a.settled_at, e.name_en, e.position_en, e.email,
                    COALESCE(SUM(CASE WHEN i.status = 'paid'
                                       AND i.due_month <> DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                      THEN i.amount ELSE 0 END), 0) AS repaid,
                    COALESCE(SUM(CASE WHEN i.status = 'forgiven' THEN i.amount ELSE 0 END), 0) AS forgiven,
                    COALESCE(SUM(CASE WHEN i.due_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
                                       AND i.status IN ('scheduled', 'paid')
                                      THEN i.amount ELSE 0 END), 0) AS this_month,
                    MAX(CASE WHEN i.due_month = DATE_FORMAT(CURDATE(), '%Y-%m-01')
                              AND i.status = 'skipped' THEN 1 ELSE 0 END) AS this_month_skipped,
                    COUNT(CASE WHEN i.status = 'scheduled' THEN 1 END) AS remaining
             FROM borrowing_applications a
             LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
             LEFT JOIN borrowing_installments i ON i.application_id = a.id
             WHERE a.status = 'approved'
             GROUP BY a.id, a.approved_amount, a.settled_at, e.name_en, e.position_en, e.email
             ORDER BY a.settled_at IS NOT NULL ASC, a.id DESC"
        );

        while ($row = $result->fetch_assoc()) {
            $skipped     = (int)$row['this_month_skipped'] === 1;
            $borrowed    = (float)$row['approved_amount'];
            $repaid      = (float)$row['repaid'];
            $forgiven    = (float)$row['forgiven'];
            $thisMonth   = $skipped ? 0.0 : (float)$row['this_month'];
            $outstanding = round($borrowed - $repaid - $forgiven - $thisMonth, 2);

            $rows[] = [
                (string)$row['name_en'],
                (string)$row['position_en'],
                number_format($borrowed, 2, '.', ''),
                number_format($repaid, 2, '.', ''),
                $skipped ? 'Skipped' : number_format($thisMonth, 2, '.', ''),
                number_format($forgiven, 2, '.', ''),
                number_format($outstanding, 2, '.', ''),
                (string)$row['remaining'],
                $row['settled_at'] === null ? 'Repaying' : 'Settled',
                trim((string)$row['email']) === '' ? 'No address on file' : (string)$row['email'],
                (string)$row['id'],
            ];
        }

        $data['ledger'] = array_merge([$headers], $rows);
    }

    if (borrowing_can($authorisation, 'submit_edit_request') || borrowing_can($authorisation, 'review_edit_request')) {
        $headers = ["ID", "Target", "Subject", "Fields", "Requested By", "Role", "Status", "Requested", "Request ID"];
        $rows = [];

        $result = $conn->query(
            "SELECT r.id, r.target_type, r.target_key, r.changes_json, r.requester_role, r.status,
                    DATE_FORMAT(r.requested_at, '%Y-%m-%d %H:%i') AS requested_label,
                    COALESCE(ru.name, '') AS requested_by_name,
                    COALESCE(e.name_en, '') AS employee_name
             FROM borrowing_edit_requests r
             LEFT JOIN admin_users ru ON ru.id = r.requested_by
             LEFT JOIN staff_employees e ON e.employee_code = r.target_key AND r.target_type = 'employee'
             ORDER BY r.id DESC"
        );

        while ($row = $result->fetch_assoc()) {
            $changes = json_decode((string)$row['changes_json'], true) ?: [];
            $labels  = borrowing_editable_fields((string)$row['target_type']);
            $named   = array_map(
                fn($field) => $labels[$field]['label'] ?? $field,
                array_keys($changes)
            );

            $rows[] = [
                (string)$row['id'],
                ucfirst((string)$row['target_type']),
                $row['employee_name'] !== '' ? (string)$row['employee_name'] : (string)$row['target_key'],
                implode(', ', $named),
                (string)$row['requested_by_name'],
                ucfirst((string)$row['requester_role']),
                ucfirst((string)$row['status']),
                (string)$row['requested_label'],
                (string)$row['id'],
            ];
        }

        $data['editRequests'] = array_merge([$headers], $rows);
    }

    if (borrowing_can($authorisation, 'edit_policy')) {
        $headers = ["Setting", "Value", "Choices", "Group", "What it changes", "Key"];
        $rows = [];

        foreach (borrowing_settings($conn, true) as $key => $setting) {
            $rows[] = [
                ucfirst(str_replace('_', ' ', $key)),
                (string)$setting['setting_value'],
                (string)$setting['options'],
                ucfirst((string)$setting['setting_group']),
                (string)$setting['description'],
                (string)$key,
            ];
        }

        $data['settings'] = array_merge([$headers], $rows);

        $bracketLabels = borrowing_years_bracket_labels($conn);
        $headers = array_merge(
            ["Score Range", "Grade"],
            array_map(fn($label) => 'x ' . $label, $bracketLabels),
            array_map(fn($label) => 'Flat ' . $label, $bracketLabels),
            ["Score Min"]
        );
        $rows = [];

        foreach (borrowing_matrix($conn) as $row) {
            $rows[] = array_merge(
                [$row['scoreMin'] . ' – ' . $row['scoreMax'], $row['grade']],
                array_map(fn($value) => number_format($value, 2, '.', ''), $row['multipliers']),
                array_map(fn($value) => number_format($value, 2, '.', ''), $row['flats']),
                [(string)$row['scoreMin']]
            );
        }

        $data['matrix'] = array_merge([$headers], $rows);

        $headers = ["Factor", "Band", "Threshold", "Score", "Label", "Key"];
        $rows = [];

        foreach (['attendance', 'commitment', 'years_bonus', 'years_bracket'] as $factor) {
            foreach (borrowing_score_bands($conn, $factor) as $band) {
                $rows[] = [
                    ucfirst(str_replace('_', ' ', $factor)),
                    (string)$band['index'],
                    $band['threshold'] === null ? 'and above' : (string)$band['threshold'],
                    (string)$band['score'],
                    (string)$band['label'],
                    $factor . ':' . $band['index'],
                ];
            }
        }

        $data['scoreBands'] = array_merge([$headers], $rows);

        $headers = ["Capability", "Human Resources", "Accounting", "Board", "Key"];
        $granted = [];
        $result  = $conn->query("SELECT role_key, capability_key, is_enabled FROM borrowing_role_capabilities");

        while ($row = $result->fetch_assoc()) {
            $granted[$row['capability_key']][$row['role_key']] = (int)$row['is_enabled'] === 1;
        }

        $rows = [];

        foreach (BORROWING_CAPABILITIES as $capability) {
            $rows[] = [
                str_replace('_', ' ', $capability),
                !empty($granted[$capability]['hr']) ? 'Yes' : 'No',
                !empty($granted[$capability]['accounting']) ? 'Yes' : 'No',
                !empty($granted[$capability]['board']) ? 'Yes' : 'No',
                $capability,
            ];
        }

        $data['roleCapabilities'] = array_merge([$headers], $rows);

        $headers = ["Event", "Employee", "Human Resources", "Accounting", "Board", "Key"];
        $rules   = borrowing_email_rules($conn);
        $rows    = [];

        foreach (BORROWING_EMAIL_EVENTS as $event) {
            $rows[] = [
                ucfirst(str_replace('_', ' ', $event)),
                !empty($rules[$event]['employee']) ? 'Yes' : 'No',
                !empty($rules[$event]['hr']) ? 'Yes' : 'No',
                !empty($rules[$event]['accounting']) ? 'Yes' : 'No',
                !empty($rules[$event]['board']) ? 'Yes' : 'No',
                $event,
            ];
        }

        $data['emailRules'] = array_merge([$headers], $rows);

        $result = $conn->query(
            "SELECT COUNT(*) AS running FROM borrowing_applications
             WHERE status = 'approved' AND settled_at IS NULL"
        );
        $data['runningContracts'] = (int)($result->fetch_assoc()['running'] ?? 0);
    }

    $requestedApplication = (int)($_GET['application'] ?? 0);

    if ($requestedApplication > 0 && borrowing_can($authorisation, 'view_applications')) {
        $stmt = $conn->prepare(
            "SELECT a.*, e.name_en, e.name_ar, e.position_en, e.email, e.hire_date,
                    COALESCE(su.name, '') AS submitted_by_name,
                    COALESCE(du.name, '') AS decided_by_name
             FROM borrowing_applications a
             LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
             LEFT JOIN admin_users su ON su.id = a.submitted_by
             LEFT JOIN admin_users du ON du.id = a.decided_by
             WHERE a.id = ?"
        );
        $stmt->bind_param("i", $requestedApplication);
        $stmt->execute();
        $application = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($application) {
            $data['application'] = [
                'id'               => (int)$application['id'],
                'employeeCode'     => (string)$application['employee_code'],
                'employeeName'     => (string)$application['name_en'],
                'employeeEmail'    => (string)$application['email'],
                'position'         => (string)$application['position_en'],
                'contractYear'     => (int)$application['contract_year'],
                'requestedAmount'  => borrowing_money($application['requested_amount']),
                'approvedAmount'   => borrowing_money($application['approved_amount']),
                'installmentCount' => (int)$application['installment_count'],
                'firstDueMonth'    => (string)($application['first_due_month'] ?? ''),
                'reason'           => (string)$application['reason'],
                'score'            => (int)$application['snap_score'],
                'grade'            => (string)$application['snap_grade'],
                'salary'           => borrowing_money($application['snap_salary']),
                'years'            => (float)$application['snap_years'],
                'multiplier'       => (float)$application['snap_multiplier'],
                'maxAmount'        => borrowing_money($application['snap_max_amount']),
                'wasEligible'      => (int)$application['snap_eligible'] === 1,
                'aboveCeiling'     => borrowing_money($application['requested_amount'])
                    > borrowing_money($application['snap_max_amount']),
                'status'           => (string)$application['status'],
                'submittedBy'      => (string)$application['submitted_by_name'],
                'decidedBy'        => (string)$application['decided_by_name'],
                'decisionNote'     => (string)$application['decision_note'],
                'settled'          => $application['settled_at'] !== null,
                'delaysTaken'      => borrowing_approved_delay_count($conn, (int)$application['id']),
                'schedule'         => borrowing_schedule_rows($conn, (int)$application['id']),
                'ledger'           => borrowing_ledger($conn, (int)$application['id']),
                'overrides'        => borrowing_overrides_for($conn, (int)$application['id']),
                'snapshot'         => json_decode((string)$application['snapshot_json'], true) ?: [],
            ];
        }
    }

    $requestedEdit = (int)($_GET['editRequest'] ?? 0);

    if ($requestedEdit > 0 && (borrowing_can($authorisation, 'review_edit_request')
        || borrowing_can($authorisation, 'submit_edit_request'))) {
        $stmt = $conn->prepare(
            "SELECT r.*, COALESCE(ru.name, '') AS requested_by_name, COALESCE(du.name, '') AS decided_by_name
             FROM borrowing_edit_requests r
             LEFT JOIN admin_users ru ON ru.id = r.requested_by
             LEFT JOIN admin_users du ON du.id = r.decided_by
             WHERE r.id = ?"
        );
        $stmt->bind_param("i", $requestedEdit);
        $stmt->execute();
        $editRequest = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($editRequest) {
            $changes = json_decode((string)$editRequest['changes_json'], true) ?: [];
            $current = borrowing_edit_current_values($conn, $editRequest['target_type'], $editRequest['target_key'], array_keys($changes));

            $data['editRequest'] = [
                'id'          => (int)$editRequest['id'],
                'targetType'  => (string)$editRequest['target_type'],
                'targetKey'   => (string)$editRequest['target_key'],
                'reason'      => (string)$editRequest['reason'],
                'status'      => (string)$editRequest['status'],
                'requestedBy' => (string)$editRequest['requested_by_name'],
                'decidedBy'   => (string)$editRequest['decided_by_name'],
                'note'        => (string)$editRequest['decision_note'],
                'changes'     => $changes,
                'current'     => $current,
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code"    => 200,
        "data"    => $data,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
