<?
require_once '../../headers.php';
set_cors_headers();
$dbConfig = require '../../dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];


try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing session_id",
            "code" => 400
        ]);
        exit;
    }

    $sessionId = $data['session_id'];

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");


    $stmt = $conn->prepare("SELECT u.permission_level FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.id = ?");
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Prepare failed: " . $conn->error, "code" => 500]);
        exit;
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows == 0) {
        echo json_encode(["success" => false, "message" => "Invalid session", "code" => 401]);
        exit;
    }

    $permissionRow = $permissionResult->fetch_assoc();
    $cleanPermissionLevels = array_map('intval', explode(',', $permissionRow['permission_level']));

    if (!in_array(1000, $cleanPermissionLevels, true)) {
        echo json_encode(["success" => false, "message" => "Permission denied", "code" => 403]);
        exit;
    }

    $sql = "SELECT * FROM admin_users";

    $result = $conn->query($sql);

    $headers = [
        "ID", "Username", "Name", "Password Hash", "Permission Level"
    ];


    $dataRows = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $rowData = array_values($row);
            foreach($fileLinkIndices as $index) {
                if (!empty($rowData[$index])) {
                    $rowData[$index] = urlencode($rowData[$index]);
                }
            }
            $dataRows[] = $rowData;
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
    if (isset($conn) ) {
        $conn->close();
    }
}
?>