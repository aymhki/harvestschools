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

    $data = json_decode(file_get_contents('php://input'), true);
    $code = is_array($data) ? trim((string)($data['code'] ?? '')) : '';

    if (($data['action'] ?? '') === 'cancel') {
        $stmt = $conn->prepare(
            "UPDATE admin_users SET pending_email = NULL, pending_email_set_at = NULL WHERE id = ?"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        $ownerKey = mfa_owner_key_for_user($userId);
        $stmt = $conn->prepare(
            "UPDATE admin_mfa_codes SET consumed_at = NOW()
             WHERE purpose = 'email_verify' AND owner_key = ? AND consumed_at IS NULL"
        );
        $stmt->bind_param("s", $ownerKey);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "message" => "Email change cancelled", "code" => 200]);
        exit;
    }

    if (!preg_match('/^[0-9]{6}$/', $code)) {
        echo json_encode(["success" => false, "message" => "Enter the 6-digit code", "code" => 400]);
        exit;
    }

    $stmt = $conn->prepare("SELECT pending_email FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $pendingEmail = $row['pending_email'] ?? '';

    if (empty($pendingEmail)) {
        echo json_encode([
            "success" => false,
            "message" => "There is no email address waiting to be verified.",
            "code"    => 400
        ]);
        exit;
    }

    $ownerKey = mfa_owner_key_for_user($userId);
    $consumed = mfa_consume_email_code($conn, 'email_verify', $ownerKey, $code);

    if ($consumed === null) {
        log_admin_event($conn, $userId, 'email_verify_fail', null);
        echo json_encode([
            "success" => false,
            "message" => "That code is incorrect or has expired. Request a new one.",
            "code"    => 401
        ]);
        exit;
    }

    if (strcasecmp((string)$consumed['destination'], (string)$pendingEmail) !== 0) {
        echo json_encode([
            "success" => false,
            "message" => "That code was sent to a different address. Request a new one.",
            "code"    => 401
        ]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id FROM admin_users WHERE LOWER(email) = LOWER(?) AND id != ?");
    $stmt->bind_param("si", $pendingEmail, $userId);
    $stmt->execute();
    $taken = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($taken) {
        echo json_encode([
            "success" => false,
            "message" => "That email is already used by another admin account",
            "code"    => 400
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE admin_users
         SET email = pending_email,
             email_verified_at = NOW(),
             pending_email = NULL,
             pending_email_set_at = NULL
         WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'email_verified', null);

    echo json_encode([
        "success" => true,
        "message" => "Email verified. It can now receive your login codes.",
        "email"   => $pendingEmail,
        "code"    => 200
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => 500
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}