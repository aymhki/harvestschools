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

    $data     = json_decode(file_get_contents('php://input'), true);
    $username = is_array($data) ? trim((string)($data['username'] ?? '')) : '';
    $lang     = (is_array($data) && ($data['lang'] ?? '') === 'ar') ? 'ar' : 'en';

    if ($username === '') {
        echo json_encode(["success" => false, "message" => "Please enter your username", "code" => 400]);
        exit;
    }

    $requestOwnerKey = hash('sha256', 'gb_reset_request:' . strtolower($username));
    if (!gb_request_throttle($conn, $requestOwnerKey)) {
        echo json_encode([
            "success" => false,
            "message" => "Too many reset requests for this account. Please wait before trying again.",
            "code"    => 429
        ]);
        exit;
    }

    $stmt = $conn->prepare("SELECT auth_id FROM graduation_booking_auth_credentials WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Username not found", "code" => 404]);
        exit;
    }

    $authId = (int)$result->fetch_assoc()['auth_id'];
    $emails = gb_parent_emails_for_auth($conn, $authId);

    if (empty($emails)) {
        gb_send_admin_notice($conn, $authId, $username, 'password_reset_no_email');
        echo json_encode([
            "success"       => true,
            "adminNotified" => true,
            "message"       => "There is no email on file for this booking, so it cannot be reset automatically. "
                . "A site administrator has been notified and will reach out to help you regain access.",
            "code"          => 200
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "DELETE FROM graduation_booking_password_reset_challenges WHERE auth_id = ? OR expires_at < NOW()"
    );
    $stmt->bind_param("i", $authId);
    $stmt->execute();
    $stmt->close();

    $resetToken = bin2hex(random_bytes(32));
    $resetHash  = hash('sha256', $resetToken);
    $ttl        = (int)gb_config('reset_challenge_ttl_seconds');

    $stmt = $conn->prepare(
        "INSERT INTO graduation_booking_password_reset_challenges (id, auth_id, expires_at)
         VALUES (?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("sii", $resetHash, $authId, $ttl);
    $stmt->execute();
    $stmt->close();

    $masked = array_map('pwreset_mask_email', $emails);

    echo json_encode([
        "success"      => true,
        "reset_required" => true,
        "resetToken"   => $resetToken,
        "maskedEmails" => $masked,
        "code"         => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
