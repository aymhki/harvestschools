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

    $kind = borrowing_trim($data['kind'] ?? 'delay', 20);

    if (!in_array($kind, ['delay', 'payment_correction'], true)) {
        echo json_encode(borrowing_error("Unknown request type."));
        exit;
    }

    $denied = borrowing_require($authorisation, $kind === 'delay' ? 'submit_delay' : 'correct_payment');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $installmentId = (int)($data['installment_id'] ?? 0);
    $reason        = borrowing_trim($data['reason'] ?? '', BORROWING_MAX_NOTE_LENGTH);

    if ($reason === '') {
        echo json_encode(borrowing_error("Give a reason for the request."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT i.id, i.application_id, i.status, i.amount, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                a.settled_at, e.name_en, e.email
         FROM borrowing_installments i
         JOIN borrowing_applications a ON a.id = i.application_id
         LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE i.id = ?"
    );
    $stmt->bind_param("i", $installmentId);
    $stmt->execute();
    $installment = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$installment) {
        echo json_encode(borrowing_error("That instalment no longer exists.", 404));
        exit;
    }

    if ($kind === 'payment_correction'
        && !borrowing_manual_ledger_allowed($conn, (int)$installment['application_id'])) {
        echo json_encode(borrowing_manual_ledger_refusal($conn));
        exit;
    }

    $requestedStatus = '';

    if ($kind === 'delay') {
        if ($installment['status'] !== 'scheduled') {
            echo json_encode(borrowing_error("Only a scheduled instalment can be delayed. This one is " . $installment['status'] . "."));
            exit;
        }
    } else {
        $requestedStatus = borrowing_trim($data['requested_status'] ?? '', 20);

        if (!in_array($requestedStatus, ['paid', 'scheduled'], true)) {
            echo json_encode(borrowing_error("A correction must set the instalment to paid or back to scheduled."));
            exit;
        }

        if ($installment['status'] === $requestedStatus) {
            echo json_encode(borrowing_error("That instalment is already " . $requestedStatus . "."));
            exit;
        }
    }

    $stmt = $conn->prepare(
        "SELECT 1 FROM borrowing_delay_requests WHERE installment_id = ? AND status = 'pending'"
    );
    $stmt->bind_param("i", $installmentId);
    $stmt->execute();
    $alreadyPending = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($alreadyPending) {
        echo json_encode(borrowing_error("A request for that instalment is already waiting for a decision."));
        exit;
    }

    $applicationId = (int)$installment['application_id'];
    $maxDelays     = (int)borrowing_contract_setting($conn, $applicationId, 'max_delays_per_contract');
    $taken         = borrowing_approved_delay_count($conn, $applicationId);
    $overCap       = ($kind === 'delay' && $maxDelays > 0 && $taken >= $maxDelays) ? 1 : 0;
    $userId        = $authorisation['user_id'];

    $stmt = $conn->prepare(
        "INSERT INTO borrowing_delay_requests
            (application_id, installment_id, kind, requested_status, reason, requested_by, over_cap)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("iisssii", $applicationId, $installmentId, $kind, $requestedStatus, $reason, $userId, $overCap);
    $stmt->execute();
    $requestId = $conn->insert_id;
    $stmt->close();

    borrowing_notify($conn, 'delay_requested', [
        'employeeEmail' => $installment['email'],
        'subject'       => $kind === 'delay'
            ? 'Instalment delay requested'
            : 'Instalment payment correction requested',
        'body'          => ($installment['name_en'] ?? '') . ",\r\n\r\n"
            . ($kind === 'delay'
                ? "A request to delay the instalment of " . number_format((float)$installment['amount'], 2)
                  . " EGP due in " . date('F Y', strtotime($installment['due_month'])) . " has been submitted."
                : "A request to correct the instalment due in " . date('F Y', strtotime($installment['due_month']))
                  . " to '" . $requestedStatus . "' has been submitted.")
            . "\r\n\r\nReason: " . $reason
            . ($overCap === 1
                ? "\r\n\r\nThis contract has already used its " . $maxDelays . " permitted delays, so the request "
                  . "needs a board exception."
                : ''),
    ]);

    admin_log_action($conn, 'Submitted a delay request (#' . $requestId . ') on the salary advance application #' . $applicationId . '.', ADMIN_ACTION_CATEGORY_BORROWING_SYSTEM);
    echo json_encode([
        "success"   => true,
        "message"   => $overCap === 1
            ? "Request submitted. It is beyond the " . $maxDelays . " delays this contract allows, so it needs a board exception."
            : "Request submitted.",
        "code"      => 200,
        "requestId" => $requestId,
        "overCap"   => $overCap === 1,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
