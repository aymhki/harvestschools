<?php

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

    if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $config['allowed_origins'])) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }

    if ($config['access_control_allow_credentials'] === 'true') {
        header('Access-Control-Allow-Credentials: ' . $config['access_control_allow_credentials']);
    }

    header('Access-Control-Allow-Methods: ' . $config['allowed_methods']);
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

    header('Cache-Control: ' . $config['cache_control']);
    header('Pragma: ' . $config['pragma']);
    header('Expires: 0');

    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        exit(0);
    }
}