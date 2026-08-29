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

    $denied = borrowing_require($authorisation, 'record_payment');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $installmentId = (int)($data['installment_id'] ?? 0);
    $newStatus     = borrowing_trim($data['status'] ?? '', 20);
    $note          = borrowing_trim($data['note'] ?? '', 255);
    $userId        = $authorisation['user_id'];

    if (!in_array($newStatus, ['paid', 'scheduled'], true)) {
        echo json_encode(borrowing_error("An instalment can be recorded as paid, or put back to scheduled."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT i.id, i.status, i.amount, DATE_FORMAT(i.due_month, '%Y-%m-%d') AS due_month,
                i.application_id, e.name_en, e.email
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

    if (!borrowing_manual_ledger_allowed($conn, (int)$installment['application_id'])) {
        echo json_encode(borrowing_manual_ledger_refusal($conn));
        exit;
    }

    if (in_array($installment['status'], ['skipped', 'forgiven'], true)) {
        echo json_encode(borrowing_error(
            "That instalment is " . $installment['status'] . ". Raise a correction so the board can review it."
        ));
        exit;
    }

    if ($installment['status'] === $newStatus) {
        echo json_encode(borrowing_error("That instalment is already " . $newStatus . "."));
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE borrowing_installments
         SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE NULL END, paid_by = ?, note = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ssisi", $newStatus, $newStatus, $userId, $note, $installmentId);
    $stmt->execute();
    $stmt->close();

    borrowing_settle_completed($conn);

    borrowing_notify($conn, 'payment_recorded', [
        'employeeEmail' => $installment['email'],
        'subject'       => 'Salary advance instalment updated',
        'body'          => ($installment['name_en'] ?? '') . ",\r\n\r\n"
            . "The instalment of " . number_format((float)$installment['amount'], 2) . " EGP due in "
            . date('F Y', strtotime($installment['due_month'])) . " was recorded as " . $newStatus . "."
            . ($note === '' ? '' : "\r\n\r\nNote: " . $note),
    ]);

    admin_log_action($conn, 'Recorded instalment #' . $installmentId . ' as ' . $newStatus . ' on the salary advance application #' . (int)$installment['application_id'] . '.', ADMIN_ACTION_CATEGORY_BORROWING_SYSTEM);
    echo json_encode([
        "success" => true,
        "message" => "Instalment recorded as " . $newStatus . ".",
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
