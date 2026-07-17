<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            "success" => false,
            "message" => "Method Not Allowed",
            "code" => 405
        ]);
        exit;
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            "success" => false,
            "message" => "Connection failed: " . $conn->connect_error,
            "code" => 500
        ]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $sessionId = get_bearer_token_hash();
    $stmt = $conn->prepare("SELECT  p.permission_level_id FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id JOIN admin_users_permissions_linker p ON u.id = p.admin_user_id WHERE s.id = ?");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed: " . $conn->error,
            "code" => 500
        ]);
        exit;
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid session",
            "code" => 404
        ]);
        exit;
    }

    $row = array_column($result->fetch_all(MYSQLI_ASSOC), 'permission_level_id');
    $cleanPermissionLevels = array_map(fn($n) => (string)$n, $row);

    global $JACK_OF_ALL_TRADES;

    if (in_array($JACK_OF_ALL_TRADES, $cleanPermissionLevels)) {
        $sql = "SELECT permission_id FROM available_permissions";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $allPermissions = array_column($result->fetch_all(MYSQLI_ASSOC), 'permission_id');
        $cleanPermissionLevels = array_map(fn($n) => (string)$n, $allPermissions);
    }

    echo json_encode([
        "success" => true,
        "message" => "Permission levels retrieved successfully",
        "code" => 200,
        "cleanPermissionLevels" => $cleanPermissionLevels,
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500
    ]);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>