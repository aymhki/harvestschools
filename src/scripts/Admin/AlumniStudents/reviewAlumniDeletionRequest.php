<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../Alumni/alumniAuthHelpers.php';
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

    $requestId = (int)($data['request_id'] ?? 0);
    $decision  = (string)($data['decision'] ?? '');
    $adminNote = mb_substr(trim((string)($data['admin_note'] ?? '')), 0, 500);

    if ($requestId <= 0 || !in_array($decision, ['approved', 'rejected'], true)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing request id or an invalid decision", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT r.alumni_id, r.status, r.reason,
                a.username, a.name, a.email, a.storage_folder
         FROM alumni_deletion_requests r
         JOIN alumni_students a ON a.id = r.alumni_id
         WHERE r.id = ?"
    );
    $stmt->bind_param("i", $requestId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Deletion request not found", "code" => 404]);
        exit;
    }

    $requestRow = $result->fetch_assoc();

    if ($requestRow['status'] !== 'pending') {
        echo json_encode(["success" => false, "message" => "This deletion request has already been reviewed", "code" => 400]);
        exit;
    }

    $alumniId    = (int)$requestRow['alumni_id'];
    $alumniName  = $requestRow['name'];
    $alumniEmail = $requestRow['email'];
    $noteLine    = $adminNote !== '' ? "\n\nNote from the school: {$adminNote}" : '';

    if ($decision === 'approved') {
        $stmt = $conn->prepare("DELETE FROM alumni_students WHERE id = ?");
        $stmt->bind_param("i", $alumniId);
        $stmt->execute();
        $deleted = $stmt->affected_rows > 0;
        $stmt->close();

        if (!$deleted) {
            echo json_encode(["success" => false, "message" => "Could not delete the alumni account", "code" => 500]);
            exit;
        }

        alumni_delete_account_files($requestRow['storage_folder']);

        $subject = 'Your Harvest Alumni account was deleted';
        $body = "Hello {$alumniName},\n\n"
            . "As you requested, your Harvest Alumni account was deleted, along with your posts and uploaded files. "
            . "You are welcome to sign up again at any time." . $noteLine;

        alumni_send_email($alumniEmail, $subject, $body);

        echo json_encode([
            "success" => true,
            "message" => "The deletion request was approved. The alumni account '" . $requestRow['username'] . "', its posts, and its uploaded files were deleted, and the alumni student was notified by email.",
            "code"    => 200
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE alumni_deletion_requests
         SET status = 'rejected', admin_note = ?, reviewed_at = NOW(), reviewed_by = ?
         WHERE id = ?"
    );
    $stmt->bind_param("sii", $adminNote, $adminUserId, $requestId);
    $stmt->execute();
    $stmt->close();

    $subject = 'An update about your Harvest Alumni account deletion request';
    $body = "Hello {$alumniName},\n\n"
        . "Your request to delete your Harvest Alumni account was not approved, so your account stays active. "
        . "You can submit a new request from your profile page at any time, or contact the school if you have questions." . $noteLine;

    alumni_send_email($alumniEmail, $subject, $body);

    echo json_encode([
        "success" => true,
        "message" => "The deletion request was rejected and the alumni student was notified by email.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
