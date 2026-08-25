<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
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
    $authorisation = calendar_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    $calendarKey = calendar_trim($data['calendar_key'] ?? '', 32);
    $academicYear = calendar_trim($data['academic_year'] ?? '', 9);

    if (!academic_calendar_exists($calendarKey) || !calendar_may_edit($authorisation, $calendarKey)) {
        echo json_encode(calendar_error("Permission denied", 403));
        exit;
    }

    $stmt = $conn->prepare("SELECT id, pdf_path FROM academic_calendars WHERE calendar_key = ? AND academic_year = ?");
    $stmt->bind_param("ss", $calendarKey, $academicYear);
    $stmt->execute();
    $calendar = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$calendar) {
        echo json_encode(calendar_error("That academic calendar does not exist.", 404));
        exit;
    }

    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM academic_calendars WHERE calendar_key = ?");
    $stmt->bind_param("s", $calendarKey);
    $stmt->execute();
    $total = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    if ($total <= 1) {
        echo json_encode(calendar_error(
            "This is the only calendar this department has. Add the replacement year first, then delete this one."
        ));
        exit;
    }

    $calendarId = (int)$calendar['id'];

    $conn->begin_transaction();

    $stmt = $conn->prepare("DELETE FROM academic_calendar_events WHERE calendar_id = ?");
    $stmt->bind_param("i", $calendarId);
    $stmt->execute();
    $removedEvents = $stmt->affected_rows;
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM academic_calendars WHERE id = ?");
    $stmt->bind_param("i", $calendarId);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    $removedPdf = false;
    $pdfPath = (string)$calendar['pdf_path'];

    if ($pdfPath !== '') {
        $assetsBase = dirname(rtrim($doc_root, '/\\')) . DIRECTORY_SEPARATOR . 'assets';
        $calendarsDirectory = realpath($assetsBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, CALENDAR_PDF_DIRECTORY));
        $target = realpath($assetsBase . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, ltrim($pdfPath, '/')));

        if ($calendarsDirectory !== false && $target !== false && strpos($target, $calendarsDirectory) === 0 && is_file($target)) {
            $removedPdf = @unlink($target);
        }
    }

    $current = public_calendar_current($conn, $calendarKey);

    echo json_encode([
        "success"       => true,
        "message"       => "Academic calendar deleted with " . $removedEvents . " events.",
        "code"          => 200,
        "removedEvents" => $removedEvents,
        "removedPdf"    => $removedPdf,
        "showingNow"    => $current === null ? null : (string)$current['academic_year']
    ]);
} catch (Throwable $e) {
    if (isset($conn)) {
        $conn->rollback();
    }

    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
