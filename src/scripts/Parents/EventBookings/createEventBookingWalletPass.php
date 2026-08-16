<?php

require_once '../../headers.php';
require_once 'walletPassHelpers.php';

set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['success' => false, 'message' => 'Method Not Allowed', 'code' => 405]);
        exit;
    }

    if (!wallet_is_configured()) {
        echo json_encode(['success' => false, 'message' => 'Wallet passes are not available', 'code' => 503]);
        exit;
    }

    $sessionId = get_bearer_token();

    if (!$sessionId) {
        echo json_encode(['success' => false, 'message' => 'Missing session', 'code' => 401]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed', 'code' => 500]);
        exit;
    }

    $conn->set_charset('utf8mb4');

    $stmt = $conn->prepare("SELECT auth_id FROM event_booking_sessions WHERE id = ?");
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $sessionRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$sessionRow) {
        echo json_encode(['success' => false, 'message' => 'Invalid session ID', 'code' => 401]);
        exit;
    }

    $stmt = $conn->prepare("SELECT booking_id FROM event_bookings WHERE auth_id = ?");
    $stmt->bind_param("i", $sessionRow['auth_id']);
    $stmt->execute();
    $bookingRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$bookingRow) {
        echo json_encode(['success' => false, 'message' => 'No booking found for this user', 'code' => 404]);
        exit;
    }

    $summary = wallet_booking_summary($conn, (int)$bookingRow['booking_id']);

    if (!$summary) {
        echo json_encode(['success' => false, 'message' => 'Booking details not found', 'code' => 404]);
        exit;
    }

    $applePassUrl = null;

    if (wallet_apple_is_configured()) {
        $applePassUrl = rtrim((string)wallet_config('pass_endpoint_url'), '?')
            . '?token=' . rawurlencode(wallet_make_pass_token($summary['booking_id']));
    }

    $googleWalletUrl = wallet_google_is_configured() ? wallet_google_save_url($summary) : null;

    echo json_encode([
        'success'         => ($applePassUrl !== null || $googleWalletUrl !== null),
        'code'            => 200,
        'applePassUrl'    => $applePassUrl,
        'googleWalletUrl' => $googleWalletUrl,
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'code' => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
