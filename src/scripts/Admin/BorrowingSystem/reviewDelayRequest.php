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

    $denied = borrowing_require($authorisation, 'review_delay');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $requestId = (int)($data['request_id'] ?? 0);
    $decision  = borrowing_trim($data['decision'] ?? '', 20);
    $note      = borrowing_trim($data['note'] ?? '', BORROWING_MAX_NOTE_LENGTH);
    $userId    = $authorisation['user_id'];

    if (!in_array($decision, ['approved', 'rejected'], true)) {
        echo json_encode(borrowing_error("Choose whether to approve or reject."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT d.*, i.amount, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                e.name_en, e.email
         FROM borrowing_delay_requests d
         JOIN borrowing_installments i ON i.id = d.installment_id
         JOIN borrowing_applications a ON a.id = d.application_id
         LEFT JOIN staff_employees e ON e.employee_code = a.employee_code
         WHERE d.id = ?"
    );
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $request = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$request) {
        echo json_encode(borrowing_error("That request no longer exists.", 404));
        exit;
    }

    if ($request['status'] !== 'pending') {
        echo json_encode(borrowing_error("That request has already been decided."));
        exit;
    }

    $applicationId = (int)$request['application_id'];
    $installmentId = (int)$request['installment_id'];
    $outcome       = '';

    if ($decision === 'approved') {
        if ((int)$request['over_cap'] === 1) {
            $denied = borrowing_require($authorisation, 'override_delay_cap');

            if ($denied !== null) {
                echo json_encode(borrowing_error(
                    "This contract has used all its permitted delays. Granting another needs the "
                    . "override delay cap capability.", 403
                ));
                exit;
            }

            if ($note === '') {
                echo json_encode(borrowing_error("Granting a delay beyond the cap needs a written reason."));
                exit;
            }
        }

        if ($request['kind'] === 'delay') {
            $applied = borrowing_apply_delay($conn, $applicationId, $installmentId);

            if (empty($applied['success'])) {
                echo json_encode($applied);
                exit;
            }

            $outcome = $applied['message'];

            if ((int)$request['over_cap'] === 1) {
                borrowing_log_override($conn, $applicationId, 'delay_cap',
                    borrowing_setting($conn, 'max_delays_per_contract', '3') . ' delays',
                    'one more granted', $note, $userId);
            }
        } else {
            $newStatus = (string)$request['requested_status'];
            $stmt = $conn->prepare(
                "UPDATE borrowing_installments
                 SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE NULL END, paid_by = ?
                 WHERE id = ?"
            );
            $stmt->bind_param("ssii", $newStatus, $newStatus, $userId, $installmentId);
            $stmt->execute();
            $stmt->close();

            $outcome = 'The instalment was set to ' . $newStatus . '.';
        }

        borrowing_settle_completed($conn);
    }

    $stmt = $conn->prepare(
        "UPDATE borrowing_delay_requests
         SET status = ?, decided_by = ?, decided_at = NOW(), decision_note = ?
         WHERE id = ?"
    );
    $stmt->bind_param("sisi", $decision, $userId, $note, $requestId);
    $stmt->execute();
    $stmt->close();

    borrowing_notify($conn, 'delay_decided', [
        'employeeEmail' => $request['email'],
        'subject'       => $request['kind'] === 'delay'
            ? 'Instalment delay ' . $decision
            : 'Instalment correction ' . $decision,
        'body'          => ($request['name_en'] ?? '') . ",\r\n\r\n"
            . "The request concerning the instalment due in "
            . date('F Y', strtotime($request['due_month'])) . " was " . $decision . "."
            . ($outcome === '' ? '' : "\r\n\r\n" . $outcome)
            . ($note === '' ? '' : "\r\n\r\nNote from the board: " . $note),
    ]);

    echo json_encode([
        "success" => true,
        "message" => $decision === 'approved' ? ($outcome ?: "Request approved.") : "Request rejected.",
        "code"    => 200,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
