<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
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

    $postId           = (int)($data['post_id'] ?? 0);
    $showOnHome       = !empty($data['show_on_home']) ? 1 : 0;
    $showOnAlumniPage = !empty($data['show_on_alumni_page']) ? 1 : 0;

    if ($postId <= 0) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing post id", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT status FROM alumni_posts WHERE id = ?");
    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Post not found", "code" => 404]);
        exit;
    }

    $postRow = $result->fetch_assoc();

    if ($postRow['status'] !== 'approved' && ($showOnHome === 1 || $showOnAlumniPage === 1)) {
        echo json_encode(["success" => false, "message" => "Only approved posts can be placed on the home page or the alumni students page", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("UPDATE alumni_posts SET show_on_home = ?, show_on_alumni_page = ? WHERE id = ?");
    $stmt->bind_param("iii", $showOnHome, $showOnAlumniPage, $postId);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "The post placement was updated.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
