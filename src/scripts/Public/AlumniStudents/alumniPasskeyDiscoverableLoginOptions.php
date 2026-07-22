<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniAuthHelpers.php';
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

    $webauthn = get_webauthn_instance();

    $args = $webauthn->getGetArgs([], 240, true, true, true, true, true, 'required');
    $challenge = base64_encode($webauthn->getChallenge()->getBinaryString());

    $conn->query("DELETE FROM alumni_discoverable_challenges WHERE expires_at < NOW()");

    $authToken = bin2hex(random_bytes(32));
    $authHash  = hash('sha256', $authToken);
    $ttl       = (int)alumni_config('passkey_challenge_ttl_seconds');

    $stmt = $conn->prepare(
        "INSERT INTO alumni_discoverable_challenges (id, webauthn_challenge, expires_at)
         VALUES (?, ?, NOW() + INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ssi", $authHash, $challenge, $ttl);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "code" => 200, "options" => $args, "authToken" => $authToken]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey login failed: " . $e->getMessage(), "code" => 400]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
