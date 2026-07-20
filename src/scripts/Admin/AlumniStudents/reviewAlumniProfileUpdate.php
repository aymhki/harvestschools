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

    $updateId  = (int)($data['update_id'] ?? 0);
    $decision  = (string)($data['decision'] ?? '');
    $adminNote = mb_substr(trim((string)($data['admin_note'] ?? '')), 0, 500);

    if ($updateId <= 0 || !in_array($decision, ['approved', 'rejected'], true)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing update id or an invalid decision", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT u.alumni_id, u.new_username, u.new_name, u.new_email, u.new_position,
                DATE_FORMAT(u.new_graduation_date, '%Y-%m-%d') AS new_graduation_date,
                u.new_bio, u.new_profile_picture_link, u.status,
                a.username, a.name, a.email, a.profile_picture_link
         FROM alumni_profile_updates u
         JOIN alumni_students a ON a.id = u.alumni_id
         WHERE u.id = ?"
    );
    $stmt->bind_param("i", $updateId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Profile update not found", "code" => 404]);
        exit;
    }

    $updateRow = $result->fetch_assoc();

    if ($updateRow['status'] !== 'pending') {
        echo json_encode(["success" => false, "message" => "This profile update has already been reviewed", "code" => 400]);
        exit;
    }

    $alumniId = (int)$updateRow['alumni_id'];

    $conn->begin_transaction();

    if ($decision === 'approved') {
        // Re-validate uniqueness at approval time since other accounts may
        // have taken the username or email while the update was pending.
        if ($updateRow['new_username'] !== null && alumni_username_taken($conn, $updateRow['new_username'], $alumniId)) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "The requested username has been taken by another account since this update was submitted. Reject the update and ask the alumni student to pick another username.", "code" => 400]);
            exit;
        }

        if ($updateRow['new_email'] !== null && alumni_email_taken($conn, $updateRow['new_email'], $alumniId)) {
            $conn->rollback();
            echo json_encode(["success" => false, "message" => "The requested email has been taken by another account since this update was submitted. Reject the update and ask the alumni student to use another email.", "code" => 400]);
            exit;
        }

        $stmt = $conn->prepare(
            "UPDATE alumni_students
             SET username = COALESCE(?, username),
                 name = COALESCE(?, name),
                 email = COALESCE(?, email),
                 position = COALESCE(?, position),
                 graduation_date = COALESCE(?, graduation_date),
                 bio = COALESCE(?, bio),
                 profile_picture_link = COALESCE(?, profile_picture_link)
             WHERE id = ?"
        );
        $stmt->bind_param(
            "sssssssi",
            $updateRow['new_username'],
            $updateRow['new_name'],
            $updateRow['new_email'],
            $updateRow['new_position'],
            $updateRow['new_graduation_date'],
            $updateRow['new_bio'],
            $updateRow['new_profile_picture_link'],
            $alumniId
        );
        $stmt->execute();
        $stmt->close();
    }

    $stmt = $conn->prepare(
        "UPDATE alumni_profile_updates
         SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by = ?
         WHERE id = ?"
    );
    $stmt->bind_param("ssii", $decision, $adminNote, $adminUserId, $updateId);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    if ($updateRow['new_profile_picture_link'] !== null && $updateRow['new_profile_picture_link'] !== '') {
        $obsoletePicture = $decision === 'approved'
            ? (string)$updateRow['profile_picture_link']
            : (string)$updateRow['new_profile_picture_link'];

        if ($obsoletePicture !== '' && $obsoletePicture !== (string)($decision === 'approved' ? $updateRow['new_profile_picture_link'] : $updateRow['profile_picture_link'])) {
            alumni_delete_stored_file($obsoletePicture);

            $stmt = $conn->prepare("DELETE FROM alumni_uploaded_images WHERE alumni_id = ? AND file_path = ?");
            $stmt->bind_param("is", $alumniId, $obsoletePicture);
            $stmt->execute();
            $stmt->close();
        }
    }

    $alumniName = $updateRow['new_name'] !== null && $decision === 'approved' ? $updateRow['new_name'] : $updateRow['name'];
    $alumniEmail = $updateRow['new_email'] !== null && $decision === 'approved' ? $updateRow['new_email'] : $updateRow['email'];
    $noteLine = $adminNote !== '' ? "\n\nNote from the school: {$adminNote}" : '';

    if ($decision === 'approved') {
        $subject = 'Your Harvest Alumni profile update was approved';
        $body = "Hello {$alumniName},\n\n"
            . "The changes you requested to your Harvest Alumni profile were approved and are now live on your account." . $noteLine;
    } else {
        $subject = 'An update about your Harvest Alumni profile changes';
        $body = "Hello {$alumniName},\n\n"
            . "The changes you requested to your Harvest Alumni profile were not approved, so your profile stays as it was. "
            . "You can submit a new update from your profile page at any time." . $noteLine;
    }

    alumni_send_email($alumniEmail, $subject, $body);

    echo json_encode([
        "success" => true,
        "message" => "The profile update was " . $decision . " and the alumni student was notified by email.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof mysqli) { @$conn->rollback(); }
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
