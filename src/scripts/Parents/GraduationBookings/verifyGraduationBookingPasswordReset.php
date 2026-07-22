<?php
require_once '../../headers.php';
require_once 'graduationBookingAuthHelpers.php';
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

    $data        = json_decode(file_get_contents('php://input'), true);
    $resetToken  = is_array($data) ? (string)($data['reset_token'] ?? '') : '';
    $code        = is_array($data) ? trim((string)($data['code'] ?? '')) : '';
    $newPassword = is_array($data) ? (string)($data['new_password'] ?? '') : '';
    $ctx         = gb_reset_context('en');

    if ($resetToken === '') {
        echo json_encode(["success" => false, "message" => "Bad request", "code" => 400]);
        exit;
    }

    $policyError = pwreset_password_policy_error($newPassword);
    if ($policyError !== null) {
        echo json_encode(["success" => false, "message" => $policyError, "code" => 400]);
        exit;
    }

    $resetHash = hash('sha256', $resetToken);
    $ownerKey  = pwreset_owner_key_for_token($resetToken);

    $stmt = $conn->prepare(
        "SELECT auth_id, attempts FROM graduation_booking_password_reset_challenges
         WHERE id = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset session", "code" => 401]);
        exit;
    }

    $row    = $result->fetch_assoc();
    $authId = (int)$row['auth_id'];
    $maxAttempts = (int)gb_config('reset_max_verify_attempts');

    if (pwreset_attempts_exceeded($row['attempts'], $maxAttempts)) {
        $stmt = $conn->prepare("DELETE FROM graduation_booking_password_reset_challenges WHERE id = ?");
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();
        pwreset_invalidate_codes($conn, $ctx, $ownerKey);

        echo json_encode(["success" => false, "message" => "Too many attempts. Please start the reset again.", "code" => 429]);
        exit;
    }

    $ok = pwreset_consume_email_code($conn, $ctx, $ownerKey, $code) !== null;

    if (!$ok) {
        $stmt = $conn->prepare("UPDATE graduation_booking_password_reset_challenges SET attempts = attempts + 1 WHERE id = ?");
        $stmt->bind_param("s", $resetHash);
        $stmt->execute();
        $stmt->close();

        $attemptsLeft = max(0, $maxAttempts - ((int)$row['attempts'] + 1));
        echo json_encode([
            "success"      => false,
            "message"      => "Incorrect code",
            "attemptsLeft" => $attemptsLeft,
            "code"         => 401
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE graduation_booking_auth_credentials
         SET password_hash = SHA2(?, 256), updated_at = NOW()
         WHERE auth_id = ?"
    );
    $stmt->bind_param("si", $newPassword, $authId);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM graduation_booking_password_reset_challenges WHERE id = ?");
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("DELETE FROM graduation_booking_sessions WHERE auth_id = ?");
    $stmt->bind_param("i", $authId);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Your password has been updated and you were signed out everywhere. You can now log in with your new password.",
        "code"    => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
