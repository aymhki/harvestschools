<?php
require_once '../headers.php';
require_once 'alumniAuthHelpers.php';
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

    $postId  = (int)($data['post_id'] ?? 0);
    $title   = mb_substr(trim((string)($data['title'] ?? '')), 0, 200);
    $content = trim((string)($data['content'] ?? ''));

    if ($postId <= 0 || $title === '' || $content === '') {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing post id, title, or content", "code" => 400]);
        exit;
    }

    if (mb_strlen($content) > 100000) {
        echo json_encode(["success" => false, "message" => "Post content is too long", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT status, title, content FROM alumni_posts WHERE id = ? AND alumni_id = ?");
    $stmt->bind_param("ii", $postId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Post not found", "code" => 404]);
        exit;
    }

    $postRow = $result->fetch_assoc();

    if ($postRow['status'] === 'pending' || $postRow['status'] === 'rejected') {
        // The post has never been published: edit it in place. Editing a
        // rejected post re-submits it for approval with the new content.
        $stmt = $conn->prepare(
            "UPDATE alumni_posts
             SET title = ?, content = ?, status = 'pending', admin_note = '', reviewed_at = NULL, reviewed_by = NULL
             WHERE id = ? AND alumni_id = ?"
        );
        $stmt->bind_param("ssii", $title, $content, $postId, $userId);
        $stmt->execute();
        $stmt->close();

        $message = $postRow['status'] === 'rejected'
            ? "Your post was updated and re-submitted for approval."
            : "Your pending post was updated.";
    } else {
        if ($title === (string)$postRow['title'] && $content === (string)$postRow['content']) {
            echo json_encode(["success" => false, "message" => "No changes were made to the post", "code" => 400]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM alumni_post_updates WHERE post_id = ? AND alumni_id = ? AND status = 'pending'");
        $stmt->bind_param("ii", $postId, $userId);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare(
            "INSERT INTO alumni_post_updates (post_id, alumni_id, new_title, new_content, status)
             VALUES (?, ?, ?, ?, 'pending')"
        );
        $stmt->bind_param("iiss", $postId, $userId, $title, $content);

        if (!$stmt->execute()) {
            echo json_encode(["success" => false, "message" => "Could not submit the edit: " . $stmt->error, "code" => 500]);
            exit;
        }

        $stmt->close();
        $message = "Your edit was submitted and is awaiting approval. The current version of the post stays visible until the edit is reviewed.";
    }

    $stmt = $conn->prepare("SELECT username FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $usernameRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $adminBody = "Alumni student '" . ($usernameRow['username'] ?? '') . "' submitted a post edit for '{$title}' that is awaiting approval.\n\n"
        . "Review it from the Alumni Students page in the admin dashboard:\n"
        . "https://admin.harvestschools.com/alumni-students-management";

    alumni_send_email(alumni_config('admin_notification_email'), 'Alumni Post Edit Awaiting Approval', $adminBody);

    echo json_encode(["success" => true, "message" => $message, "code" => 200]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
