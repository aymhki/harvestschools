<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

$conn = null;

try {
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

    $headers = ["ID", "Author", "Title", "Status", "Pending Edit", "On Home Page", "On Alumni Page", "Created", "Reviewed"];
    $rows = [];
    $postRecordsById = [];

    $sql =
        "SELECT p.id, p.alumni_id, p.title, p.content, p.status, p.show_on_home, p.show_on_alumni_page, p.admin_note,
                DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS created_label,
                DATE_FORMAT(p.reviewed_at, '%Y-%m-%d %H:%i') AS reviewed_label,
                a.username AS author_username, a.name AS author_name, a.email AS author_email,
                a.position AS author_position,
                DATE_FORMAT(a.graduation_date, '%Y') AS author_graduation_year,
                a.profile_picture_link AS author_profile_picture,
                e.id AS edit_id, e.new_title AS edit_title, e.new_content AS edit_content,
                DATE_FORMAT(e.created_at, '%Y-%m-%d %H:%i') AS edit_created_label
         FROM alumni_posts p
         JOIN alumni_students a ON a.id = p.alumni_id
         LEFT JOIN alumni_post_updates e ON e.post_id = p.id AND e.status = 'pending'
         ORDER BY (p.status = 'pending') DESC, (e.id IS NOT NULL) DESC, p.created_at DESC";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["success" => false, "message" => "Query failed: " . $conn->error, "code" => 500]);
        exit;
    }

    while ($row = $result->fetch_assoc()) {
        $postId = (int)$row['id'];
        $hasPendingEdit = $row['edit_id'] !== null;

        $rows[] = [
            (string)$postId,
            (string)$row['author_username'],
            (string)$row['title'],
            ucfirst((string)$row['status']),
            $hasPendingEdit ? 'Yes' : 'No',
            ((int)$row['show_on_home'] === 1) ? 'Yes' : 'No',
            ((int)$row['show_on_alumni_page'] === 1) ? 'Yes' : 'No',
            (string)$row['created_label'],
            (string)($row['reviewed_label'] ?? ''),
        ];

        $postRecordsById[(string)$postId] = [
            "id"                   => $postId,
            "alumniId"             => (int)$row['alumni_id'],
            "title"                => $row['title'],
            "content"              => $row['content'],
            "status"               => $row['status'],
            "showOnHome"           => (int)$row['show_on_home'] === 1,
            "showOnAlumniPage"     => (int)$row['show_on_alumni_page'] === 1,
            "adminNote"            => $row['admin_note'],
            "createdAt"            => $row['created_label'],
            "reviewedAt"           => $row['reviewed_label'],
            "authorUsername"       => $row['author_username'],
            "authorName"           => $row['author_name'],
            "authorEmail"          => $row['author_email'],
            "authorPosition"       => $row['author_position'],
            "authorGraduationYear" => $row['author_graduation_year'],
            "authorProfilePicture" => $row['author_profile_picture'],
            "pendingEdit"          => $hasPendingEdit ? [
                "id"          => (int)$row['edit_id'],
                "newTitle"    => $row['edit_title'],
                "newContent"  => $row['edit_content'],
                "submittedAt" => $row['edit_created_label'],
            ] : null,
        ];
    }

    echo json_encode([
        "success"         => true,
        "message"         => "Data retrieved successfully",
        "code"            => 200,
        "postsData"       => array_merge([$headers], $rows),
        "postRecordsById" => $postRecordsById,
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
