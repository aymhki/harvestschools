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

    if (empty($_FILES) || !isset($_FILES['image'])) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing image file", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT COUNT(*) AS c FROM alumni_uploaded_images WHERE alumni_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $uploadCount = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($uploadCount >= (int)alumni_config('max_uploaded_images_per_user')) {
        echo json_encode(["success" => false, "message" => "You have reached the maximum number of uploaded images for your account", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT storage_folder FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $folderRow = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$folderRow) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    [$stored, $resultValue] = alumni_store_uploaded_image($_FILES['image'], $folderRow['storage_folder'], 'posts');

    if (!$stored) {
        echo json_encode(["success" => false, "message" => $resultValue, "code" => 400]);
        exit;
    }

    $kind = 'post';
    $stmt = $conn->prepare("INSERT INTO alumni_uploaded_images (alumni_id, file_path, kind) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $userId, $resultValue, $kind);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success"  => true,
        "message"  => "Image uploaded successfully",
        "code"     => 200,
        "filePath" => $resultValue
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
