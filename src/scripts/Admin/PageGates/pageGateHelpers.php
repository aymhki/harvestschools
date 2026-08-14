<?php
require_once __DIR__ . '/../../Public/SchoolInfo/publicPageInventory.php';

function page_gate_rows($conn) {
    $rows = [];
    $result = $conn->query("SELECT page_id, is_enabled, message_en, message_ar, updated_at FROM public_page_gates");

    if (!$result) {
        return $rows;
    }

    while ($row = $result->fetch_assoc()) {
        $rows[$row['page_id']] = $row;
    }

    return $rows;
}


function page_gate_user_id($conn, $sessionId) {
    if (!is_string($sessionId) || $sessionId === '') {
        return 0;
    }

    $stmt = $conn->prepare("SELECT user_id FROM admin_sessions WHERE id = ?");
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    return $row ? (int)$row['user_id'] : 0;
}

function page_gate_is_known($pageId) {
    foreach (PUBLIC_PAGE_INVENTORY as $page) {
        if ($page['id'] === $pageId) {
            return true;
        }
    }

    return false;
}

function page_gate_normalise_message($value) {
    if (!is_string($value)) {
        return null;
    }

    $trimmed = trim($value);

    return $trimmed === '' ? null : $trimmed;
}
