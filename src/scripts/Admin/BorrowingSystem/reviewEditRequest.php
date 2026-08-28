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

    $denied = borrowing_require($authorisation, 'review_edit_request');

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

    $stmt = $conn->prepare("SELECT * FROM borrowing_edit_requests WHERE id = ?");
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

    $changes  = json_decode((string)$request['changes_json'], true) ?: [];
    $applied  = false;
    $employee = null;

    if ($request['target_type'] === 'employee') {
        $employee = borrowing_employee($conn, (string)$request['target_key']);
    }

    if ($decision === 'approved') {
        $applied = borrowing_apply_edit_request($conn, (string)$request['target_type'], (string)$request['target_key'], $changes);

        if (!$applied) {
            echo json_encode(borrowing_error("None of the requested fields can be changed any more."));
            exit;
        }

        if ($request['target_type'] === 'application' && (array_key_exists('approved_amount', $changes) || array_key_exists('installment_count', $changes))) {
            borrowing_rebuild_schedule($conn, (int)$request['target_key']);
        }
    }

    $stmt = $conn->prepare(
        "UPDATE borrowing_edit_requests
         SET status = ?, decided_by = ?, decided_at = NOW(), decision_note = ?
         WHERE id = ?"
    );
    $stmt->bind_param("sisi", $decision, $userId, $note, $requestId);
    $stmt->execute();
    $stmt->close();

    $fields = borrowing_editable_fields((string)$request['target_type']);
    $lines  = [];

    foreach ($changes as $field => $value) {
        $lines[] = '  ' . ($fields[$field]['label'] ?? $field) . ': ' . $value;
    }

    borrowing_notify($conn, 'edit_request_decided', [
        'employeeEmail' => $employee['email'] ?? '',
        'subject'       => 'Borrowing system data change ' . $decision,
        'body'          => "A requested change to "
            . ($employee !== null ? $employee['name_en'] . "'s record" : "advance #" . $request['target_key'])
            . " was " . $decision . ".\r\n\r\n"
            . implode("\r\n", $lines)
            . ($note === '' ? '' : "\r\n\r\nNote from the board: " . $note),
    ]);

    admin_log_action($conn, 'Recorded a "' . $decision . '" decision on the borrowing system change request #' . $requestId . '.');
    echo json_encode([
        "success" => true,
        "message" => $decision === 'approved' ? "Change approved and applied." : "Change rejected.",
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
