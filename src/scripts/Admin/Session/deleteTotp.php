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

    $sessionCheck = validate_admin_session($conn);
    if (!$sessionCheck['success']) { echo json_encode($sessionCheck); exit; }
    $userId = $sessionCheck['user_id'];

    $data            = json_decode(file_get_contents('php://input'), true);
    $currentPassword = is_array($data) ? (string)($data['current_password'] ?? '') : '';

    $stmt = $conn->prepare("SELECT password_hash, totp_secret FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    if (empty($row['totp_secret'])) {
        echo json_encode([
            "success" => false,
            "message" => "No authenticator app is set up on this account",
            "code"    => 400
        ]);
        exit;
    }

    $storedHash = (string)$row['password_hash'];
    $passwordOk = $storedHash !== '' && (
        password_verify($currentPassword, $storedHash) ||
        hash_equals($storedHash, hash('sha256', $currentPassword))
    );

    if (!$passwordOk) {
        echo json_encode(["success" => false, "message" => "Current password is incorrect", "code" => 401]);
        exit;
    }

    $mfaInfo   = get_available_mfa_methods($conn, $userId);
    $remaining = array_values(array_diff($mfaInfo['methods'], ['totp']));

    if (empty($remaining)) {
        echo json_encode([
            "success" => false,
            "message" => "This is your only login verification method. Add a verified email or a passkey first.",
            "code"    => 400
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE admin_users
         SET totp_secret = NULL,
             totp_secret_pending = NULL,
             totp_secret_pending_at = NULL,
             last_totp_slice = NULL,
             preferred_mfa = IF(preferred_mfa = 'totp', NULL, preferred_mfa)
         WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    log_admin_event($conn, $userId, 'totp_removed', null);

    echo json_encode([
        "success" => true,
        "message" => "Authenticator app removed",
        "code" => 200
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
