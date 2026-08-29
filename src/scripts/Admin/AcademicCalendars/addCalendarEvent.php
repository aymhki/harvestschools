<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../csvImportHelpers.php';
require_once __DIR__ . '/academicCalendarHelpers.php';
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

    $context = [
        'calendar_key'  => $data['calendar_key'] ?? '',
        'academic_year' => $data['academic_year'] ?? '',
    ];

    $authorisation = calendar_import_authorise($conn, $context);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $result = calendar_add_events($conn, [$data], $context);

    if (isset($result['message'])) {
        echo json_encode(calendar_error($result['message'], 404));
        exit;
    }

    if ($result['failed'] !== []) {
        $first = $result['failed'][0];

        echo json_encode(["success" => false, "message" => $first['message'], "code" => 400]);
        exit;
    }

    admin_log_action($conn, 'Added a calendar event to the ' . (string)($data['academic_year'] ?? '') . ' "' . (string)($data['calendar_key'] ?? '') . '" academic calendar — Title (EN): "' . (string)($data['title_en'] ?? '') . '"; Title (AR): "' . (string)($data['title_ar'] ?? '') . '"; Start date: ' . admin_action_value($data['start_date'] ?? '') . '; End date: ' . admin_action_value($data['end_date'] ?? '') . '.', ADMIN_ACTION_CATEGORY_ACADEMIC_CALENDARS);
    echo json_encode([
        "success" => true,
        "message" => "Event added.",
        "code"    => 200
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
