<?php

require_once '../../headers.php';
require_once 'walletPassHelpers.php';

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

set_cors_headers([
    'content_type'    => 'application/vnd.apple.pkpass',
    'allowed_methods' => 'GET, OPTIONS',
]);

$conn = null;

try {
    $bookingId = wallet_verify_pass_token($_GET['token'] ?? '');

    if (!$bookingId || !wallet_apple_is_configured()) {
        http_response_code(404);
        exit('Not found');
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        http_response_code(500);
        exit('Database connection failed');
    }

    $conn->set_charset('utf8mb4');

    $summary = wallet_booking_summary($conn, $bookingId);

    $package = $summary ? wallet_build_pkpass($summary) : null;

    if (!$package) {
        http_response_code(404);
        exit('Not found');
    }

    header('Content-Disposition: attachment; filename="event-booking-' . $bookingId . '.pkpass"');
    header('Content-Length: ' . strlen($package));

    echo $package;

} catch (Throwable $e) {
    http_response_code(500);
    exit('Could not build the pass');
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
