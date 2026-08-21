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

    $denied = borrowing_require($authorisation, 'submit_edit_request');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $targetType = borrowing_trim($data['target_type'] ?? 'employee', 20);
    $targetKey  = borrowing_trim($data['target_key'] ?? '', 64);
    $reason     = borrowing_trim($data['reason'] ?? '', BORROWING_MAX_NOTE_LENGTH);

    if (!in_array($targetType, ['employee', 'application'], true)) {
        echo json_encode(borrowing_error("Unknown target for the change."));
        exit;
    }

    if ($targetKey === '') {
        echo json_encode(borrowing_error("Choose what the change applies to."));
        exit;
    }

    if ($targetType === 'employee' && borrowing_employee($conn, $targetKey) === null) {
        echo json_encode(borrowing_error("That employee is not in the staff directory.", 404));
        exit;
    }

    $normalised = borrowing_normalise_edit_changes($conn, $targetType, is_array($data['changes'] ?? null) ? $data['changes'] : []);

    if (!$normalised['success']) {
        echo json_encode($normalised);
        exit;
    }

    $current = borrowing_edit_current_values($conn, $targetType, $targetKey, array_keys($normalised['changes']));
    $actual  = [];

    foreach ($normalised['changes'] as $field => $value) {
        if ((string)($current[$field] ?? '') !== (string)$value) {
            $actual[$field] = $value;
        }
    }

    if ($actual === []) {
        echo json_encode(borrowing_error("Nothing would change. The values entered match what is already stored."));
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT 1 FROM borrowing_edit_requests
         WHERE target_type = ? AND target_key = ? AND status = 'pending'"
    );
    $stmt->bind_param("ss", $targetType, $targetKey);
    $stmt->execute();
    $alreadyPending = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($alreadyPending) {
        echo json_encode(borrowing_error("A change to this record is already waiting for a decision."));
        exit;
    }

    $changesJson = json_encode($actual);
    $role        = borrowing_primary_role($authorisation);
    $userId      = $authorisation['user_id'];

    $stmt = $conn->prepare(
        "INSERT INTO borrowing_edit_requests
            (target_type, target_key, changes_json, reason, requested_by, requester_role)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssssis", $targetType, $targetKey, $changesJson, $reason, $userId, $role);
    $stmt->execute();
    $requestId = $conn->insert_id;
    $stmt->close();

    echo json_encode([
        "success"   => true,
        "message"   => "Change submitted for review.",
        "code"      => 200,
        "requestId" => $requestId,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
