<?php
require_once __DIR__ . '/db.php';

// Delete chat history older than 7 days
db()->exec("DELETE FROM chat_bot_user_chat_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

// Optional: also clear stale sessions for advanced mode
db()->exec("DELETE FROM chat_bot_user_sessions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

echo "Cleanup done at " . date('c');