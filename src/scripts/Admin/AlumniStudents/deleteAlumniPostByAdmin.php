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
    $postId = (int)($data['post_id'] ?? 0);
    $notifyAuthor = !empty($data['notify_author']);
    $adminNote = mb_substr(trim((string)($data['admin_note'] ?? '')), 0, 500);

    if ($postId <= 0) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing post id", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT p.title, a.name AS author_name, a.email AS author_email
         FROM alumni_posts p
         JOIN alumni_students a ON a.id = p.alumni_id
         WHERE p.id = ?"
    );
    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Post not found", "code" => 404]);
        exit;
    }

    $postRow = $result->fetch_assoc();

    $stmt = $conn->prepare("DELETE FROM alumni_posts WHERE id = ?");
    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $deleted = $stmt->affected_rows > 0;
    $stmt->close();

    if (!$deleted) {
        echo json_encode(["success" => false, "message" => "Could not delete the post", "code" => 500]);
        exit;
    }

    if ($notifyAuthor) {
        $noteLine = $adminNote !== '' ? "\n\nNote from the school: {$adminNote}" : '';
        $body = "Hello {$postRow['author_name']},\n\n"
            . "Your post '{$postRow['title']}' was removed from the alumni platform by the school management." . $noteLine;

        alumni_send_email($postRow['author_email'], 'Your alumni post was removed', $body);
    }

    echo json_encode([
        "success" => true,
        "message" => "The post was deleted" . ($notifyAuthor ? " and the alumni student was notified by email." : "."),
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
