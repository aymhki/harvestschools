<?php
require_once '../../headers.php';
require_once '../../turnstileHelpers.php';
require_once '../../Alumni/alumniAuthHelpers.php';
set_cors_headers();
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $turnstileCheck = verify_turnstile_token_if_present();

    if (!$turnstileCheck['ok']) {
        echo json_encode(['success' => false, 'message' => 'Human verification failed. Please refresh the page and try again.', 'code' => 403]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $username        = trim((string)($_POST['username'] ?? ''));
    $name            = trim((string)($_POST['name'] ?? ''));
    $email           = trim((string)($_POST['email'] ?? ''));
    $password        = (string)($_POST['password'] ?? '');
    $confirmPassword = (string)($_POST['confirm_password'] ?? '');
    $position        = mb_substr(trim((string)($_POST['position'] ?? '')), 0, 150);
    $graduationDate  = trim((string)($_POST['graduation_date'] ?? ''));
    $bio             = mb_substr(trim((string)($_POST['bio'] ?? '')), 0, 2000);

    if ($username === '' || $name === '' || $email === '' || $password === '') {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing required fields", "code" => 400]);
        exit;
    }

    if (mb_strlen($name) > 100) {
        echo json_encode(["success" => false, "message" => "Name must be 100 characters or fewer", "code" => 400]);
        exit;
    }

    $usernameError = alumni_validate_username($username);
    if ($usernameError !== null) {
        echo json_encode(["success" => false, "message" => $usernameError, "code" => 400]);
        exit;
    }

    $emailError = alumni_validate_email($email);
    if ($emailError !== null) {
        echo json_encode(["success" => false, "message" => $emailError, "code" => 400]);
        exit;
    }

    if ($password !== $confirmPassword) {
        echo json_encode(["success" => false, "message" => "Passwords do not match", "code" => 400]);
        exit;
    }

    $passwordError = alumni_validate_password($password);
    if ($passwordError !== null) {
        echo json_encode(["success" => false, "message" => $passwordError, "code" => 400]);
        exit;
    }

    $graduationDateError = alumni_validate_graduation_date($graduationDate);
    if ($graduationDateError !== null) {
        echo json_encode(["success" => false, "message" => $graduationDateError, "code" => 400]);
        exit;
    }

    if (alumni_username_taken($conn, $username)) {
        echo json_encode(["success" => false, "message" => "Username already exists", "code" => 400]);
        exit;
    }

    if (alumni_email_taken($conn, $email)) {
        echo json_encode(["success" => false, "message" => "An account with this email already exists", "code" => 400]);
        exit;
    }

    $storageFolder = alumni_sanitize_storage_folder($username);

    $stmt = $conn->prepare("SELECT id FROM alumni_students WHERE storage_folder = ?");
    $stmt->bind_param("s", $storageFolder);
    $stmt->execute();
    $folderTaken = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($folderTaken) {
        $storageFolder = substr($storageFolder, 0, 50) . '-' . bin2hex(random_bytes(4));
    }

    $profilePictureLink = '';

    if (!empty($_FILES) && isset($_FILES['profile_picture'])) {
        [$stored, $resultValue] = alumni_store_uploaded_image($_FILES['profile_picture'], $storageFolder, 'profile');

        if (!$stored) {
            echo json_encode(["success" => false, "message" => $resultValue, "code" => 400]);
            exit;
        }

        $profilePictureLink = $resultValue;
    }

    $conn->begin_transaction();

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $graduationDateForDb = $graduationDate !== '' ? $graduationDate : null;

    $stmt = $conn->prepare(
        "INSERT INTO alumni_students
            (username, name, email, password_hash, position, graduation_date, bio, profile_picture_link, storage_folder, account_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->bind_param("sssssssss", $username, $name, $email, $passwordHash, $position, $graduationDateForDb, $bio, $profilePictureLink, $storageFolder);

    if (!$stmt->execute()) {
        $conn->rollback();
        alumni_delete_stored_file($profilePictureLink);
        echo json_encode(["success" => false, "message" => "Could not create the account: " . $stmt->error, "code" => 500]);
        exit;
    }

    $newAlumniId = (int)$conn->insert_id;
    $stmt->close();

    if ($profilePictureLink !== '') {
        $kind = 'profile';
        $stmt = $conn->prepare("INSERT INTO alumni_uploaded_images (alumni_id, file_path, kind) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $newAlumniId, $profilePictureLink, $kind);
        $stmt->execute();
        $stmt->close();
    }

    $conn->commit();

    $adminNotificationEmail = isset($_POST['mailTo']) && trim((string)$_POST['mailTo']) !== ''
        ? trim((string)$_POST['mailTo'])
        : alumni_config('admin_notification_email');

    $adminBody = "A new alumni student signed up and is awaiting approval:\n\n"
        . "Username: {$username}\n"
        . "Name: {$name}\n"
        . "Email: {$email}\n"
        . "Position: {$position}\n"
        . "Graduation Date: " . ($graduationDate !== '' ? $graduationDate : 'Not provided') . "\n\n"
        . "Review it from the Alumni Students page in the admin dashboard:\n"
        . "https://admin.harvestschools.com/alumni-students-management";

    alumni_send_email($adminNotificationEmail, 'New Alumni Student Signup: ' . $username, $adminBody);

    $alumniBody = "Hello {$name},\n\n"
        . "Thank you for signing up for the Harvest International School alumni platform.\n\n"
        . "Your account is now awaiting approval from the school management. "
        . "You will receive another email at this address as soon as your account is reviewed, "
        . "after which you will be able to sign in and start sharing your story.";

    alumni_send_email($email, 'Your Harvest Alumni account is awaiting approval', $alumniBody);

    echo json_encode([
        "success" => true,
        "message" => "Your account was created and is awaiting approval. We will email you once it is reviewed. You can close this window.",
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
