<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $authorisation = gallery_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $photoId = (int)($data['photo_id'] ?? 0);

    $stmt = $conn->prepare(
        "SELECT p.id, p.file_name, c.folder_name
         FROM gallery_photos p JOIN gallery_collages c ON c.id = p.collage_id
         WHERE p.id = ?"
    );
    $stmt->bind_param("i", $photoId);
    $stmt->execute();
    $photo = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$photo) {
        echo json_encode(gallery_error('That photo does not exist.', 404));
        exit;
    }

    $directory = gallery_photos_directory((string)$photo['folder_name']);

    if ($directory !== null) {
        gallery_delete_file($directory . $photo['file_name']);
    }

    $stmt = $conn->prepare("DELETE FROM gallery_photos WHERE id = ?");
    $stmt->bind_param("i", $photoId);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Photo deleted.", "code" => 200]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
