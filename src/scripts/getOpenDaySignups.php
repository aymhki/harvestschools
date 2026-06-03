<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username   = $dbConfig['db_username'];
$password   = $dbConfig['db_password'];
$dbname     = $dbConfig['db_name'];

try {
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    if (!isset($data['session_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Bad Request: Missing session_id',
            'code'    => 400
        ]);
        exit;
    }

    $sessionId = $data['session_id'];
    $startTime = microtime(true);

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed: ' . $conn->connect_error,
            'code'    => 500
        ]);
        exit;
    }
    $conn->set_charset('utf8mb4');

    $permissionSql = "SELECT u.permission_level
                      FROM admin_sessions s
                      JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                      WHERE s.id = ?";
    $stmt = $conn->prepare($permissionSql);

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Prepare failed: ' . $conn->error,
            'code'    => 500
        ]);
        exit;
    }

    $stmt->bind_param('s', $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid session',
            'code'    => 401
        ]);
        exit;
    }

    $permissionRow        = $permissionResult->fetch_assoc();
    $permissionLevels     = explode(',', $permissionRow['permission_level']);
    $cleanPermissionLevels = array_map(fn($l) => intval(trim($l)), $permissionLevels);

    if (!in_array(2, $cleanPermissionLevels)) {
        echo json_encode([
            'success' => false,
            'message' => 'Permission denied',
            'code'    => 403
        ]);
        exit;
    }

    $registrationsSql = "SELECT registration_id, parent_name, parent_phone, total_children, total_cost, payment_status, created_at AS registration_created FROM open_day_registrations ORDER BY registration_id";

    $registrationsResult = $conn->query($registrationsSql);

    if (!$registrationsResult) {
        echo json_encode([
            'success' => false,
            'message' => 'Query failed: ' . $conn->error,
            'code'    => 500
        ]);
        exit;
    }

    $rows = [];

    $headers = [
        'Registration ID',
        'Registration Created',
        'Parent Name',
        'Parent Phone',
        'Total Children',
        'Child Names',
        'Child Ages',
        'Children Created',
        'Payment Status',
        'Total Cost'
    ];

    $rows[] = $headers;

    $childrenSql = "SELECT child_id, child_name, age, created_at FROM open_day_children WHERE registration_id = ? ORDER BY child_id";
    $stmtChildren = $conn->prepare($childrenSql);

    if (!$stmtChildren) {
        echo json_encode([
            'success' => false,
            'message' => 'Prepare failed: ' . $conn->error,
            'code'    => 500
        ]);
        exit;
    }

    while ($registration = $registrationsResult->fetch_assoc()) {
        $stmtChildren->bind_param('i', $registration['registration_id']);
        $stmtChildren->execute();
        $childrenResult = $stmtChildren->get_result();

        $childNames    = [];
        $childAges     = [];
        $childCreated  = [];

        while ($child = $childrenResult->fetch_assoc()) {
            $childNames[]   = $child['child_name'];
            $childAges[]    = $child['age'];
            $childCreated[] = $child['created_at'];
        }

        $childrenResult->free();

        $totalCostFormatted = number_format(intval($registration['total_cost']), 2, '.', '') . ' EGP';

        $rows[] = [
            $registration['registration_id'],
            $registration['registration_created'],
            $registration['parent_name'],
            $registration['parent_phone'],
            $registration['total_children'],
            implode(', ', $childNames),
            implode(', ', $childAges),
            implode(', ', $childCreated),
            $registration['payment_status'],
            $totalCostFormatted
        ];
    }

    $stmtChildren->close();

    $endTime       = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    echo json_encode([
        'success'       => true,
        'data'          => $rows,
        'executionTime' => $executionTime
    ]);

} catch (Exception $e) {

    $statusCode = $e->getCode() ?: 500;
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code'    => $statusCode
    ]);

} finally {

    if (isset($conn) && $conn) {
        $conn->close();
    }

}
?>