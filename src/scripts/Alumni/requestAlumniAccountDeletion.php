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

    $data = json_decode(file_get_contents('php://input'), true);
    $reason = mb_substr(trim((string)($data['reason'] ?? '')), 0, 500);

    $stmt = $conn->prepare("SELECT username FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $accountResult = $stmt->get_result();
    $stmt->close();

    if ($accountResult->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    $account = $accountResult->fetch_assoc();

    $stmt = $conn->prepare("SELECT id FROM alumni_deletion_requests WHERE alumni_id = ? AND status = 'pending'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $pendingResult = $stmt->get_result();
    $stmt->close();

    if ($pendingResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "You already have a pending account deletion request awaiting review", "code" => 400]);
        exit;
    }

    $reasonForDb = $reason !== '' ? $reason : null;

    $stmt = $conn->prepare("INSERT INTO alumni_deletion_requests (alumni_id, reason, status) VALUES (?, ?, 'pending')");
    $stmt->bind_param("is", $userId, $reasonForDb);

    if (!$stmt->execute()) {
        echo json_encode(["success" => false, "message" => "Could not submit the deletion request: " . $stmt->error, "code" => 500]);
        exit;
    }

    $stmt->close();

    $adminBody = "Alumni student '{$account['username']}' requested that their account be deleted."
        . ($reasonForDb !== null ? "\n\nReason they gave:\n{$reasonForDb}" : '')
        . "\n\nReview it from the Alumni Students page in the admin dashboard:\n"
        . "https://admin.harvestschools.com/alumni-students-management";

    alumni_send_email(alumni_config('admin_notification_email'), 'Alumni Account Deletion Request Awaiting Review: ' . $account['username'], $adminBody);

    echo json_encode([
        "success" => true,
        "message" => "Your account deletion request was submitted. The school will review it, and your account stays active until it is approved.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
