<?php
require_once __DIR__ . '/WebAuthn/src/WebAuthn.php';

function get_webauthn_rp_id($isAdmin) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $host = $origin ? parse_url($origin, PHP_URL_HOST) : ($_SERVER['HTTP_HOST'] ?? '');
    $host = strtolower(explode(':', (string)$host)[0]);

    if ($host === 'localhost' || $host === '127.0.0.1') {
        return 'localhost';
    }

    if ($isAdmin) {
        return 'admin.harvestschools.com';
    } else {
        return 'harvestschools.com';
    }
}


function get_webauthn_instance() {
    return new lbuchs\WebAuthn\WebAuthn(
        'Harvest Schools Admin',
        get_webauthn_rp_id(false),
        ['none', 'packed', 'apple', 'android-key', 'android-safetynet', 'fido-u2f', 'tpm'],
        true
    );
}

function get_admin_webauthn_instance() {
    return new lbuchs\WebAuthn\WebAuthn(
        'Harvest Schools Admin',
        get_webauthn_rp_id(true),
        ['none', 'packed', 'apple', 'android-key', 'android-safetynet', 'fido-u2f', 'tpm'],
        true
    );
}

