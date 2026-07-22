<?php
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/alumniAuthHelpers.php';
require_once __DIR__ . '/../passwordResetHelpers.php';

function alumni_reset_context($lang = 'en') {
    $ar = ($lang === 'ar');

    return [
        'codes_table'    => 'alumni_password_reset_codes',
        'send_log_table' => 'alumni_password_reset_send_log',
        'ttl_seconds'    => 600,
        'max_active'     => 5,
        'cooldown_base'  => 30,
        'cooldown_max'   => 300,
        'window_seconds' => 900,
        'max_per_window' => 5,
        'mail_from'      => alumni_config('mail_from'),
        'mail_from_name' => alumni_config('mail_from_name'),
        'subject'        => $ar ? 'رمز إعادة تعيين كلمة مرور حساب الخريجين'
                                : 'Alumni account password reset code',
        'intro'          => $ar ? 'رمز إعادة تعيين كلمة المرور الخاص بك هو:'
                                : 'Your password reset code is:',
        'expiry_line'    => $ar ? 'ينتهي هذا الرمز خلال {minutes} دقائق.'
                                : 'It expires in {minutes} minutes.',
        'footer'         => $ar ? 'إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة ولن تتغير كلمة المرور.'
                                : 'If you did not request a password reset, you can safely ignore this message. Your password will not change.',
    ];
}

function alumni_reset_challenge_ttl() { return 600; }
function alumni_reset_max_attempts()  { return 5; }

function alumni_available_reset_methods($conn, $userId) {
    $methods = [];
    $maskedEmail = null;

    $stmt = $conn->prepare("SELECT email FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $email = $row ? trim((string)$row['email']) : '';
    if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $methods[]   = 'email';
        $maskedEmail = pwreset_mask_email($email);
    }

    $stmt = $conn->prepare("SELECT 1 FROM alumni_passkeys WHERE user_id = ? LIMIT 1");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) { $methods[] = 'passkey'; }
    $stmt->close();

    return [
        'methods'      => $methods,
        'email'        => $email,
        'masked_email' => $maskedEmail,
    ];
}

function alumni_reset_request_throttle($conn, $ownerKey, $windowSeconds = 900, $maxPerWindow = 6) {
    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM alumni_password_reset_send_log
         WHERE owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("si", $ownerKey, $windowSeconds);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();
    return $count < $maxPerWindow;
}

function alumni_send_admin_reset_notice($conn, $userId, $username) {
    $adminEmail = (string)alumni_config('admin_notification_email');
    if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) { return false; }

    $safeUsername = preg_replace('/[\r\n]+/', ' ', (string)$username);

    $stmt = $conn->prepare("SELECT name, email, account_status, last_login_at FROM alumni_students WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $u = $stmt->get_result()->fetch_assoc() ?: [];
    $stmt->close();

    $subject = 'Alumni password reset assistance needed';
    $body = "An alumni account requested a password reset but has no usable verification method (no email / passkey on file), so it cannot be reset automatically.\r\n\r\n"
        . "Requested at: " . gmdate('Y-m-d H:i:s') . " UTC\r\n"
        . "User id: {$userId}\r\n"
        . "Username: {$safeUsername}\r\n"
        . "Name: " . (string)($u['name'] ?? '(unknown)') . "\r\n"
        . "Email: " . (string)($u['email'] ?? '(none)') . "\r\n"
        . "Status: " . (string)($u['account_status'] ?? '(unknown)') . "\r\n"
        . "Last login: " . (string)($u['last_login_at'] ?? '(never)') . "\r\n\r\n"
        . "Please reach out to help them regain access.\r\n";

    return alumni_send_email($adminEmail, $subject, $body);
}
