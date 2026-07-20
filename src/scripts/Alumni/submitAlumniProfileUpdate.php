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

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $userId = $sessionCheck['user_id'];

    $stmt = $conn->prepare(
        "SELECT username, name, email, position,
                DATE_FORMAT(graduation_date, '%Y-%m-%d') AS graduation_date,
                bio, profile_picture_link, storage_folder
         FROM alumni_students WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $currentResult = $stmt->get_result();
    $stmt->close();

    if ($currentResult->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    $current = $currentResult->fetch_assoc();

    $requestedUsername       = trim((string)($_POST['username'] ?? ''));
    $requestedName           = trim((string)($_POST['name'] ?? ''));
    $requestedEmail          = trim((string)($_POST['email'] ?? ''));
    $requestedPosition       = mb_substr(trim((string)($_POST['position'] ?? '')), 0, 150);
    $requestedGraduationDate = trim((string)($_POST['graduation_date'] ?? ''));
    $requestedBio            = mb_substr(trim((string)($_POST['bio'] ?? '')), 0, 2000);

    if ($requestedUsername === '' || $requestedName === '' || $requestedEmail === '') {
        echo json_encode(["success" => false, "message" => "Username, name, and email are required", "code" => 400]);
        exit;
    }

    if (mb_strlen($requestedName) > 100) {
        echo json_encode(["success" => false, "message" => "Name must be 100 characters or fewer", "code" => 400]);
        exit;
    }

    $usernameError = alumni_validate_username($requestedUsername);
    if ($usernameError !== null) {
        echo json_encode(["success" => false, "message" => $usernameError, "code" => 400]);
        exit;
    }

    $emailError = alumni_validate_email($requestedEmail);
    if ($emailError !== null) {
        echo json_encode(["success" => false, "message" => $emailError, "code" => 400]);
        exit;
    }

    $graduationDateError = alumni_validate_graduation_date($requestedGraduationDate);
    if ($graduationDateError !== null) {
        echo json_encode(["success" => false, "message" => $graduationDateError, "code" => 400]);
        exit;
    }

    if ($requestedUsername !== $current['username'] && alumni_username_taken($conn, $requestedUsername, $userId)) {
        echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]);
        exit;
    }

    if ($requestedEmail !== $current['email'] && alumni_email_taken($conn, $requestedEmail, $userId)) {
        echo json_encode(["success" => false, "message" => "An account with this email already exists", "code" => 400]);
        exit;
    }

    $newUsername       = $requestedUsername !== (string)$current['username'] ? $requestedUsername : null;
    $newName           = $requestedName !== (string)$current['name'] ? $requestedName : null;
    $newEmail          = $requestedEmail !== (string)$current['email'] ? $requestedEmail : null;
    $newPosition       = $requestedPosition !== (string)$current['position'] ? $requestedPosition : null;
    $newBio            = $requestedBio !== (string)($current['bio'] ?? '') ? $requestedBio : null;

    $currentGraduationDate = (string)($current['graduation_date'] ?? '');
    $newGraduationDate = $requestedGraduationDate !== $currentGraduationDate
        ? ($requestedGraduationDate !== '' ? $requestedGraduationDate : null)
        : null;
    $graduationDateChanged = $requestedGraduationDate !== $currentGraduationDate && $requestedGraduationDate !== '';

    $newProfilePictureLink = null;

    if (!empty($_FILES) && isset($_FILES['profile_picture'])) {
        [$stored, $resultValue] = alumni_store_uploaded_image($_FILES['profile_picture'], $current['storage_folder'], 'profile');

        if (!$stored) {
            echo json_encode(["success" => false, "message" => $resultValue, "code" => 400]);
            exit;
        }

        $newProfilePictureLink = $resultValue;

        $kind = 'profile';
        $stmt = $conn->prepare("INSERT INTO alumni_uploaded_images (alumni_id, file_path, kind) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $userId, $newProfilePictureLink, $kind);
        $stmt->execute();
        $stmt->close();
    }

    $somethingChanged = $newUsername !== null || $newName !== null || $newEmail !== null
        || $newPosition !== null || $graduationDateChanged || $newBio !== null
        || $newProfilePictureLink !== null;

    if (!$somethingChanged) {
        echo json_encode(["success" => false, "message" => "No changes were made to your profile", "code" => 400]);
        exit;
    }

    $conn->begin_transaction();

    $stmt = $conn->prepare("SELECT new_profile_picture_link FROM alumni_profile_updates WHERE alumni_id = ? AND status = 'pending'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $existingPendingResult = $stmt->get_result();
    $stmt->close();

    $previousPendingPicture = null;

    if ($existingPendingResult->num_rows > 0) {
        $previousPendingPicture = $existingPendingResult->fetch_assoc()['new_profile_picture_link'];

        $stmt = $conn->prepare("DELETE FROM alumni_profile_updates WHERE alumni_id = ? AND status = 'pending'");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();
    }

    $stmt = $conn->prepare(
        "INSERT INTO alumni_profile_updates
            (alumni_id, new_username, new_name, new_email, new_position, new_graduation_date, new_bio, new_profile_picture_link, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $graduationDateForDb = $graduationDateChanged ? $requestedGraduationDate : null;
    $stmt->bind_param("isssssss", $userId, $newUsername, $newName, $newEmail, $newPosition, $graduationDateForDb, $newBio, $newProfilePictureLink);

    if (!$stmt->execute()) {
        $conn->rollback();
        alumni_delete_stored_file($newProfilePictureLink);
        echo json_encode(["success" => false, "message" => "Could not submit the update: " . $stmt->error, "code" => 500]);
        exit;
    }

    $stmt->close();
    $conn->commit();

    if ($previousPendingPicture !== null && $previousPendingPicture !== ''
        && $previousPendingPicture !== $newProfilePictureLink
        && $previousPendingPicture !== $current['profile_picture_link']) {
        alumni_delete_stored_file($previousPendingPicture);

        $stmt = $conn->prepare("DELETE FROM alumni_uploaded_images WHERE alumni_id = ? AND file_path = ?");
        $stmt->bind_param("is", $userId, $previousPendingPicture);
        $stmt->execute();
        $stmt->close();
    }

    $adminBody = "Alumni student '{$current['username']}' submitted a profile update that is awaiting approval.\n\n"
        . "Review it from the Alumni Students page in the admin dashboard:\n"
        . "https://admin.harvestschools.com/alumni-students-management";

    alumni_send_email(alumni_config('admin_notification_email'), 'Alumni Profile Update Awaiting Approval: ' . $current['username'], $adminBody);

    echo json_encode([
        "success" => true,
        "message" => "Your profile update was submitted and is awaiting approval from the school.",
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
