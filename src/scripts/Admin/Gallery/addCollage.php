<?php
require_once '../../headers.php';
require_once __DIR__ . '/galleryHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
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

    $titleEn = gallery_trim($_POST['title_en'] ?? '', 255);
    $titleAr = gallery_trim($_POST['title_ar'] ?? '', 255);
    $layout = ($_POST['layout'] ?? 'wide') === 'narrow' ? 'narrow' : 'wide';

    if ($titleEn === '' || $titleAr === '') {
        echo json_encode(gallery_error('Both the English and the Arabic title are required.', 400));
        exit;
    }

    $files = gallery_uploaded_files('photos');

    $folderName = gallery_unique_folder_name($conn, gallery_folder_name_from_title($titleEn));
    $sortOrder = gallery_next_sort_order($conn, 'gallery_collages');

    $stmt = $conn->prepare(
        "INSERT INTO gallery_collages (folder_name, sort_order, title_en, title_ar, layout) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sisss", $folderName, $sortOrder, $titleEn, $titleAr, $layout);
    $stmt->execute();
    $collageId = (int)$conn->insert_id;
    $stmt->close();

    $mediaDate = null;

    if ($files !== []) {
        foreach ($files as $file) {
            $takenAt = gallery_photo_taken_at($file['tmp_name'] ?? '');

            if ($takenAt !== null && ($mediaDate === null || strtotime($takenAt) < strtotime($mediaDate))) {
                $mediaDate = $takenAt;
            }
        }

        $stored = gallery_store_photos($conn, gallery_collage_by_id($conn, $collageId), $files);

        if (!$stored['success']) {
            echo json_encode($stored);
            exit;
        }

        gallery_set_media_date($conn, 'gallery_collages', $collageId, $mediaDate);
    }

    gallery_apply_placement(
        $conn,
        'gallery_collages',
        $collageId,
        gallery_placement_of($_POST['placement'] ?? ''),
        (int)($_POST['after_id'] ?? 0),
        $mediaDate
    );

    admin_log_action($conn, 'Added the gallery collage #' . $collageId . ' — Title (EN): "' . $titleEn . '"; Title (AR): "' . $titleAr . '"; Layout: ' . $layout . '; Photos: ' . (int)($stored['stored'] ?? 0) . '; Position: ' . admin_action_value($_POST['placement'] ?? '') . '.', ADMIN_ACTION_CATEGORY_GALLERY);
    echo json_encode([
        "success"   => true,
        "message"   => "Collage added.",
        "code"      => 200,
        "collageId" => $collageId,
        "mediaDate" => $mediaDate
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
