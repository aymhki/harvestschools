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

    $data              = json_decode(file_get_contents('php://input'), true);
    $authToken         = (string)($data['auth_token'] ?? '');
    $credentialIdB64   = (string)($data['id'] ?? '');
    $clientDataJSON    = base64_decode($data['clientDataJSON'] ?? '', true);
    $authenticatorData = base64_decode($data['authenticatorData'] ?? '', true);
    $signature         = base64_decode($data['signature'] ?? '', true);

    if (!$authToken || !$credentialIdB64 || empty($clientDataJSON) || empty($authenticatorData) || empty($signature)) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing credential data", "code" => 400]);
        exit;
    }

    $authHash = hash('sha256', $authToken);

    $stmt = $conn->prepare(
        "SELECT attempts, webauthn_challenge FROM alumni_discoverable_challenges
         WHERE id = ? AND expires_at > NOW()"
    );
    $stmt->bind_param("s", $authHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired passkey challenge. Please try again.", "code" => 401]);
        exit;
    }

    $challengeRow = $result->fetch_assoc();

    if ((int)$challengeRow['attempts'] >= 5) {
        $stmt = $conn->prepare("DELETE FROM alumni_discoverable_challenges WHERE id = ?");
        $stmt->bind_param("s", $authHash);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => false, "message" => "Too many attempts. Please try again.", "code" => 429]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, user_id, public_key, sign_count FROM alumni_passkeys WHERE credential_id = ?");
    $stmt->bind_param("s", $credentialIdB64);
    $stmt->execute();
    $pkResult = $stmt->get_result();
    $stmt->close();

    if ($pkResult->num_rows === 0) {
        $stmt = $conn->prepare("UPDATE alumni_discoverable_challenges SET attempts = attempts + 1 WHERE id = ?");
        $stmt->bind_param("s", $authHash);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => false, "message" => "Unknown passkey. Please try another sign-in method.", "code" => 401]);
        exit;
    }

    $pkRow  = $pkResult->fetch_assoc();
    $userId = (int)$pkRow['user_id'];

    if (alumni_login_rate_limited($conn, $userId)) {
        echo json_encode(["success" => false, "message" => "Too many failed attempts for this account. Please try again later.", "code" => 429]);
        exit;
    }

    $webauthn = get_webauthn_instance();
    $verified = false;
    try {
        $verified = $webauthn->processGet(
            $clientDataJSON,
            $authenticatorData,
            $signature,
            $pkRow['public_key'],
            base64_decode($challengeRow['webauthn_challenge']),
            (int)$pkRow['sign_count'],
            true,
            true
        );
    } catch (lbuchs\WebAuthn\WebAuthnException $e) {
        $verified = false;
    }

    if (!$verified) {
        $stmt = $conn->prepare("UPDATE alumni_discoverable_challenges SET attempts = attempts + 1 WHERE id = ?");
        $stmt->bind_param("s", $authHash);
        $stmt->execute();
        $stmt->close();
        log_alumni_event($conn, $userId, 'login_fail');
        echo json_encode(["success" => false, "message" => "Passkey verification failed.", "code" => 401]);
        exit;
    }

    $newCount = (int)$webauthn->getSignatureCounter();
    if ($newCount > 0) {
        $stmt = $conn->prepare("UPDATE alumni_passkeys SET sign_count = ? WHERE id = ?");
        $stmt->bind_param("ii", $newCount, $pkRow['id']);
        $stmt->execute();
        $stmt->close();
    }

    $stmt = $conn->prepare("DELETE FROM alumni_discoverable_challenges WHERE id = ?");
    $stmt->bind_param("s", $authHash);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("SELECT name, account_status FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $userResult = $stmt->get_result();
    $stmt->close();

    if ($userResult->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Account not found", "code" => 404]);
        exit;
    }

    $userRow = $userResult->fetch_assoc();
    if ($userRow['account_status'] !== 'approved') {
        echo json_encode(["success" => false, "message" => "This account is not active. Please contact the school.", "code" => 403]);
        exit;
    }

    $sessionToken = issue_alumni_session($conn, $userId);
    log_alumni_event($conn, $userId, 'login_success');

    echo json_encode([
        "success"      => true,
        "message"      => "Login successful",
        "code"         => 200,
        "id"           => $userId,
        "name"         => $userRow['name'],
        "sessionToken" => $sessionToken
    ]);

} catch (lbuchs\WebAuthn\WebAuthnException $e) {
    echo json_encode(["success" => false, "message" => "Passkey login failed: " . $e->getMessage(), "code" => 400]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
