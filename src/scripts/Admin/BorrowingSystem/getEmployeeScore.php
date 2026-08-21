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

    $denied = borrowing_require($authorisation, 'view_scores');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $employeeCode = borrowing_trim($_GET['employee'] ?? '', 32);

    if ($employeeCode === '') {
        echo json_encode(borrowing_error("Choose an employee first."));
        exit;
    }

    borrowing_advance_ledger($conn);

    $eligibility = borrowing_eligibility($conn, $employeeCode);

    if (!$eligibility['success']) {
        echo json_encode($eligibility);
        exit;
    }


    $unaskable = [];

    foreach ($eligibility['missing'] as $item) {
        if (isset(BORROWING_CAPTURED_FIGURES[$item]) && !borrowing_capture_is_form($conn, $item)) {
            $unaskable[] = preg_replace('/^an? /', '', $item);
        }
    }

    if ($unaskable !== []) {
        echo json_encode(borrowing_error(
            $eligibility['employee']['nameEn'] . ' has no ' . borrowing_join_words($unaskable)
            . ' on the staff record, and the settings read '
            . (count($unaskable) === 1 ? 'it' : 'them')
            . ' from there rather than asking here. Add '
            . (count($unaskable) === 1 ? 'it' : 'them')
            . ' in the Staff Directory, or switch the setting so the eligibility check asks.'
        ));
        exit;
    }

    $eligibility['canSubmit'] = borrowing_can($authorisation, 'submit_application')
        && $eligibility['blocking'] === []
        && ($eligibility['eligible'] || borrowing_setting_is($conn, 'allow_applying_when_ineligible', 'yes'));
    $eligibility['history']   = [];

    $stmt = $conn->prepare(
        "SELECT id, contract_year, approved_amount, requested_amount, status, settled_at,
                DATE_FORMAT(submitted_at, '%Y-%m-%d') AS submitted_label
         FROM borrowing_applications
         WHERE employee_code = ?
         ORDER BY id DESC
         LIMIT 10"
    );
    $stmt->bind_param("s", $employeeCode);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    while ($row = $result->fetch_assoc()) {
        $amount = (float)$row['approved_amount'] > 0 ? (float)$row['approved_amount'] : (float)$row['requested_amount'];

        $eligibility['history'][] = [
            'id'           => (int)$row['id'],
            'contractYear' => (int)$row['contract_year'],
            'amount'       => borrowing_money($amount),
            'status'       => (string)$row['status'],
            'settled'      => $row['settled_at'] !== null,
            'submittedAt'  => (string)$row['submitted_label'],
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Score calculated",
        "code"    => 200,
        "data"    => $eligibility,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
