<?php
require_once '../../headers.php';
require_once '../../alumniAuthHelpers.php';
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

    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim((string)($data['username'] ?? ''));

    if ($username === '') {
        echo json_encode(["success" => false, "message" => "Please enter your username first, then use your passkey.", "code" => 400]);
        exit;
    }

    $genericFail = ["success" => false, "message" => "No passkeys are registered for this account", "code" => 400];

    $stmt = $conn->prepare("SELECT id, account_status FROM alumni_students WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode($genericFail);
        exit;
    }

    $userRow = $result->fetch_assoc();
    $userId  = (int)$userRow['id'];

    if ($userRow['account_status'] !== 'approved') {
        echo json_encode($genericFail);
        exit;
    }

    if (alumni_login_rate_limited($conn, $userId)) {
        echo json_encode([
            "success" => false,
            "message" => "Too many failed attempts for this account. Please try again later.",
            "code"    => 429
        ]);
        exit;
    }

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
        echo json_encode($genericFail);
        exit;
    }

    $webauthn = get_webauthn_instance();

    $args = $webauthn->getGetArgs(
        $credentialIds,
        240,
        true,
        true,
        true,
        true,
        true,
        'required'
    );

    $challenge = base64_encode($webauthn->getChallenge()->getBinaryString());

    $stmt = $conn->prepare("DELETE FROM alumni_auth_challenges WHERE user_id = ? OR expires_at < NOW()");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $stmt->close();

    $authToken = bin2hex(random_bytes(32));
    $authHash  = hash('sha256', $authToken);
    $ttl       = (int)alumni_config('passkey_challenge_ttl_seconds');

    $stmt = $conn->prepare(
        "INSERT INTO alumni_auth_challenges (id, user_id, webauthn_challenge, expires_at)
         VALUES (?, ?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("sisi", $authHash, $userId, $challenge, $ttl);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "options" => $args, "authToken" => $authToken]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey login failed: " . $e->getMessage(), "code" => 400]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
