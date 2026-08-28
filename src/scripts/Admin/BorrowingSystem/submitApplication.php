<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/borrowingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
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

    $denied = borrowing_require($authorisation, 'submit_application');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $employeeCode = borrowing_trim($data['employee_code'] ?? '', 32);
    $employee     = borrowing_employee($conn, $employeeCode);

    if ($employee === null) {
        echo json_encode(borrowing_error("That employee is not in the staff directory.", 404));
        exit;
    }

    $proposed = [];
    $hireDate = borrowing_valid_date($data['hire_date'] ?? '');

    if ($hireDate !== null) {
        $proposed['hire_date'] = $hireDate;
    }

    if (is_numeric($data['basic_salary'] ?? null)) {
        $proposed['basic_salary'] = borrowing_money($data['basic_salary']);
    }

    $typedEmail = borrowing_trim($data['email'] ?? '', 255);

    if ($typedEmail !== '') {
        if (!filter_var($typedEmail, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(borrowing_error("Enter a valid email address for the employee, or leave it blank."));
            exit;
        }

        $proposed['email'] = $typedEmail;
    }

    $changeOutcome = borrowing_queue_employee_change(
        $conn, $employeeCode, $employee, $proposed,
        borrowing_trim($data['reason'] ?? '', BORROWING_MAX_REASON_LENGTH) ?: 'Submitted with a borrowing application',
        $authorisation['user_id'], borrowing_primary_role($authorisation)
    );

    if ($changeOutcome['blocked']) {
        echo json_encode(borrowing_error(
            "A change to this employee's record is already waiting for a decision. "
            . "That has to be settled before another is raised."
        ));
        exit;
    }

    $employee = borrowing_employee($conn, $employeeCode);
    $mode         = borrowing_setting($conn, 'attendance_input_mode', 'bands');
    $contractYear = borrowing_contract_year($conn);
    $commitmentMode = borrowing_setting($conn, 'commitment_input_mode', 'computed');

    if ($commitmentMode !== 'computed') {
        $label = borrowing_trim($data['commitment_band'] ?? '', 120);

        if ($label !== '') {
            $score = borrowing_band_score_for_label($conn, 'commitment', $label);

            if ($score === null) {
                echo json_encode(borrowing_error("Choose one of the repayment commitment bands."));
                exit;
            }

            $stmt = $conn->prepare(
                "UPDATE staff_employees SET commitment_band = ?, commitment_year = ? WHERE employee_code = ?"
            );
            $stmt->bind_param("iis", $score, $contractYear, $employeeCode);
            $stmt->execute();
            $stmt->close();
        }
    }

    $eligibility = borrowing_eligibility($conn, $employeeCode);

    if (!$eligibility['success']) {
        echo json_encode($eligibility);
        exit;
    }

    if ($eligibility['blocking'] !== []) {
        echo json_encode(borrowing_error(implode(' ', $eligibility['blocking'])));
        exit;
    }

    if (!$eligibility['eligible'] && !borrowing_setting_is($conn, 'allow_applying_when_ineligible', 'yes')) {
        echo json_encode(borrowing_error(implode(' ', $eligibility['reasons'])));
        exit;
    }

    $amount = is_numeric($data['amount'] ?? null) ? borrowing_money($data['amount']) : -1;

    if ($amount <= 0) {
        echo json_encode(borrowing_error("Enter the amount requested."));
        exit;
    }

    $minAmount = borrowing_setting_float($conn, 'min_amount', 0);

    if ($minAmount > 0 && $amount < $minAmount) {
        echo json_encode(borrowing_error("The smallest advance allowed is " . number_format($minAmount, 2) . " EGP."));
        exit;
    }

    $aboveCeiling = $amount > $eligibility['available'];

    if ($aboveCeiling && !borrowing_setting_is($conn, 'allow_applying_above_limit', 'yes')) {
        echo json_encode(borrowing_error(
            "The most this employee may take is " . number_format($eligibility['available'], 2) . " EGP."
        ));
        exit;
    }

    $maxInstallments = borrowing_setting_int($conn, 'max_installments', 10);
    $count           = (int)($data['installment_count'] ?? 0);

    if ($count < 1 || $count > $maxInstallments) {
        echo json_encode(borrowing_error("Choose between 1 and " . $maxInstallments . " instalments."));
        exit;
    }

    $firstDue = borrowing_add_months(date('Y-m-d'), 1);

    if (borrowing_setting_is($conn, 'allow_manual_first_month', 'yes')) {
        $chosen = borrowing_valid_date($data['first_due_month'] ?? '');

        if ($chosen !== null) {
            $firstDue = borrowing_month_first($chosen);

            if (strtotime($firstDue) < strtotime(borrowing_month_first(date('Y-m-d')))) {
                echo json_encode(borrowing_error("The first instalment cannot fall in a month that has already passed."));
                exit;
            }
        }
    }

    $reason   = borrowing_trim($data['reason'] ?? '', BORROWING_MAX_REASON_LENGTH);
    $snapshot = json_encode([
        'settings'  => array_map(fn($row) => $row['setting_value'], borrowing_settings($conn)),
        'factors'   => $eligibility['factors'],
        'available' => $eligibility['available'],
        'grade'     => $eligibility['grade'],
        'aboveCeiling' => $aboveCeiling,
        'reasons'   => $eligibility['reasons'],
    ]);

    $version    = borrowing_policy_version($conn);
    $userId     = $authorisation['user_id'];
    $years      = $eligibility['employee']['years'] ?? 0;
    $salary     = $eligibility['employee']['salary'];
    $attendance = $eligibility['factors']['attendance']['raw'];
    $commitment = $eligibility['factors']['commitment']['raw'];
    $score      = $eligibility['score'];
    $grade      = $eligibility['grade'];
    $multiplier = $eligibility['multiplier'];
    $maxAmount  = $eligibility['maxAmount'];
    $eligible   = $eligibility['eligible'] ? 1 : 0;

    $stmt = $conn->prepare(
        "INSERT INTO borrowing_applications
            (employee_code, contract_year, requested_amount, installment_count, first_due_month, reason,
             snap_salary, snap_years, snap_attendance, snap_commitment, snap_score, snap_grade,
             snap_multiplier, snap_max_amount, snap_eligible, snapshot_json, policy_version,
             status, submitted_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    );
    $stmt->bind_param(
        "sidisssdiiisddisii",
        $employeeCode, $contractYear, $amount, $count, $firstDue, $reason,
        $salary, $years, $attendance, $commitment, $score, $grade,
        $multiplier, $maxAmount, $eligible, $snapshot, $version, $userId
    );
    $stmt->execute();
    $applicationId = $conn->insert_id;
    $stmt->close();

    if (borrowing_setting_is($conn, 'approval_chain', 'none')) {
        $stmt = $conn->prepare(
            "UPDATE borrowing_applications
             SET status = 'approved', approved_amount = requested_amount, decided_by = ?, decided_at = NOW(),
                 decision_note = 'Approved automatically: no approval stage is configured'
             WHERE id = ?"
        );
        $stmt->bind_param("ii", $userId, $applicationId);
        $stmt->execute();
        $stmt->close();

        borrowing_stamp_effective_settings($conn, $applicationId);
        borrowing_generate_schedule($conn, $applicationId, $amount, $count, $firstDue);
    }

    borrowing_notify($conn, 'application_submitted', [
        'employeeEmail' => $employee['email'],
        'subject'       => 'Salary advance application submitted',
        'body'          => $employee['name_en'] . ",\r\n\r\n"
            . "An application for a salary advance of " . number_format($amount, 2) . " EGP over "
            . $count . " instalment" . ($count === 1 ? '' : 's') . " has been submitted"
            . ($reason === '' ? '' : " for: " . $reason) . ".\r\n\r\n"
            . "Credit score at submission: " . $score . " of 100 (" . $grade . ")\r\n"
            . "You will be notified once it has been reviewed.",
    ]);

    $message = $aboveCeiling
        ? "Application submitted for " . number_format($amount, 2) . " EGP, which is above the "
          . number_format($eligibility['available'], 2) . " EGP ceiling. The board has to grant an "
          . "exception before it can be approved."
        : "Application submitted.";

    if ($eligible === 0) {
        $message .= " This employee did not meet the rules: " . implode(' ', $eligibility['reasons'])
                  . " The board has to grant an exception before it can be approved.";
    }

    if ($changeOutcome['queued'] !== []) {
        $fields = borrowing_editable_fields('employee');
        $names  = array_map(
            fn($field) => strtolower($fields[$field]['label'] ?? $field),
            array_keys($changeOutcome['queued'])
        );
        $message .= " The change to " . borrowing_join_words($names)
                  . " was sent to the board for review, and the score above still uses the stored value.";
    }

    admin_log_action($conn, 'Submitted a salary advance application (#' . $applicationId . ') for employee ' . $employeeCode . '.');
    echo json_encode([
        "success"       => true,
        "message"       => $message,
        "code"          => 200,
        "applicationId" => $applicationId,
        "queued"        => array_keys($changeOutcome['queued']),
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
