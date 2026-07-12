<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../authHelpers.php';
$dbConfig = require '../../../../configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username   = $dbConfig['db_username'];
$password   = $dbConfig['db_password'];
$dbname     = $dbConfig['db_name'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $OPEN_DAY_SIGNUP_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $OPEN_DAY_SIGNUP_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
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
        'ID',
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


    echo json_encode([
        'success'       => true,
        'data'          => $rows,
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