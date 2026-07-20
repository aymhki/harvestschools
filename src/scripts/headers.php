<?php

require_once __DIR__ . '/securityHeaders.php';

function set_cors_headers($customOptions = []) {
    $defaults = [
        'content_type'    => 'application/json',
        'allowed_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
        'allowed_origins' => [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'http://localhost:8080',
            'http://localhost',
            'https://localhost',
            'capacitor://localhost'
        ],
        'cache_control'   => 'no-store, no-cache, must-revalidate, max-age=0',
        'pragma'          => 'no-cache',
        'access_control_allow_credentials' => 'true'
    ];

    $config = array_merge($defaults, $customOptions);

    header('Content-Type: ' . $config['content_type']);

    send_security_headers();

    if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $config['allowed_origins'])) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Vary: Origin');
    }

    if ($config['access_control_allow_credentials'] === 'true') {
        header('Access-Control-Allow-Credentials: ' . $config['access_control_allow_credentials']);
    }

    header('Access-Control-Allow-Methods: ' . $config['allowed_methods']);
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Client-Fingerprint, X-Client-Platform, X-Device-Binding');
    header('Cache-Control: ' . $config['cache_control']);
    header('Pragma: ' . $config['pragma']);
    header('Expires: 0');

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}

function get_bearer_token() {
    $headers = null;

    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }

    return null;
}

function get_bearer_token_hash() {
    $token = get_bearer_token();
    return $token ? hash('sha256', $token) : null;
}
