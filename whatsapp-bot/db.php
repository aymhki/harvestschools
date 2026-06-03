<?php
require_once __DIR__ . '/config.php';

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    }
    return $pdo;
}

function getSession($phone) {
    $stmt = db()->prepare("SELECT * FROM chat_bot_user_sessions WHERE phone_number = ?");
    $stmt->execute([$phone]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function createOrUpdateSession($phone, $language = null, $state = 'new') {
    $stmt = db()->prepare("
        INSERT INTO chat_bot_user_sessions (phone_number, language, state)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            language = COALESCE(VALUES(language), language),
            state = VALUES(state)
    ");
    $stmt->execute([$phone, $language, $state]);
}

function saveMessage($phone, $role, $message) {
    $stmt = db()->prepare("INSERT INTO chat_bot_user_chat_history (phone_number, role, message) VALUES (?, ?, ?)");
    $stmt->execute([$phone, $role, $message]);
}

function getHistory($phone, $limit = 50) {
    $stmt = db()->prepare("
        SELECT role, message FROM chat_bot_user_chat_history
        WHERE phone_number = ?
        ORDER BY created_at ASC
        LIMIT $limit
    ");
    $stmt->execute([$phone]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function isNewSession($session) {
    if (!$session || !$session['last_message_at']) return true;
    $lastMs = strtotime($session['last_message_at']);
    return (time() - $lastMs) > (SESSION_TIMEOUT_MINUTES * 60);
}

function startNewSession($phone) {
    $stmt = db()->prepare("
        UPDATE chat_bot_user_sessions 
        SET session_started_at = NOW(), last_message_at = NOW() 
        WHERE phone_number = ?
    ");
    $stmt->execute([$phone]);
}

function touchSession($phone) {
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET last_message_at = NOW() WHERE phone_number = ?");
    $stmt->execute([$phone]);
}

function clearUserHistory($phone) {
    $stmt = db()->prepare("DELETE FROM chat_bot_user_chat_history WHERE phone_number = ?");
    $stmt->execute([$phone]);
}

// Get history — either ALL (if config = 1) or only current session (if config = 0)
function getRelevantHistory($phone, $session, $limit = 50) {
    if (USE_HISTORY_ACROSS_SESSIONS === 1) {
        $stmt = db()->prepare("SELECT role, message FROM chat_bot_user_chat_history WHERE phone_number = ? ORDER BY created_at ASC LIMIT $limit");
        $stmt->execute([$phone]);
    } else {
        $sessionStart = $session['session_started_at'] ?? date('Y-m-d H:i:s');
        $stmt = db()->prepare("SELECT role, message FROM chat_bot_user_chat_history WHERE phone_number = ? AND created_at >= ? ORDER BY created_at ASC LIMIT $limit");
        $stmt->execute([$phone, $sessionStart]);
    }
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function updateSessionState($phone, $state) {
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET state = ? WHERE phone_number = ?");
    $stmt->execute([$state, $phone]);
}