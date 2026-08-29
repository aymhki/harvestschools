<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';

const ADMIN_ACTION_DISPLAY_TIME_ZONE = 'Africa/Cairo';

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $ADMIN_USER_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $ADMIN_USER_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $headers = ["User ID", "Username", "Name", "Action", "Date & Time"];
    $storedZone = new DateTimeZone('UTC');
    $displayZone = new DateTimeZone(ADMIN_ACTION_DISPLAY_TIME_ZONE);
    $dataRows = [];

    $result = $conn->query(
        "SELECT user_id, username, name, action, created_at
         FROM admin_action_events
         ORDER BY created_at DESC, id DESC"
    );

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $dataRows[] = [
                $row['user_id'] === null ? '' : (string)$row['user_id'],
                (string)$row['username'],
                (string)$row['name'],
                (string)$row['action'],
                (new DateTime((string)$row['created_at'], $storedZone))->setTimezone($displayZone)->format('M j, Y g:i A')
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "data" => array_merge([$headers], $dataRows)
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
