<?php
require_once __DIR__ . '/db.php';

try {
    db()->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt1 = db()->exec("DELETE FROM chat_bot_user_chat_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");
    $stmt2 = db()->exec("DELETE FROM chat_bot_user_sessions WHERE updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)");

    $rows1 = $stmt1 !== false ? $stmt1 : 0;
    $rows2 = $stmt2 !== false ? $stmt2 : 0;

    echo "Cleanup SUCCESS at " . date('c') . " | History deleted: {$rows1} | Sessions deleted: {$rows2}\n";

} catch (Exception $e) {
    echo "DATABASE ERROR at " . date('c') . " | " . $e->getMessage() . "\n";
}