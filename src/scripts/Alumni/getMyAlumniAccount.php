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

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare(
        "SELECT id, username, name, email, position,
                DATE_FORMAT(graduation_date, '%Y-%m-%d') AS graduation_date,
                bio, profile_picture_link, account_status,
                DATE_FORMAT(created_at, '%b %e, %Y') AS created_label,
                DATE_FORMAT(last_login_at, '%b %e, %Y at %l:%i %p') AS last_login_label
         FROM alumni_students WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $profileResult = $stmt->get_result();
    $stmt->close();

    if ($profileResult->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    $profileRow = $profileResult->fetch_assoc();
    $profile = [
        "id"                 => (int)$profileRow['id'],
        "username"           => $profileRow['username'],
        "name"               => $profileRow['name'],
        "email"              => $profileRow['email'],
        "position"           => $profileRow['position'],
        "graduationDate"     => $profileRow['graduation_date'],
        "bio"                => $profileRow['bio'],
        "profilePictureLink" => $profileRow['profile_picture_link'],
        "accountStatus"      => $profileRow['account_status'],
        "memberSince"        => $profileRow['created_label'],
        "lastLogin"          => $profileRow['last_login_label'],
    ];

    $stmt = $conn->prepare(
        "SELECT id, new_username, new_name, new_email, new_position,
                DATE_FORMAT(new_graduation_date, '%Y-%m-%d') AS new_graduation_date,
                new_bio, new_profile_picture_link, status, admin_note,
                DATE_FORMAT(created_at, '%b %e, %Y at %l:%i %p') AS created_label,
                DATE_FORMAT(reviewed_at, '%b %e, %Y at %l:%i %p') AS reviewed_label
         FROM alumni_profile_updates
         WHERE alumni_id = ?
         ORDER BY created_at DESC
         LIMIT 5"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $updatesResult = $stmt->get_result();
    $stmt->close();

    $pendingUpdate = null;
    $updateHistory = [];

    while ($row = $updatesResult->fetch_assoc()) {
        $entry = [
            "id"                    => (int)$row['id'],
            "newUsername"           => $row['new_username'],
            "newName"               => $row['new_name'],
            "newEmail"              => $row['new_email'],
            "newPosition"           => $row['new_position'],
            "newGraduationDate"     => $row['new_graduation_date'],
            "newBio"                => $row['new_bio'],
            "newProfilePictureLink" => $row['new_profile_picture_link'],
            "status"                => $row['status'],
            "adminNote"             => $row['admin_note'],
            "submittedAt"           => $row['created_label'],
            "reviewedAt"            => $row['reviewed_label'],
        ];

        if ($row['status'] === 'pending' && $pendingUpdate === null) {
            $pendingUpdate = $entry;
        } else {
            $updateHistory[] = $entry;
        }
    }

    $stmt = $conn->prepare(
        "SELECT id, title, content, status, show_on_home, show_on_alumni_page, admin_note,
                DATE_FORMAT(created_at, '%b %e, %Y') AS created_label,
                DATE_FORMAT(reviewed_at, '%b %e, %Y') AS reviewed_label
         FROM alumni_posts
         WHERE alumni_id = ?
         ORDER BY created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $postsResult = $stmt->get_result();
    $stmt->close();

    $posts = [];
    $postIds = [];

    while ($row = $postsResult->fetch_assoc()) {
        $postId = (int)$row['id'];
        $postIds[] = $postId;
        $posts[$postId] = [
            "id"               => $postId,
            "title"            => $row['title'],
            "content"          => $row['content'],
            "status"           => $row['status'],
            "showOnHome"       => (int)$row['show_on_home'] === 1,
            "showOnAlumniPage" => (int)$row['show_on_alumni_page'] === 1,
            "adminNote"        => $row['admin_note'],
            "createdAt"        => $row['created_label'],
            "reviewedAt"       => $row['reviewed_label'],
            "pendingEdit"      => null,
        ];
    }

    if (!empty($postIds)) {
        $placeholders = implode(',', array_fill(0, count($postIds), '?'));
        $types = str_repeat('i', count($postIds) + 1);
        $stmt = $conn->prepare(
            "SELECT id, post_id, new_title, new_content, status, admin_note,
                    DATE_FORMAT(created_at, '%b %e, %Y') AS created_label
             FROM alumni_post_updates
             WHERE alumni_id = ? AND post_id IN ({$placeholders})
             ORDER BY created_at DESC"
        );
        $params = array_merge([$userId], $postIds);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $editsResult = $stmt->get_result();
        $stmt->close();

        while ($row = $editsResult->fetch_assoc()) {
            $postId = (int)$row['post_id'];

            if (isset($posts[$postId]) && $posts[$postId]['pendingEdit'] === null) {
                if ($row['status'] === 'pending' || $row['status'] === 'rejected') {
                    $posts[$postId]['pendingEdit'] = [
                        "id"          => (int)$row['id'],
                        "newTitle"    => $row['new_title'],
                        "newContent"  => $row['new_content'],
                        "status"      => $row['status'],
                        "adminNote"   => $row['admin_note'],
                        "submittedAt" => $row['created_label'],
                    ];
                }
            }
        }
    }

    $stmt = $conn->prepare(
        "SELECT id, label, DATE_FORMAT(created_at, '%b %e, %Y') AS created_label
         FROM alumni_passkeys WHERE user_id = ? ORDER BY created_at DESC"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $passkeysResult = $stmt->get_result();
    $stmt->close();

    $passkeys = [];

    while ($row = $passkeysResult->fetch_assoc()) {
        $passkeys[] = [
            "id"        => (int)$row['id'],
            "label"     => $row['label'],
            "createdAt" => $row['created_label'],
        ];
    }

    echo json_encode([
        "success"       => true,
        "message"       => "Account retrieved successfully",
        "code"          => 200,
        "profile"       => $profile,
        "pendingUpdate" => $pendingUpdate,
        "updateHistory" => $updateHistory,
        "posts"         => array_values($posts),
        "passkeys"      => $passkeys,
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
