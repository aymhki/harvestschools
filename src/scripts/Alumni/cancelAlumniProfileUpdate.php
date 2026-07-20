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

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare(
        "SELECT u.new_profile_picture_link, a.profile_picture_link
         FROM alumni_profile_updates u
         JOIN alumni_students a ON a.id = u.alumni_id
         WHERE u.alumni_id = ? AND u.status = 'pending'"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "You have no pending profile update to cancel", "code" => 404]);
        exit;
    }

    $row = $result->fetch_assoc();
    $pendingPicture = $row['new_profile_picture_link'];
    $livePicture    = $row['profile_picture_link'];

    $stmt = $conn->prepare("DELETE FROM alumni_profile_updates WHERE alumni_id = ? AND status = 'pending'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    if ($pendingPicture !== null && $pendingPicture !== '' && $pendingPicture !== $livePicture) {
        alumni_delete_stored_file($pendingPicture);

        $stmt = $conn->prepare("DELETE FROM alumni_uploaded_images WHERE alumni_id = ? AND file_path = ?");
        $stmt->bind_param("is", $userId, $pendingPicture);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode(["success" => true, "message" => "Your pending profile update was cancelled.", "code" => 200]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
