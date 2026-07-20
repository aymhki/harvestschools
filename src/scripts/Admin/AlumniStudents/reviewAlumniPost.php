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

    $sessionCheck = validate_admin_session($conn);
    $adminUserId = $sessionCheck['success'] ? (int)$sessionCheck['user_id'] : null;

    $data = json_decode(file_get_contents('php://input'), true);

    $postId    = (int)($data['post_id'] ?? 0);
    $target    = (string)($data['target'] ?? 'post');
    $decision  = (string)($data['decision'] ?? '');
    $adminNote = mb_substr(trim((string)($data['admin_note'] ?? '')), 0, 500);

    if ($postId <= 0 || !in_array($decision, ['approved', 'rejected'], true) || !in_array($target, ['post', 'edit'], true)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing post id or an invalid decision", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT p.title, p.status, a.name AS author_name, a.email AS author_email
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
    $noteLine = $adminNote !== '' ? "\n\nNote from the school: {$adminNote}" : '';

    if ($target === 'post') {
        if ($postRow['status'] !== 'pending') {
            echo json_encode(["success" => false, "message" => "This post has already been reviewed", "code" => 400]);
            exit;
        }

        $stmt = $conn->prepare(
            "UPDATE alumni_posts
             SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by = ?
             WHERE id = ?"
        );
        $stmt->bind_param("ssii", $decision, $adminNote, $adminUserId, $postId);
        $stmt->execute();
        $stmt->close();

        if ($decision === 'approved') {
            $subject = 'Your alumni post was approved';
            $body = "Hello {$postRow['author_name']},\n\n"
                . "Your post '{$postRow['title']}' was approved and is now visible on your alumni profile. "
                . "The school may also feature it on the home page or the alumni students page." . $noteLine;
        } else {
            $subject = 'An update about your alumni post';
            $body = "Hello {$postRow['author_name']},\n\n"
                . "Your post '{$postRow['title']}' was not approved. "
                . "You can edit it from your profile page and re-submit it for another review." . $noteLine;
        }

        $reviewedThing = 'post';
    } else {
        $stmt = $conn->prepare(
            "SELECT id, new_title, new_content FROM alumni_post_updates
             WHERE post_id = ? AND status = 'pending'
             ORDER BY created_at DESC LIMIT 1"
        );
        $stmt->bind_param("i", $postId);
        $stmt->execute();
        $editResult = $stmt->get_result();
        $stmt->close();

        if ($editResult->num_rows === 0) {
            echo json_encode(["success" => false, "message" => "This post has no pending edit to review", "code" => 404]);
            exit;
        }

        $editRow = $editResult->fetch_assoc();
        $editId  = (int)$editRow['id'];

        $conn->begin_transaction();

        if ($decision === 'approved') {
            $stmt = $conn->prepare("UPDATE alumni_posts SET title = ?, content = ? WHERE id = ?");
            $stmt->bind_param("ssi", $editRow['new_title'], $editRow['new_content'], $postId);
            $stmt->execute();
            $stmt->close();
        }

        $stmt = $conn->prepare(
            "UPDATE alumni_post_updates
             SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by = ?
             WHERE id = ?"
        );
        $stmt->bind_param("ssii", $decision, $adminNote, $adminUserId, $editId);
        $stmt->execute();
        $stmt->close();

        $conn->commit();

        if ($decision === 'approved') {
            $subject = 'Your alumni post edit was approved';
            $body = "Hello {$postRow['author_name']},\n\n"
                . "The edit you submitted for your post '{$editRow['new_title']}' was approved and the post is now updated." . $noteLine;
        } else {
            $subject = 'An update about your alumni post edit';
            $body = "Hello {$postRow['author_name']},\n\n"
                . "The edit you submitted for your post '{$postRow['title']}' was not approved, so the currently published version stays as it is. "
                . "You can submit another edit from your profile page at any time." . $noteLine;
        }

        $reviewedThing = 'post edit';
    }

    alumni_send_email($postRow['author_email'], $subject, $body);

    echo json_encode([
        "success" => true,
        "message" => "The " . $reviewedThing . " was " . $decision . " and the alumni student was notified by email.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof mysqli) { @$conn->rollback(); }
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
