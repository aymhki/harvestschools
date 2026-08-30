<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniAuthHelpers.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if (!public_rate_limit_allow('alumni-public-profile', 60, 60)) {
        public_rate_limit_reject();
    }

    $username = trim((string)($_GET['username'] ?? ''));

    if ($username === '' || alumni_validate_username($username) !== null) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "This alumni profile could not be found", "code" => 404]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $stmt = $conn->prepare(
        "SELECT a.id, a.username, a.name, a.position, a.bio, a.profile_picture_link,
                DATE_FORMAT(a.graduation_date, '%Y') AS graduation_year
         FROM alumni_students a
         WHERE a.username = ?
           AND a.account_status = 'approved'
           AND NOT EXISTS (
               SELECT 1 FROM alumni_deletion_requests d
               WHERE d.alumni_id = a.id AND d.status = 'pending'
           )"
    );
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $accountResult = $stmt->get_result();
    $stmt->close();

    if ($accountResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "This alumni profile could not be found", "code" => 404]);
        exit;
    }

    $account = $accountResult->fetch_assoc();

    $stmt = $conn->prepare(
        "SELECT p.id, p.title, p.content,
                DATE_FORMAT(COALESCE(p.reviewed_at, p.created_at), '%b %e, %Y') AS published_at,
                DATE_FORMAT(COALESCE(p.reviewed_at, p.created_at), '%Y-%m-%dT%H:%i:%s') AS published_at_iso
         FROM alumni_posts p
         WHERE p.alumni_id = ?
           AND p.status = 'approved'
           AND p.show_on_profile = 1
         ORDER BY COALESCE(p.reviewed_at, p.created_at) DESC"
    );
    $stmt->bind_param("i", $account['id']);
    $stmt->execute();
    $postsResult = $stmt->get_result();
    $stmt->close();

    $posts = [];

    while ($row = $postsResult->fetch_assoc()) {
        $posts[] = [
            "id"                   => (int)$row['id'],
            "title"                => $row['title'],
            "content"              => $row['content'],
            "publishedAt"          => $row['published_at'],
            "publishedAtIso"       => $row['published_at_iso'],
            "authorName"           => $account['name'],
            "authorUsername"       => $account['username'],
            "authorPosition"       => $account['position'],
            "authorGraduationYear" => $account['graduation_year'],
            "authorProfilePicture" => $account['profile_picture_link'],
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Profile retrieved successfully",
        "code"    => 200,
        "profile" => [
            "username"       => $account['username'],
            "name"           => $account['name'],
            "position"       => $account['position'],
            "graduationYear" => $account['graduation_year'],
            "bio"            => $account['bio'] === null ? '' : $account['bio'],
            "profilePicture" => $account['profile_picture_link'],
        ],
        "posts"   => $posts
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
