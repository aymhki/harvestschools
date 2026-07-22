<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniResetHelpers.php';
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

    if ($username === '') {
        echo json_encode(["success" => false, "message" => "Please enter your username", "code" => 400]);
        exit;
    }

    $requestOwnerKey = hash('sha256', 'alumni_reset_request:' . strtolower($username));
    if (!alumni_reset_request_throttle($conn, $requestOwnerKey)) {
        echo json_encode([
            "success" => false,
            "message" => "Too many reset requests for this account. Please wait before trying again.",
            "code"    => 429
        ]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, account_status FROM alumni_students WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Username not found", "code" => 404]);
        exit;
    }

    $userRow = $result->fetch_assoc();
    $userId  = (int)$userRow['id'];

    if ($userRow['account_status'] !== 'approved') {
        echo json_encode([
            "success" => false,
            "message" => "This account is not active yet, so it cannot be reset. Please contact the school.",
            "code"    => 403
        ]);
        exit;
    }

    $info = alumni_available_reset_methods($conn, $userId);

    if (empty($info['methods'])) {
        alumni_send_admin_reset_notice($conn, $userId, $username);
        echo json_encode([
            "success"       => true,
            "adminNotified" => true,
            "message"       => "This account has no verification method set up, so it cannot be reset automatically. "
                . "A site administrator has been notified and will reach out to help you regain access.",
            "code"          => 200
        ]);
        exit;
    }

    // Fresh challenge for this account.
    $stmt = $conn->prepare(
        "DELETE FROM alumni_password_reset_challenges WHERE user_id = ? OR expires_at < NOW()"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $resetToken = bin2hex(random_bytes(32));
    $resetHash  = hash('sha256', $resetToken);
    $ttl        = alumni_reset_challenge_ttl();

    $stmt = $conn->prepare(
        "INSERT INTO alumni_password_reset_challenges (id, user_id, expires_at)
         VALUES (?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("sii", $resetHash, $userId, $ttl);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success"      => true,
        "reset_required" => true,
        "resetToken"   => $resetToken,
        "methods"      => $info['methods'],
        "maskedEmail"  => $info['masked_email'],
        "code"         => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
