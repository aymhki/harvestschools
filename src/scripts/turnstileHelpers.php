<?php

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
require_once dirname($doc_root) . '/configs/turnstileConfig.php';

function verify_turnstile_token_if_present() {
    $token = isset($_POST['cf-turnstile-response']) ? trim((string)$_POST['cf-turnstile-response']) : '';

    if ($token === '') {
        return ['ok' => true, 'mode' => 'fallback'];
    }

    if (!function_exists('curl_init')) {
        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    $config = turnstile_config();

    $postFields = [
        'secret' => $config['secret_key'],
        'response' => $token,
    ];

    if (!empty($_SERVER['REMOTE_ADDR'])) {
        $postFields['remoteip'] = $_SERVER['REMOTE_ADDR'];
    }

    $ch = curl_init($config['siteverify_url']);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $config['verify_timeout_seconds']);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $config['verify_timeout_seconds']);

    $responseBody = curl_exec($ch);
    $curlErrorNumber = curl_errno($ch);
    curl_close($ch);

    if ($curlErrorNumber !== 0 || $responseBody === false) {
        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    $decoded = json_decode($responseBody, true);

    if (!is_array($decoded)) {
        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    if (empty($decoded['success'])) {
        return ['ok' => false, 'mode' => 'rejected'];
    }

    return ['ok' => true, 'mode' => 'verified'];
}