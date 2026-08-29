<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/academicCalendarHelpers.php';
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
    $authorisation = calendar_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $calendarKey = calendar_trim($_POST['calendar_key'] ?? '', 32);
    $academicYear = calendar_trim($_POST['academic_year'] ?? '', 9);

    if (!academic_calendar_exists($calendarKey) || !calendar_may_edit($authorisation, $calendarKey)) {
        echo json_encode(calendar_error("Permission denied", 403));
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM academic_calendars WHERE calendar_key = ? AND academic_year = ?");
    $stmt->bind_param("ss", $calendarKey, $academicYear);
    $stmt->execute();
    $calendar = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$calendar) {
        echo json_encode(calendar_error("That academic calendar does not exist.", 404));
        exit;
    }

    if (!isset($_FILES['calendar_pdf']) || ($_FILES['calendar_pdf']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        echo json_encode(calendar_error("Choose a PDF to upload."));
        exit;
    }

    $stored = calendar_store_pdf($_FILES['calendar_pdf'], $doc_root, $calendarKey, $academicYear);

    if (!$stored['success']) {
        echo json_encode($stored);
        exit;
    }

    $stmt = $conn->prepare("UPDATE academic_calendars SET pdf_path = ? WHERE id = ?");
    $stmt->bind_param("si", $stored['path'], $calendar['id']);
    $stmt->execute();
    $stmt->close();

    admin_log_action($conn, 'Uploaded a new PDF for the ' . $academicYear . ' "' . $calendarKey . '" academic calendar.', ADMIN_ACTION_CATEGORY_ACADEMIC_CALENDARS);
    echo json_encode([
        "success" => true,
        "message" => "Calendar PDF updated.",
        "code"    => 200,
        "pdfPath" => $stored['path']
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
