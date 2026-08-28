<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/pageGateHelpers.php';
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

    global $PAGE_GATES_MANAGEMENT;
    $authStatus = check_admin_user_permission($conn, $PAGE_GATES_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $pageId = (string)($data['page_id'] ?? '');

    if (!page_gate_is_known($pageId)) {
        echo json_encode(["success" => false, "message" => "That page does not exist.", "code" => 404]);
        exit;
    }

    $isEnabled = !empty($data['is_enabled']) ? 1 : 0;
    $messageEn = page_gate_normalise_message($data['message_en'] ?? null);
    $messageAr = page_gate_normalise_message($data['message_ar'] ?? null);
    $updatedBy = page_gate_user_id($conn, $authStatus['session_id'] ?? '');

    $stmt = $conn->prepare("SELECT is_enabled, message_en, message_ar FROM public_page_gates WHERE page_id = ?");
    $stmt->bind_param("s", $pageId);
    $stmt->execute();
    $gateBefore = $stmt->get_result()->fetch_assoc() ?: [];
    $stmt->close();

    $stmt = $conn->prepare(
        "INSERT INTO public_page_gates (page_id, is_enabled, message_en, message_ar, updated_at, updated_by)
         VALUES (?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
             is_enabled = VALUES(is_enabled),
             message_en = VALUES(message_en),
             message_ar = VALUES(message_ar),
             updated_at = VALUES(updated_at),
             updated_by = VALUES(updated_by)"
    );

    $stmt->bind_param("sissi", $pageId, $isEnabled, $messageEn, $messageAr, $updatedBy);
    $stmt->execute();
    $stmt->close();

    admin_log_action($conn, 'Updated the public page "' . $pageId . '": ' . admin_changes_summary(
        ['Visible to the public' => isset($gateBefore['is_enabled']) ? (int)$gateBefore['is_enabled'] === 1 : null, 'Closed message (EN)' => $gateBefore['message_en'] ?? null, 'Closed message (AR)' => $gateBefore['message_ar'] ?? null],
        ['Visible to the public' => $isEnabled === 1, 'Closed message (EN)' => $messageEn, 'Closed message (AR)' => $messageAr]
    ) . '.');
    echo json_encode([
        "success" => true,
        "message" => $isEnabled ? "Page switched on." : "Page switched off.",
        "code"    => 200
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
