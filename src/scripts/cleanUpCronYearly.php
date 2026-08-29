<?php
$dbConfig = require __DIR__ . '/../../configs/dbConfig.php';
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__);

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
    $conn->query("DELETE FROM admin_action_events WHERE created_at < UTC_TIMESTAMP() - INTERVAL 2 YEAR;");
    echo "Cron Job Successfully ran\n";

} catch (Exception $e) {
    echo "An error occurred: " . $e->getMessage();
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
