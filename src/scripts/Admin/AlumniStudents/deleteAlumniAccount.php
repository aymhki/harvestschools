<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../alumniAuthHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $ALUMNI_STUDENTS_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $ALUMNI_STUDENTS_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $alumniId = (int)($data['alumni_id'] ?? 0);

    if ($alumniId <= 0) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing alumni id", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT username, storage_folder FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $alumniId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Alumni account not found", "code" => 404]);
        exit;
    }

    $alumniRow = $result->fetch_assoc();
    $stmt = $conn->prepare("DELETE FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $alumniId);
    $stmt->execute();
    $deleted = $stmt->affected_rows > 0;
    $stmt->close();

    if (!$deleted) {
        echo json_encode(["success" => false, "message" => "Could not delete the alumni account", "code" => 500]);
        exit;
    }

    alumni_delete_account_files($alumniRow['storage_folder']);

    echo json_encode([
        "success" => true,
        "message" => "The alumni account '" . $alumniRow['username'] . "', its posts, and its uploaded files were deleted.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
