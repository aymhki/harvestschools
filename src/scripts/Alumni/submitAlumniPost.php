<?php
require_once '../headers.php';
require_once '../alumniAuthHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_alumni_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data = json_decode(file_get_contents('php://input'), true);

    $title   = mb_substr(trim((string)($data['title'] ?? '')), 0, 200);
    $content = trim((string)($data['content'] ?? ''));

    if ($title === '' || $content === '') {
        echo json_encode(["success" => false, "message" => "Both a title and content are required", "code" => 400]);
        exit;
    }

    if (mb_strlen($content) > 100000) {
        echo json_encode(["success" => false, "message" => "Post content is too long", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM alumni_posts WHERE alumni_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $postCount = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($postCount >= (int)alumni_config('max_posts_per_user')) {
        echo json_encode(["success" => false, "message" => "You have reached the maximum number of posts for your account", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO alumni_posts (alumni_id, title, content, status) VALUES (?, ?, ?, 'pending')");
    $stmt->bind_param("iss", $userId, $title, $content);

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Could not submit the post: " . $stmt->error, "code" => 500]);
        exit;
    }

    $newPostId = (int)$conn->insert_id;
    $stmt->close();

    $stmt = $conn->prepare("SELECT username FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $usernameRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $adminBody = "Alumni student '" . ($usernameRow['username'] ?? '') . "' submitted a new post titled '{$title}' that is awaiting approval.\n\n"
        . "Review it from the Alumni Students page in the admin dashboard:\n"
        . "https://admin.harvestschools.com/alumni-students-management";

    alumni_send_email(alumni_config('admin_notification_email'), 'New Alumni Post Awaiting Approval', $adminBody);

    echo json_encode([
        "success" => true,
        "message" => "Your post was submitted and is awaiting approval from the school.",
        "code"    => 200,
        "postId"  => $newPostId
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
