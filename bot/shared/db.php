<?php
require_once '../../configs/botConfig.php';

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    }
    return $pdo;
}

function setActiveChannel($channel) {
    $GLOBALS['ACTIVE_CHAT_CHANNEL'] = $channel;
}
function activeChannel() {
    return $GLOBALS['ACTIVE_CHAT_CHANNEL'] ?? 'whatsapp';
}

function getSession($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("SELECT * FROM chat_bot_user_sessions WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$phone, $channel]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function createOrUpdateSession($phone, $language = null, $state = 'new', $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("
        INSERT INTO chat_bot_user_sessions (phone_number, channel, language, state)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            language = COALESCE(VALUES(language), language),
            state = VALUES(state)
    ");
    $stmt->execute([$phone, $channel, $language, $state]);
}

function saveMessage($phone, $role, $message, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("INSERT INTO chat_bot_user_chat_history (phone_number, channel, role, message) VALUES (?, ?, ?, ?)");
    $stmt->execute([$phone, $channel, $role, $message]);
}

function getHistory($phone, $limit = 50, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("
        SELECT role, message FROM chat_bot_user_chat_history
        WHERE phone_number = ? AND channel = ?
        ORDER BY created_at ASC
        LIMIT $limit
    ");
    $stmt->execute([$phone, $channel]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function isNewSession($session) {
    if (!$session || !$session['last_message_at']) return true;
    $lastMs = strtotime($session['last_message_at']);
    return (time() - $lastMs) > (SESSION_TIMEOUT_MINUTES * 60);
}

function startNewSession($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("
        UPDATE chat_bot_user_sessions
        SET session_started_at = NOW(), last_message_at = NOW(), messages_since_feedback = 0
        WHERE phone_number = ? AND channel = ?
    ");
    $stmt->execute([$phone, $channel]);
}

function touchSession($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET last_message_at = NOW() WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$phone, $channel]);
}

function clearUserHistory($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("DELETE FROM chat_bot_user_chat_history WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$phone, $channel]);
}

function getRelevantHistory($phone, $session, $limit = 50, $channel = null) {
    $channel = $channel ?? activeChannel();
    if (USE_HISTORY_ACROSS_SESSIONS === 1) {
        $stmt = db()->prepare("SELECT role, message FROM chat_bot_user_chat_history WHERE phone_number = ? AND channel = ? ORDER BY created_at ASC LIMIT $limit");
        $stmt->execute([$phone, $channel]);
    } else {
        $sessionStart = $session['session_started_at'] ?? date('Y-m-d H:i:s');
        $stmt = db()->prepare("SELECT role, message FROM chat_bot_user_chat_history WHERE phone_number = ? AND channel = ? AND created_at >= ? ORDER BY created_at ASC LIMIT $limit");
        $stmt->execute([$phone, $channel, $sessionStart]);
    }
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function updateSessionState($phone, $state, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET state = ? WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$state, $phone, $channel]);
}

function incrementMessageCounter($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET messages_since_feedback = messages_since_feedback + 1 WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$phone, $channel]);
}

function resetMessageCounter($phone, $channel = null) {
    $channel = $channel ?? activeChannel();
    $stmt = db()->prepare("UPDATE chat_bot_user_sessions SET messages_since_feedback = 0 WHERE phone_number = ? AND channel = ?");
    $stmt->execute([$phone, $channel]);
}
