<?php
require_once '../../headers.php';
require_once '../../mfaHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
    if ($conn->connect_error) { echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]); exit; }
    $conn->set_charset("utf8mb4");

    $data = json_decode(file_get_contents('php://input'), true);
    $mfaToken = $data['mfa_token'] ?? '';
    if (!$mfaToken) { echo json_encode(["success" => false, "message" => "Missing MFA token", "code" => 400]); exit; }
    $mfaHash = hash('sha256', $mfaToken);

    $stmt = $conn->prepare(
        "SELECT c.user_id, c.email_code_sent_at, u.email
         FROM admin_mfa_challenges c JOIN admin_users u ON u.id = c.user_id
         WHERE c.id = ? AND c.expires_at > NOW()"
    );

    $stmt->bind_param("s", $mfaHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    if ($result->num_rows === 0) { echo json_encode(["success" => false, "message" => "Invalid or expired MFA session", "code" => 401]); exit; }
    $row = $result->fetch_assoc();
    if (empty($row['email'])) { echo json_encode(["success" => false, "message" => "No email on file", "code" => 400]); exit; }

    if ($row['email_code_sent_at'] !== null && strtotime($row['email_code_sent_at']) > time() - 60) {
        echo json_encode(["success" => false, "message" => "Please wait before requesting another code", "code" => 429]); exit;
    }

    $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $codeHash = hash('sha256', $code);
    $stmt = $conn->prepare("UPDATE admin_mfa_challenges SET email_code_hash = ?, email_code_sent_at = NOW(), attempts = 0 WHERE id = ?");
    $stmt->bind_param("ss", $codeHash, $mfaHash);
    $stmt->execute();
    $stmt->close();

    $subject = "Harvest Admin verification code";
    $body    = "Your admin login verification code is: {$code}\n\nIt expires in 10 minutes. If you did not try to log in, change your password immediately.";
    $headers = "From: no-reply@admin.harvestschools.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    mail($row['email'], $subject, $body, $headers);

    echo json_encode(["success" => true, "message" => "Code sent", "maskedEmail" => mask_email($row['email']), "code" => 200]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn)) { $conn->close(); }
}
