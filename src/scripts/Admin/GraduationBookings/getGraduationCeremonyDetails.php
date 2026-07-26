<?php

require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../graduationCeremonyHelpers.php';
require_once '../authHelpers.php';

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

set_cors_headers();

$conn = null;

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error, 'code' => 500]);
        exit;
    }

    $conn->set_charset('utf8mb4');

    global $GRADUATION_BOOKING_MANAGEMENT;

    $authStatus = check_admin_user_permission($conn, $GRADUATION_BOOKING_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    echo json_encode([
        'success' => true,
        'code'    => 200,
        'details' => graduation_ceremony_details($conn),
    ]);

} catch (Throwable $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'code' => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
