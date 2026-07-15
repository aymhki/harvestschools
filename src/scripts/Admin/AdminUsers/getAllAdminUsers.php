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

    $permissionsMap = [];
    $permResult = $conn->query("SELECT permission_id, permission_name, description FROM available_permissions");
    if ($permResult && $permResult->num_rows > 0) {
        while ($pRow = $permResult->fetch_assoc()) {
            $permissionsMap[(string)$pRow['permission_id']] = [
                'name' => $pRow['permission_name'],
                'description' => $pRow['description']
            ];
        }
    }

    $sql = "SELECT id, username, name, email FROM admin_users";
    $result = $conn->query($sql);

    $headers = ["User ID", "Username", "Name", "Email", "Permissions", "Permissions In Numbers"];


    $dataRows = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $sql = "SELECT permission_level_id FROM admin_users_permissions_linker WHERE admin_user_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $row["id"]);
            $stmt->execute();
            $permissionResult = $stmt->get_result();
            $originalPermissions = array_map(fn($n)=> (string)$n, array_column($permissionResult->fetch_all(MYSQLI_ASSOC), 'permission_level_id'));

            if (count($originalPermissions) > 0) {
                $permNames = [];

                foreach ($originalPermissions as $id) {
                    $permNames[] = isset($permissionsMap[$id]) ? $permissionsMap[$id]['name'] : $id;
                }

                $row['permission_level'] = implode(', ', $permNames);
            }

            $row['permissions_in_numbers'] = implode(', ',  $originalPermissions);

            $rowData = array_values($row);
            $dataRows[] = $rowData;
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "data" => array_merge([$headers], $dataRows),
        "permissionsDict" => $permissionsMap
    ]);


} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) ) {
        $conn->close();
    }
}
?>