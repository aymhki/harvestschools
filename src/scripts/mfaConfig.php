<?php

function mfa_default_config() {
    return [
        'mfa_mode' => 'always',
        'email_code_ttl_seconds' => 600,
        'email_code_max_active' => 5,
        'resend_cooldown_base_seconds' => 30,
        'resend_cooldown_max_seconds'  => 300,
        'resend_window_seconds' => 900,
        'resend_max_per_window' => 5,
        'totp_window_steps' => 2,
        'totp_replay_protection' => true,
        'totp_pending_ttl_seconds' => 900,
        'challenge_ttl_seconds' => 600,
        'max_verify_attempts'   => 5,
        'login_fail_window_seconds' => 900,
        'login_fail_max_per_window' => 10,
        'mail_from'      => 'no-reply@admin.harvestschools.com',
        'mail_from_name' => 'Harvest Schools Admin',
    ];
}

function mfa_config($key = null) {
    static $config = null;

    if ($config === null) {
        $config = mfa_default_config();

        $docRoot      = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
        $overridePath = $docRoot !== '' ? dirname($docRoot) . '/configs/mfaConfig.php' : '';

        if ($overridePath !== '' && is_readable($overridePath)) {
            $override = require $overridePath;
            if (is_array($override)) {
                $config = array_merge($config, $override);
            }
        }

        $mode = $config['mfa_mode'];

        if (!in_array($mode, ['always', 'risk', 'never'], true)) {
            $config['mfa_mode'] = 'always';
        }

        if ($config['mfa_mode'] === 'never' && !mfa_is_local_request()) {
            $config['mfa_mode'] = 'always';
        }
    }

    if ($key === null) {
        return $config;
    }

    return $config[$key] ?? null;
}

function mfa_is_local_request() {
    $host = strtolower(explode(':', (string)($_SERVER['HTTP_HOST'] ?? ''))[0]);

    if (in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
        return true;
    }

    $remote = $_SERVER['REMOTE_ADDR'] ?? '';

    return in_array($remote, ['127.0.0.1', '::1'], true);
}
