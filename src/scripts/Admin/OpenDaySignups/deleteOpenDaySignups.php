<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../authHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
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

    $deleteSql = "DELETE FROM open_day_registrations";
    $conn->query($deleteSql);

    $deleteSql = "DELETE FROM open_day_children";
    $conn->query($deleteSql);

    echo json_encode([
        'success' => true,
        'message' => 'Registrations deleted successfully',
        'code'    => 200
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