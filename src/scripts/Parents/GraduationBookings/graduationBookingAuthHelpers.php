<?php
require_once __DIR__ . '/../../headers.php';
require_once __DIR__ . '/../../passwordResetHelpers.php';
require_once __DIR__ . '/../../textMatchHelpers.php';

function gb_config($key = null) {
    static $config = null;

    if ($config === null) {
        $config = [
            'reset_code_ttl_seconds'      => 600,
            'reset_code_max_active'       => 5,
            'reset_challenge_ttl_seconds' => 600,
            'reset_max_verify_attempts'   => 5,
            'resend_cooldown_base_seconds'=> 30,
            'resend_cooldown_max_seconds' => 300,
            'resend_window_seconds'       => 900,
            'resend_max_per_window'       => 5,
            'request_window_seconds'      => 900,
            'request_max_per_window'      => 6,
            'search_window_seconds'       => 60,
            'search_max_per_window'       => 30,
            'recover_window_seconds'      => 900,
            'recover_max_per_window'      => 8,
            'search_min_query_length'     => 2,
            'search_max_results'          => 8,
            'mail_from'                   => 'no-reply@harvestschools.com',
            'mail_from_name'              => 'Harvest Schools Graduation',
            'admin_notification_email'    => 'ayman.hassan@admin.harvestschools.com',
        ];

        $docRoot      = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
        $overridePath = $docRoot !== '' ? dirname($docRoot) . '/configs/graduationBookingConfig.php' : '';

        if ($overridePath !== '' && is_readable($overridePath)) {
            $override = require $overridePath;
            if (is_array($override)) { $config = array_merge($config, $override); }
        }
    }

    if ($key === null) { return $config; }
    return $config[$key] ?? null;
}

/** Localized email copy for the reset-code message, folded into a $ctx for
 *  the shared password-reset core. $lang is 'ar' or 'en'. */
function gb_reset_context($lang = 'en') {
    $ar = ($lang === 'ar');

    return [
        'codes_table'    => 'graduation_booking_password_reset_codes',
        'send_log_table' => 'graduation_booking_password_reset_send_log',
        'ttl_seconds'    => (int)gb_config('reset_code_ttl_seconds'),
        'max_active'     => (int)gb_config('reset_code_max_active'),
        'cooldown_base'  => (int)gb_config('resend_cooldown_base_seconds'),
        'cooldown_max'   => (int)gb_config('resend_cooldown_max_seconds'),
        'window_seconds' => (int)gb_config('resend_window_seconds'),
        'max_per_window' => (int)gb_config('resend_max_per_window'),
        'mail_from'      => gb_config('mail_from'),
        'mail_from_name' => gb_config('mail_from_name'),
        'subject'        => $ar ? 'رمز إعادة تعيين كلمة مرور حجز التخرج'
                                : 'Graduation booking password reset code',
        'intro'          => $ar ? 'رمز إعادة تعيين كلمة المرور الخاص بك هو:'
                                : 'Your password reset code is:',
        'expiry_line'    => $ar ? 'ينتهي هذا الرمز خلال {minutes} دقائق.'
                                : 'It expires in {minutes} minutes.',
        'footer'         => $ar ? 'إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة ولن تتغير كلمة المرور.'
                                : 'If you did not request a password reset, you can ignore this message and your password will not change.',
    ];
}

/** All non-empty parent emails linked to a booking auth_id. */
function gb_parent_emails_for_auth($conn, $authId) {
    $sql = "SELECT DISTINCT p.email
            FROM graduation_booking_parents p
            JOIN graduation_booking_parents_linker pl ON p.parent_id = pl.parent_id
            JOIN graduation_bookings b ON b.booking_id = pl.booking_id
            WHERE b.auth_id = ? AND p.email IS NOT NULL AND p.email <> ''";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $authId);
    $stmt->execute();
    $res = $stmt->get_result();
    $stmt->close();

    $emails = [];
    while ($row = $res->fetch_assoc()) {
        $e = trim((string)$row['email']);
        if ($e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)) { $emails[] = $e; }
    }
    return array_values(array_unique($emails));
}

/** All parent emails linked to a booking_id (used by username recovery). */
function gb_parent_emails_for_booking($conn, $bookingId) {
    $sql = "SELECT DISTINCT p.email
            FROM graduation_booking_parents p
            JOIN graduation_booking_parents_linker pl ON p.parent_id = pl.parent_id
            WHERE pl.booking_id = ? AND p.email IS NOT NULL AND p.email <> ''";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $bookingId);
    $stmt->execute();
    $res = $stmt->get_result();
    $stmt->close();

    $emails = [];
    while ($row = $res->fetch_assoc()) {
        $e = trim((string)$row['email']);
        if ($e !== '' && filter_var($e, FILTER_VALIDATE_EMAIL)) { $emails[] = $e; }
    }
    return array_values(array_unique($emails));
}

function gb_send_plain_email($to, $subject, $bodyText) {
    if (empty($to)) { return false; }
    $from     = gb_config('mail_from');
    $fromName = gb_config('mail_from_name');

    $headers  = "From: {$fromName} <{$from}>\r\n";
    $headers .= "Reply-To: {$from}\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $headers .= "X-Auto-Response-Suppress: All\r\n";
    $headers .= "Auto-Submitted: auto-generated\r\n";

    return @mail($to, $subject, $bodyText . "\r\n", $headers, "-f {$from}");
}

