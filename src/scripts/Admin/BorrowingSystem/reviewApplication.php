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

    $denied = borrowing_require($authorisation, 'review_application');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $applicationId = (int)($data['application_id'] ?? 0);
    $decision      = borrowing_trim($data['decision'] ?? '', 20);
    $note          = borrowing_trim($data['note'] ?? '', BORROWING_MAX_NOTE_LENGTH);
    $withChanges   = !empty($data['with_changes']);
    $userId        = $authorisation['user_id'];

    if (!in_array($decision, ['approved', 'rejected'], true)) {
        echo json_encode(borrowing_error("Choose whether to approve or reject."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT a.*, e.name_en, e.email
         FROM borrowing_applications a
         LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE a.id = ?"
    );
    $stmt->bind_param("i", $applicationId);
    $stmt->execute();
    $application = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$application) {
        echo json_encode(borrowing_error("That application no longer exists.", 404));
        exit;
    }

    if ($application['status'] !== 'pending') {
        echo json_encode(borrowing_error("That application has already been decided."));
        exit;
    }

    if ($decision === 'rejected') {
        $stmt = $conn->prepare(
            "UPDATE borrowing_applications
             SET status = 'rejected', decided_by = ?, decided_at = NOW(), decision_note = ?
             WHERE id = ?"
        );
        $stmt->bind_param("isi", $userId, $note, $applicationId);
        $stmt->execute();
        $stmt->close();

        borrowing_notify($conn, 'application_decided', [
            'employeeEmail' => $application['email'],
            'subject'       => 'Salary advance application rejected',
            'body'          => $application['name_en'] . ",\r\n\r\n"
                . "Your application for a salary advance of "
                . number_format((float)$application['requested_amount'], 2) . " EGP was not approved."
                . ($note === '' ? '' : "\r\n\r\nNote from the board: " . $note),
        ]);

        admin_log_action($conn, 'Rejected the salary advance application #' . $applicationId . '.');
        echo json_encode(["success" => true, "message" => "Application rejected.", "code" => 200]);
        exit;
    }

    $amount   = borrowing_money($application['requested_amount']);
    $count    = (int)$application['installment_count'];
    $firstDue = (string)$application['first_due_month'];
    $custom   = null;
    $reason   = borrowing_trim($data['override_reason'] ?? '', BORROWING_MAX_NOTE_LENGTH);

    if ($withChanges) {
        $denied = borrowing_require($authorisation, 'override_terms');

        if ($denied !== null) {
            echo json_encode($denied);
            exit;
        }

        if ($reason === '') {
            echo json_encode(borrowing_error("Changing the terms needs a written reason."));
            exit;
        }

        if (is_numeric($data['amount'] ?? null)) {
            $amount = borrowing_money($data['amount']);
        }

        if ($amount <= 0) {
            echo json_encode(borrowing_error("The approved amount must be more than zero."));
            exit;
        }

        $schedule = is_array($data['schedule'] ?? null) ? $data['schedule'] : [];

        if ($schedule !== []) {
            if (count($schedule) > BORROWING_HARD_MAX_INSTALLMENTS) {
                echo json_encode(borrowing_error("A plan may not run longer than " . BORROWING_HARD_MAX_INSTALLMENTS . " months."));
                exit;
            }

            $custom = [];
            $total  = 0.0;

            foreach ($schedule as $position => $entry) {
                $entryAmount = is_numeric($entry['amount'] ?? null) ? borrowing_money($entry['amount']) : -1;
                $entryMonth  = borrowing_valid_date($entry['due_month'] ?? '');

                if ($entryAmount < 0) {
                    echo json_encode(borrowing_error("Instalment " . ($position + 1) . " needs an amount."));
                    exit;
                }

                if ($entryMonth === null) {
                    echo json_encode(borrowing_error("Instalment " . ($position + 1) . " needs a month."));
                    exit;
                }

                $custom[] = ['amount' => $entryAmount, 'due_month' => $entryMonth, 'manual' => true];
                $total   += $entryAmount;
            }

            if (abs(borrowing_money($total) - $amount) >= 0.01) {
                echo json_encode(borrowing_error(
                    "The plan adds up to " . number_format($total, 2) . " EGP but the advance is "
                    . number_format($amount, 2) . " EGP."
                ));
                exit;
            }

            $count    = count($custom);
            $firstDue = $custom[0]['due_month'];
        } else {
            if (is_numeric($data['installment_count'] ?? null)) {
                $count = (int)$data['installment_count'];
            }

            if ($count < 1 || $count > BORROWING_HARD_MAX_INSTALLMENTS) {
                echo json_encode(borrowing_error("Choose between 1 and " . BORROWING_HARD_MAX_INSTALLMENTS . " instalments."));
                exit;
            }

            $chosen = borrowing_valid_date($data['first_due_month'] ?? '');

            if ($chosen !== null) {
                $firstDue = borrowing_month_first($chosen);
            }
        }
    } else {
        if ((int)$application['snap_eligible'] !== 1) {
            echo json_encode(borrowing_error(
                "This applicant did not meet the eligibility rules, so it can only be approved with changes and a written reason."
            ));
            exit;
        }

        if ($amount > borrowing_money($application['snap_max_amount']) + 0.001) {
            echo json_encode(borrowing_error(
                "This asks for more than the ceiling of "
                . number_format((float)$application['snap_max_amount'], 2)
                . " EGP, so it can only be approved with changes and a written reason."
            ));
            exit;
        }
    }

    $stmt = $conn->prepare(
        "UPDATE borrowing_applications
         SET status = 'approved', approved_amount = ?, installment_count = ?, first_due_month = ?,
             decided_by = ?, decided_at = NOW(), decision_note = ?
         WHERE id = ?"
    );
    $stmt->bind_param("disisi", $amount, $count, $firstDue, $userId, $note, $applicationId);
    $stmt->execute();
    $stmt->close();

    borrowing_stamp_effective_settings($conn, $applicationId);
    borrowing_generate_schedule($conn, $applicationId, $amount, $count, $firstDue, $custom);

    $overrides = [];

    if ((int)$application['snap_eligible'] !== 1) {
        borrowing_log_override($conn, $applicationId, 'eligibility', 'Not eligible', 'Approved anyway', $reason, $userId);
        $overrides[] = 'approved despite not meeting the eligibility rules';
    }

    if ($amount > borrowing_money($application['snap_max_amount']) + 0.001) {
        borrowing_log_override($conn, $applicationId, 'ceiling',
            number_format((float)$application['snap_max_amount'], 2),
            number_format($amount, 2), $reason, $userId);
        $overrides[] = 'granted above the calculated ceiling';
    }

    if (abs($amount - borrowing_money($application['requested_amount'])) >= 0.01) {
        borrowing_log_override($conn, $applicationId, 'amount',
            number_format((float)$application['requested_amount'], 2),
            number_format($amount, 2), $reason, $userId);
        $overrides[] = 'approved for a different amount than requested';
    }

    if ($custom !== null) {
        borrowing_log_override($conn, $applicationId, 'custom_schedule',
            $application['installment_count'] . ' equal instalments',
            $count . ' hand-set instalments', $reason, $userId);
        $overrides[] = 'given a hand-built repayment plan';
    } elseif ($count !== (int)$application['installment_count']) {
        borrowing_log_override($conn, $applicationId, 'installment_count',
            (string)$application['installment_count'], (string)$count, $reason, $userId);
        $overrides[] = 'given a different number of instalments';
    }

    $schedule = borrowing_schedule_rows($conn, $applicationId);
    $lines    = [];

    foreach ($schedule as $row) {
        $lines[] = '  ' . $row['label'] . '   ' . number_format($row['amount'], 2) . ' EGP';
    }

    borrowing_notify($conn, $overrides === [] ? 'application_decided' : 'application_overridden', [
        'employeeEmail' => $application['email'],
        'subject'       => 'Salary advance approved',
        'body'          => $application['name_en'] . ",\r\n\r\n"
            . "Your salary advance of " . number_format($amount, 2) . " EGP has been approved"
            . ($overrides === [] ? '' : ' with changes: ' . borrowing_join_words($overrides)) . ".\r\n\r\n"
            . "Repayment plan:\r\n" . implode("\r\n", $lines)
            . ($note === '' ? '' : "\r\n\r\nNote from the board: " . $note)
            . ($reason === '' ? '' : "\r\n\r\nReason for the change: " . $reason),
    ]);

    admin_log_action($conn, 'Recorded a "' . $decision . '" decision on the salary advance application #' . $applicationId . '.');
    echo json_encode([
        "success"   => true,
        "message"   => "Application approved and the repayment plan written.",
        "code"      => 200,
        "overrides" => $overrides,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
