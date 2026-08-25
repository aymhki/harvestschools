<?php

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$turnstileConfigPath = dirname($doc_root) . '/configs/turnstileConfig.php';

if (is_file($turnstileConfigPath)) {
    require_once $turnstileConfigPath;
}


function turnstile_token_from_request($explicitToken = null) {
    if (is_string($explicitToken) && trim($explicitToken) !== '') {
        return trim($explicitToken);
    }

    if (isset($_POST['cf-turnstile-response'])) {
        return trim((string)$_POST['cf-turnstile-response']);
    }

    $header = $_SERVER['HTTP_X_TURNSTILE_TOKEN'] ?? '';

    if (is_string($header) && trim($header) !== '') {
        return trim($header);
    }

    $rawBody = file_get_contents('php://input');

    if (is_string($rawBody) && $rawBody !== '') {
        $decoded = json_decode($rawBody, true);

        if (is_array($decoded) && isset($decoded['cf-turnstile-response'])) {
            return trim((string)$decoded['cf-turnstile-response']);
        }
    }

    return '';
}


function turnstile_log_outcome($mode, $detail = '') {
    $endpoint = $_SERVER['SCRIPT_NAME'] ?? 'unknown';

    error_log('Turnstile ' . $mode . ' at ' . $endpoint . ($detail === '' ? '' : ' - ' . $detail));
}


function verify_turnstile_token_if_present($explicitToken, $required) {
    $token = turnstile_token_from_request($explicitToken);

    if ($token === '') {
//        turnstile_log_outcome($required ? 'missing' : 'fallback');

        return $required ? ['ok' => false, 'mode' => 'missing'] : ['ok' => true, 'mode' => 'fallback'];
    }

    if (!function_exists('turnstile_config')) {
//        turnstile_log_outcome('cf-unreachable', 'turnstileConfig.php is missing, the token was accepted unverified');

        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    if (!function_exists('curl_init')) {
//        turnstile_log_outcome('cf-unreachable', 'curl is not installed, the token was accepted unverified');

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
    $curlErrorMessage = curl_error($ch);

    if ($curlErrorNumber !== 0 || $responseBody === false) {
//        turnstile_log_outcome('cf-unreachable', 'curl error ' . $curlErrorNumber . ' ' . $curlErrorMessage . ', the token was accepted unverified');

        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    $decoded = json_decode($responseBody, true);

    if (!is_array($decoded)) {
//        turnstile_log_outcome('cf-unreachable', 'siteverify returned an unparseable body, the token was accepted unverified');

        return ['ok' => true, 'mode' => 'cf-unreachable'];
    }

    if (empty($decoded['success'])) {
        $errorCodes = isset($decoded['error-codes']) && is_array($decoded['error-codes'])
            ? implode(', ', $decoded['error-codes'])
            : 'none reported';

//        turnstile_log_outcome('rejected', $errorCodes);

        return ['ok' => false, 'mode' => 'rejected'];
    }

    return ['ok' => true, 'mode' => 'verified'];
}