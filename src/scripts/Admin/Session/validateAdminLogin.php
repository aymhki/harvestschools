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

    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data) || !isset($data['username']) || !isset($data['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing username or password",
            "code"    => 400
        ]);
        exit;
    }

    $user          = (string)$data['username'];
    $plainPassword = (string)$data['password'];

    $fingerprint = isset($data['fingerprint']) && is_string($data['fingerprint'])
        ? substr($data['fingerprint'], 0, 64)
        : null;

    $stmt = $conn->prepare("SELECT id, password_hash FROM admin_users WHERE username = ?");

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Prepare failed", "code" => 500]);
        exit;
    }

    $stmt->bind_param("s", $user);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $genericFail = ["success" => false, "message" => "Invalid username or password", "code" => 401];

    if ($result->num_rows === 0) {
        echo json_encode($genericFail);
        exit;
    }

    $userRow    = $result->fetch_assoc();
    $userId     = (int)$userRow['id'];
    $storedHash = (string)$userRow['password_hash'];
    $failWindow = (int)mfa_config('login_fail_window_seconds');
    $failMax    = (int)mfa_config('login_fail_max_per_window');

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM admin_login_events
         WHERE user_id = ? AND event = 'login_fail'
           AND created_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ii", $userId, $failWindow);
    $stmt->execute();
    $recentFails = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($recentFails >= $failMax) {
        echo json_encode([
            "success" => false,
            "message" => "Too many failed attempts for this account. Please try again later.",
            "code"    => 429
        ]);
        exit;
    }

    $passwordOk = false;

    if ($storedHash !== '' && password_verify($plainPassword, $storedHash)) {
        $passwordOk = true;

        if (password_needs_rehash($storedHash, PASSWORD_DEFAULT)) {
            $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
            $up = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
            $up->bind_param("si", $newHash, $userId);
            $up->execute();
            $up->close();
        }

    } elseif ($storedHash !== '' && hash_equals($storedHash, hash('sha256', $plainPassword))) {
        $passwordOk = true;
        $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $up = $conn->prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?");
        $up->bind_param("si", $newHash, $userId);
        $up->execute();
        $up->close();
    }

    if (!$passwordOk) {
        log_admin_event($conn, $userId, 'login_fail', $fingerprint);
        echo json_encode($genericFail);
        exit;
    }

    $mfaReason = mfa_should_challenge($conn, $userId, $fingerprint);
    $mfaInfo   = get_available_mfa_methods($conn, $userId);

    if ($mfaReason !== null && !empty($mfaInfo['methods'])) {
        $stmt = $conn->prepare(
            "DELETE FROM admin_mfa_challenges WHERE user_id = ? OR expires_at < NOW()"
        );
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $stmt->close();

        $mfaToken = bin2hex(random_bytes(32));
        $mfaHash  = hash('sha256', $mfaToken);
        $ttl      = (int)mfa_config('challenge_ttl_seconds');

        $stmt = $conn->prepare(
            "INSERT INTO admin_mfa_challenges (id, user_id, fingerprint_hash, expires_at)
             VALUES (?, ?, ?, NOW() + INTERVAL ? SECOND)"
        );
        $stmt->bind_param("sisi", $mfaHash, $userId, $fingerprint, $ttl);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success"      => true,
            "mfa_required" => true,
            "mfaToken"     => $mfaToken,
            "methods"      => $mfaInfo['methods'],
            "preferred"    => $mfaInfo['preferred'],
            "maskedEmail"  => $mfaInfo['masked_email'],
            "reason"       => $mfaReason,
            "code"         => 200,
        ]);
        exit;
    }

    $session = issue_admin_session($conn, $userId, $fingerprint);
    log_admin_event($conn, $userId, 'login_success', $fingerprint);

    echo json_encode([
        "success"         => true,
        "message"         => "Login successful",
        "code"            => 200,
        "id"              => $userId,
        "sessionToken"    => $session['token'],
        "deviceSecret"    => $session['deviceSecret'],
        "bindingMode"     => $session['bindingMode'],
        "needsEmailSetup" => empty($mfaInfo['methods']),
    ]);
    exit;

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code"    => $e->getCode() ?: 500,
    ]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
