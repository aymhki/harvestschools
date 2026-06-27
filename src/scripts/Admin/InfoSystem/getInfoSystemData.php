<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
set_cors_headers();

$dbConfig = require '../../dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];
$dbEncryptionKeyPhrase = $dbConfig['encryption_key_phrase'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }
    $conn->set_charset("utf8mb4");

    $authStatus = check_user_permission($conn, 7);
    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $settings = [];
    $stmt = $conn->prepare("SELECT setting_key, IF(is_encrypted, CAST(AES_DECRYPT(UNHEX(setting_value), ?) AS CHAR), setting_value) AS val, is_encrypted, description FROM info_system_global_settings");
    $stmt->bind_param("s", $dbEncryptionKeyPhrase);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $settings[] = $row;
    }
    $stmt->close();

    $departments = [];
    $res = $conn->query("SELECT * FROM info_system_departments");
    while ($row = $res->fetch_assoc()) {
        $departments[] = $row;
    }

    $stages = [];
    $res = $conn->query("SELECT * FROM info_system_stages ORDER BY dept_key, sort_order ASC");
    while ($row = $res->fetch_assoc()) {
        $stages[] = $row;
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "data" => [
            "settings" => $settings,
            "departments" => $departments,
            "stages" => $stages
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>