<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../alumniAuthHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $ALUMNI_STUDENTS_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $ALUMNI_STUDENTS_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $sessionCheck = validate_admin_session($conn);
    $adminUserId = $sessionCheck['success'] ? (int)$sessionCheck['user_id'] : null;

    $data = json_decode(file_get_contents('php://input'), true);

    $alumniId  = (int)($data['alumni_id'] ?? 0);
    $newStatus = (string)($data['new_status'] ?? '');
    $adminNote = mb_substr(trim((string)($data['admin_note'] ?? '')), 0, 500);

    if ($alumniId <= 0 || !in_array($newStatus, ['approved', 'rejected', 'disabled'], true)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing alumni id or an invalid status", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT username, name, email, account_status FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $alumniId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Alumni account not found", "code" => 404]);
        exit;
    }

    $alumniRow = $result->fetch_assoc();
    $previousStatus = (string)$alumniRow['account_status'];

    if ($previousStatus === $newStatus) {
        echo json_encode(["success" => false, "message" => "The account already has this status", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE alumni_students
         SET account_status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ssii", $newStatus, $adminNote, $adminUserId, $alumniId);
    $stmt->execute();
    $stmt->close();

    if ($newStatus !== 'approved') {
        $stmt = $conn->prepare("DELETE FROM alumni_sessions WHERE user_id = ?");
        $stmt->bind_param("i", $alumniId);
        $stmt->execute();
        $stmt->close();
    }

    $alumniName = $alumniRow['name'];
    $noteLine = $adminNote !== '' ? "\n\nNote from the school: {$adminNote}" : '';

    if ($newStatus === 'approved') {
        $subject = 'Your Harvest Alumni account has been approved';
        $body = "Hello {$alumniName},\n\n"
            . "Great news! Your Harvest International School alumni account has been approved.\n\n"
            . "You can now sign in and start sharing your story with the Harvest community:\n"
            . "https://www.harvestschools.com/students-life/alumni-students/login" . $noteLine;
    } elseif ($newStatus === 'rejected') {
        $subject = 'An update about your Harvest Alumni signup';
        $body = "Hello {$alumniName},\n\n"
            . "Thank you for your interest in the Harvest International School alumni platform. "
            . "Unfortunately, your signup request was not approved at this time. "
            . "If you believe this is a mistake, please contact the school." . $noteLine;
    } else {
        $subject = 'Your Harvest Alumni account has been disabled';
        $body = "Hello {$alumniName},\n\n"
            . "Your Harvest International School alumni account has been disabled by the school management. "
            . "If you believe this is a mistake, please contact the school." . $noteLine;
    }

    alumni_send_email($alumniRow['email'], $subject, $body);

    echo json_encode([
        "success" => true,
        "message" => "Account status updated to '" . $newStatus . "' and the alumni student was notified by email.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
