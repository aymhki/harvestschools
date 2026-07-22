<?php
$dbConfig = require __DIR__ . '/../../configs/dbConfig.php';
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
    $conn->query("DELETE FROM admin_login_events WHERE created_at < NOW() - INTERVAL 180 DAY;");
    $conn->query("DELETE FROM admin_mfa_codes    WHERE expires_at < NOW() - INTERVAL 1 DAY;");
    $conn->query("DELETE FROM admin_mfa_send_log WHERE sent_at    < NOW() - INTERVAL 1 DAY;");
    $conn->query("DELETE FROM admin_mfa_challenges WHERE expires_at < NOW() - INTERVAL 1 DAY;");
    $conn->query("DELETE FROM admin_ip_geolocations WHERE looked_up_at < NOW() - INTERVAL 180 DAY;");
    $conn->query("DELETE FROM alumni_login_events WHERE created_at < NOW() - INTERVAL 180 DAY;");
    echo "Cron Job Successfully ran\n";

} catch (Exception $e) {
    echo "An error occurred: " . $e->getMessage();
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
