<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniResetHelpers.php';
require_once '../../webauthnHelpers.php';
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

    $data       = json_decode(file_get_contents('php://input'), true);
    $resetToken = is_array($data) ? (string)($data['reset_token'] ?? '') : '';

    if ($resetToken === '') {
        echo json_encode(["success" => false, "message" => "Missing reset token", "code" => 400]);
        exit;
    }

    $resetHash = hash('sha256', $resetToken);

    $stmt = $conn->prepare(
        "SELECT user_id FROM alumni_password_reset_challenges WHERE id = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $resetHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired reset session", "code" => 401]);
        exit;
    }

    $userId = (int)$result->fetch_assoc()['user_id'];

    $credentialIds = [];
    $stmt = $conn->prepare("SELECT credential_id FROM alumni_passkeys WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();
    while ($pkRow = $pkResult->fetch_assoc()) {
        $decoded = base64_decode($pkRow['credential_id'], true);
        if ($decoded !== false) { $credentialIds[] = $decoded; }
    }

    if (empty($credentialIds)) {
        echo json_encode(["success" => false, "message" => "No passkeys are registered for this account.", "code" => 400]);
        exit;
    }

    $webauthn = get_webauthn_instance();
    $args = $webauthn->getGetArgs($credentialIds, 240, true, true, true, true, true, 'required');
    $challenge = base64_encode($webauthn->getChallenge()->getBinaryString());

    $stmt = $conn->prepare(
        "UPDATE alumni_password_reset_challenges SET webauthn_challenge = ? WHERE id = ?"
    );
    $stmt->bind_param("ss", $challenge, $resetHash);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "options" => $args]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey verification failed: " . $e->getMessage(), "code" => 400]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
