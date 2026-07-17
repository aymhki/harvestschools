<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../mfaHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli(
        $dbConfig['db_host'],
        $dbConfig['db_username'],
        $dbConfig['db_password'],
        $dbConfig['db_name']
    );

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");

    $sessionCheck = validate_admin_session($conn, ['allow_during_mfa_setup' => true]);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data     = json_decode(file_get_contents('php://input'), true);
    $newEmail = is_array($data) ? trim((string)($data['email'] ?? '')) : '';

    if ($newEmail === '') {
        echo json_encode(["success" => false, "message" => "Enter an email address", "code" => 400]);
        exit;
    }

    if (!is_valid_admin_email($newEmail)) {
        echo json_encode([
            "success" => false,
            "message" => "Email must be a valid @harvestschools.com or @alfajralbasem.com address",
            "code"    => 400
        ]);
        exit;
    }

    $mfaInfo = get_available_mfa_methods($conn, $userId);

    if (!empty($mfaInfo['methods'])) {
        echo json_encode([
            "success"          => false,
            "message"          => "Verifying your identity is required to change your email.",
            "stepUpRequired"   => true,
            "stepUpAction"     => "change_email",
            "code"             => 403
        ]);
        exit;
    }

    $currentPassword = is_array($data) ? (string)($data['current_password'] ?? '') : '';

    $stmt = $conn->prepare("SELECT password_hash FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $storedHash = (string)($row['password_hash'] ?? '');
    $passwordOk = $storedHash !== '' && (
            password_verify($currentPassword, $storedHash) ||
            hash_equals($storedHash, hash('sha256', $currentPassword))
        );

    if (!$passwordOk) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect", "code" => 401]);
        exit;
    }

    $result = start_email_verification($conn, $userId, $newEmail);
    echo json_encode($result);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}