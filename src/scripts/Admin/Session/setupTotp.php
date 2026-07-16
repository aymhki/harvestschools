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

    $stmt = $conn->prepare("SELECT username, password_hash, totp_secret FROM admin_users WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found", "code" => 404]);
        exit;
    }

    $row = $result->fetch_assoc();

    if (!empty($row['totp_secret'])) {
        $data            = json_decode(file_get_contents('php://input'), true);
        $currentPassword = is_array($data) ? (string)($data['current_password'] ?? '') : '';
        $storedHash      = (string)$row['password_hash'];

        $passwordOk = $storedHash !== '' && (
            password_verify($currentPassword, $storedHash) ||
            hash_equals($storedHash, hash('sha256', $currentPassword))
        );

        if (!$passwordOk) {
            echo json_encode([
                "success"         => false,
                "message"         => "Enter your current password to replace the authenticator app already on this account",
                "requiresPassword" => true,
                "code"            => 401
            ]);
            exit;
        }
    }

    $secret = base32_encode_bytes(random_bytes(20));
    $stmt = $conn->prepare(
        "UPDATE admin_users SET totp_secret_pending = ?, totp_secret_pending_at = NOW() WHERE id = ?"
    );
    $stmt->bind_param("si", $secret, $userId);
    $stmt->execute();
    $stmt->close();

    $issuer = rawurlencode('Harvest Schools Admin');
    $label  = $issuer . ':' . rawurlencode($row['username']);

    $uri = "otpauth://totp/{$label}"
        . "?secret={$secret}"
        . "&issuer={$issuer}"
        . "&algorithm=SHA1"
        . "&digits=6"
        . "&period=30";

    echo json_encode([
        "success"       => true,
        "code"          => 200,
        "secret"        => $secret,
        "otpauthUri"    => $uri,
        "expiresIn"     => (int)mfa_config('totp_pending_ttl_seconds'),
        "isReplacement" => !empty($row['totp_secret']),
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
