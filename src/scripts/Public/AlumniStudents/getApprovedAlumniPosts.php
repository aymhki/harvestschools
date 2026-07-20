<?php
require_once '../../headers.php';
require_once '../../alumniAuthHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $placement = isset($_GET['placement']) ? (string)$_GET['placement'] : 'alumni-page';
    $limit     = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;

    if ($limit < 0 || $limit > 100) { $limit = 0; }

    if ($placement === 'home') {
        $placementCondition = "p.show_on_home = 1";
    } else {
        $placementCondition = "p.show_on_alumni_page = 1";
    }

    $sql =
        "SELECT p.id, p.title, p.content,
                DATE_FORMAT(COALESCE(p.reviewed_at, p.created_at), '%b %e, %Y') AS published_at,
                a.name AS author_name,
                a.username AS author_username,
                a.position AS author_position,
                DATE_FORMAT(a.graduation_date, '%Y') AS author_graduation_year,
                a.profile_picture_link AS author_profile_picture
         FROM alumni_posts p
         JOIN alumni_students a ON a.id = p.alumni_id
         WHERE p.status = 'approved'
           AND a.account_status = 'approved'
           AND {$placementCondition}
         ORDER BY COALESCE(p.reviewed_at, p.created_at) DESC";

    if ($limit > 0) {
        $sql .= " LIMIT " . $limit;
    }

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["success" => false, "message" => "Query failed: " . $conn->error, "code" => 500]);
        exit;
    }

    $posts = [];

    while ($row = $result->fetch_assoc()) {
        $posts[] = [
            "id"                   => (int)$row['id'],
            "title"                => $row['title'],
            "content"              => $row['content'],
            "publishedAt"          => $row['published_at'],
            "authorName"           => $row['author_name'],
            "authorUsername"       => $row['author_username'],
            "authorPosition"       => $row['author_position'],
            "authorGraduationYear" => $row['author_graduation_year'],
            "authorProfilePicture" => $row['author_profile_picture'],
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Posts retrieved successfully",
        "code"    => 200,
        "posts"   => $posts
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
