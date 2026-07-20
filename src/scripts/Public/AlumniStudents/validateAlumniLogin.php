<?php
require_once '../../headers.php';
require_once '../../Alumni/alumniAuthHelpers.php';
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

    if (!is_array($data) || !isset($data['username']) || !isset($data['password'])) {
        echo json_encode(["success" => false, "message" => "Bad Request: Missing username or password", "code" => 400]);
        exit;
    }

    $user          = trim((string)$data['username']);
    $plainPassword = (string)$data['password'];
    $genericFail   = ["success" => false, "message" => "Invalid username or password", "code" => 401];

    $stmt = $conn->prepare("SELECT id, name, password_hash, account_status FROM alumni_students WHERE username = ?");
    $stmt->bind_param("s", $user);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) {
        echo json_encode($genericFail);
        exit;
    }

    $userRow = $result->fetch_assoc();
    $userId  = (int)$userRow['id'];

    if (alumni_login_rate_limited($conn, $userId)) {
        echo json_encode([
            "success" => false,
            "message" => "Too many failed attempts for this account. Please try again later.",
            "code"    => 429
        ]);
        exit;
    }

    if ((string)$userRow['password_hash'] === '' || !password_verify($plainPassword, (string)$userRow['password_hash'])) {
        log_alumni_event($conn, $userId, 'login_fail');
        echo json_encode($genericFail);
        exit;
    }

    if (password_needs_rehash((string)$userRow['password_hash'], PASSWORD_DEFAULT)) {
        $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        $up = $conn->prepare("UPDATE alumni_students SET password_hash = ? WHERE id = ?");
        $up->bind_param("si", $newHash, $userId);
        $up->execute();
        $up->close();
    }

    if ($userRow['account_status'] === 'pending') {
        echo json_encode([
            "success" => false,
            "message" => "Your account is still awaiting approval from the school. You will be emailed once it is reviewed.",
            "code"    => 403
        ]);
        exit;
    }

    if ($userRow['account_status'] === 'rejected') {
        echo json_encode([
            "success" => false,
            "message" => "Your signup request was not approved. Please contact the school for more information.",
            "code"    => 403
        ]);
        exit;
    }

    if ($userRow['account_status'] === 'disabled') {
        echo json_encode([
            "success" => false,
            "message" => "This account has been disabled. Please contact the school for more information.",
            "code"    => 403
        ]);
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

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
