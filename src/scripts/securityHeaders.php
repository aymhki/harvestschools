<?php
require_once __DIR__ . '/mfaConfig.php';

function send_security_headers() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    if (!mfa_is_local_request() && is_https_request()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

function is_https_request() {
    if (!empty($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) !== 'off') {
        return true;
    }

    if (($_SERVER['SERVER_PORT'] ?? '') === '443') {
        return true;
    }

    $forwarded = strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');

    return $forwarded === 'https';
}
