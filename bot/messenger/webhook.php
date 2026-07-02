<?php
require_once __DIR__ . '/../shared/config.php';
require_once __DIR__ . '/../shared/db.php';
require_once __DIR__ . '/messenger_api.php';

setActiveChannel('messenger');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode      = $_GET['hub_mode']         ?? '';
    $token     = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge']    ?? '';
    if ($mode === 'subscribe' && $token === MESSENGER_VERIFY_TOKEN) {
        echo $challenge;
        exit;
    }
    http_response_code(403);
    exit;
}

$rawBody = file_get_contents('php://input');

if (defined('MESSENGER_APP_SECRET') && MESSENGER_APP_SECRET && MESSENGER_APP_SECRET !== 'YOUR_MESSENGER_APP_SECRET') {
    $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
    $expected  = 'sha256=' . hash_hmac('sha256', $rawBody, MESSENGER_APP_SECRET);
    if (!$signature || !hash_equals($expected, $signature)) {
        http_response_code(403);
        exit;
    }
}

$input = json_decode($rawBody, true);

try {
    if (($input['object'] ?? '') !== 'page') {
        http_response_code(200);
        exit;
    }
    $messaging = $input['entry'][0]['messaging'][0] ?? null;
    if (!$messaging) {
        http_response_code(200);
        exit;
    }
    $from = $messaging['sender']['id'] ?? null;
    if (!$from) {
        http_response_code(200);
        exit;
    }
    $message = normalizeMessengerMessage($messaging);
    if (!$message) {
        http_response_code(200);
        exit;
    }
    if (BOT_ON === 1) {
        if (BOT_MODE === 'advanced') {
            require_once __DIR__ . '/../shared/modes/advanced_mode.php';
            handleAdvancedMode($from, $message);
        } else if (BOT_MODE == 'intermediate') {
            require_once __DIR__ . '/../shared/modes/intermediate_mode.php';
            handleIntermediateMode($from, $message);
        } else {
            require_once __DIR__ . '/../shared/modes/simple_mode.php';
            handleSimpleMode($from, $message);
        }
    }
} catch (Throwable $e) {
    file_put_contents(__DIR__ . '/error.log', date('c') . " " . $e->getMessage() . "\n", FILE_APPEND);
}
http_response_code(200);


function normalizeMessengerMessage($messaging) {
    if (isset($messaging['postback'])) {
        return [
            'type' => 'interactive',
            'interactive' => [
                'button_reply' => [
                    'id'    => $messaging['postback']['payload'] ?? '',
                    'title' => $messaging['postback']['title'] ?? ''
                ]
            ]
        ];
    }
    if (isset($messaging['message']['quick_reply'])) {
        return [
            'type' => 'interactive',
            'interactive' => [
                'button_reply' => [
                    'id'    => $messaging['message']['quick_reply']['payload'] ?? '',
                    'title' => $messaging['message']['text'] ?? ''
                ]
            ]
        ];
    }
    if (isset($messaging['message']['text'])) {
        return [
            'type' => 'text',
            'text' => ['body' => $messaging['message']['text']]
        ];
    }
    return null;
}