/** Email the username to a parent mailbox during username recovery. */
function gb_send_username_email($to, $username, $lang = 'en') {
    $ar = ($lang === 'ar');
    $subject = $ar ? 'اسم المستخدم الخاص بحجز التخرج' : 'Your graduation booking username';
    $safeUsername = preg_replace('/[\r\n]+/', ' ', (string)$username);
    $body = ($ar
        ? "لقد طلب أحدهم استرجاع اسم المستخدم الخاص بحجز التخرج المرتبط بهذا البريد الإلكتروني.\r\n\r\nاسم المستخدم الخاص بك هو:\r\n\r\n    {$safeUsername}\r\n\r\nإذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة."
        : "Someone requested the graduation booking username associated with this email address.\r\n\r\nYour username is:\r\n\r\n    {$safeUsername}\r\n\r\nIf you did not request this, you can safely ignore this message.");
    return gb_send_plain_email($to, $subject, $body);
}

/** Fallback: notify a site admin that a parent needs manual help (no email
 *  on file to deliver a code/username to). $reason is a short machine tag. */
function gb_send_admin_notice($conn, $authId, $username, $reason) {
    $adminEmail = (string)gb_config('admin_notification_email');
    if ($adminEmail === '' || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) { return false; }

    $safeUsername = preg_replace('/[\r\n]+/', ' ', (string)$username);

    // Gather booking context for the admin.
    $bookingLines = '(none)';
    if ($authId !== null) {
        $stmt = $conn->prepare(
            "SELECT b.booking_id, b.booking_date, b.status
             FROM graduation_bookings b WHERE b.auth_id = ?"
        );
        $stmt->bind_param("i", $authId);
        $stmt->execute();
        $res = $stmt->get_result();
        $stmt->close();
        $lines = [];
        while ($row = $res->fetch_assoc()) {
            $lines[] = "  - booking #{$row['booking_id']} | date {$row['booking_date']} | status {$row['status']}";
        }
        if ($lines) { $bookingLines = implode("\r\n", $lines); }
    }

    $subject = 'Graduation booking recovery assistance needed';
    $body = "A parent could not self-serve a graduation booking recovery and has no email on file.\r\n\r\n"
        . "Reason: {$reason}\r\n"
        . "Requested at: " . gmdate('Y-m-d H:i:s') . " UTC\r\n"
        . "Auth id: " . ($authId === null ? '(unknown)' : (int)$authId) . "\r\n"
        . "Username: {$safeUsername}\r\n\r\n"
        . "== Bookings ==\r\n{$bookingLines}\r\n\r\n"
        . "Please reach out to help them regain access.\r\n";

    return gb_send_plain_email($adminEmail, $subject, $body);
}

/** Per-username throttle for starting a reset (mirrors admin reset_request). */
function gb_request_throttle($conn, $ownerKey) {
    $window = (int)gb_config('request_window_seconds');
    $max    = (int)gb_config('request_max_per_window');

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM graduation_booking_password_reset_send_log
         WHERE owner_key = ? AND sent_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("si", $ownerKey, $window);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    return $count < $max;
}

/** Abuse throttle for unauthenticated recovery/search, keyed by client. */
function gb_client_key() {
    $fp = isset($_SERVER['HTTP_X_CLIENT_FINGERPRINT']) ? substr((string)$_SERVER['HTTP_X_CLIENT_FINGERPRINT'], 0, 128) : '';
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    return hash('sha256', $fp . '|' . $ip);
}

function gb_recovery_throttle($conn, $action) {
    $window = (int)gb_config($action === 'search' ? 'search_window_seconds' : 'recover_window_seconds');
    $max    = (int)gb_config($action === 'search' ? 'search_max_per_window' : 'recover_max_per_window');
    $clientKey = gb_client_key();

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS c FROM graduation_booking_recovery_throttle
         WHERE client_key = ? AND action = ? AND created_at > (NOW() - INTERVAL ? SECOND)"
    );
    $stmt->bind_param("ssi", $clientKey, $action, $window);
    $stmt->execute();
    $count = (int)$stmt->get_result()->fetch_assoc()['c'];
    $stmt->close();

    if ($count >= $max) { return false; }

    $stmt = $conn->prepare(
        "INSERT INTO graduation_booking_recovery_throttle (client_key, action) VALUES (?, ?)"
    );
    $stmt->bind_param("ss", $clientKey, $action);
    $stmt->execute();
    $stmt->close();

    // opportunistic cleanup
    $conn->query("DELETE FROM graduation_booking_recovery_throttle WHERE created_at < (NOW() - INTERVAL 1 DAY)");

    return true;
}

/** Ensure the search index row for a student is fresh; returns the index row. */
function gb_upsert_student_search_index($conn, $studentId, $name, $grade, $division) {
    $nameNorm = tm_normalize($name);
    $nameLatin = tm_latin_key($name);
    $gradeNorm = tm_normalize($grade);
    $divNorm = tm_normalize($division);

    $stmt = $conn->prepare(
        "INSERT INTO graduation_booking_students_search_index
            (student_id, name_normalized, name_latin, grade_normalized, division_normalized)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            name_normalized = VALUES(name_normalized),
            name_latin = VALUES(name_latin),
            grade_normalized = VALUES(grade_normalized),
            division_normalized = VALUES(division_normalized)"
    );
    $stmt->bind_param("issss", $studentId, $nameNorm, $nameLatin, $gradeNorm, $divNorm);
    $stmt->execute();
    $stmt->close();
}
