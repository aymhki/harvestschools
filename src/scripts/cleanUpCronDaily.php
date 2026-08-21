<?php
$dbConfig = require __DIR__ . '/../../configs/dbConfig.php';
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__);
require_once __DIR__ . '/Admin/BorrowingSystem/borrowingHelpers.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$conn = null;

try {
    $conn = new mysqli(
        $dbConfig['db_host'],
        $dbConfig['db_username'],
        $dbConfig['db_password'],
        $dbConfig['db_name']
    );


    $conn->set_charset("utf8mb4");
    $conn->query("DELETE FROM admin_sessions WHERE last_seen  < NOW() - INTERVAL 12 HOUR OR created_at < NOW() - INTERVAL 7 DAY; ");
    $conn->query("DELETE FROM admin_step_up_challenges WHERE expires_at < NOW() - INTERVAL 1 DAY;");
    $conn->query("DELETE FROM alumni_sessions WHERE last_seen < NOW() - INTERVAL 12 HOUR OR created_at < NOW() - INTERVAL 7 DAY;");
    $conn->query("DELETE FROM alumni_auth_challenges WHERE expires_at < NOW() - INTERVAL 1 DAY;");
    $borrowingSweep = borrowing_sweep_notifications($conn);
    $conn->query("DELETE FROM borrowing_notification_log WHERE sent_on < CURDATE() - INTERVAL 180 DAY;");
    echo "Cron Job Successfully ran\n";

} catch (Exception $e) {
    echo "An error occurred: " . $e->getMessage();
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
