<?php

try {

    $doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
    require_once dirname($doc_root) . '/configs/botConfig.php';
    require_once __DIR__ . '/../shared/db.php';
    require_once __DIR__ . '/messenger_api.php';


    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $mode      = $_GET['hub_mode']         ?? '';
        $token     = $_GET['hub_verify_token'] ?? '';
        $challenge = $_GET['hub_challenge']    ?? '';

        $ok = ($mode === 'subscribe' && $token === MESSENGER_VERIFY_TOKEN);

        if ($ok) {
            echo $challenge;
            exit;
        }

        http_response_code(403);
        exit;

    }

    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true);

    $object = $input['object'] ?? '';

    if ($object !== 'page' && $object !== 'instagram') {
        http_response_code(200);
        exit;
    }

    setActiveChannel($object === 'instagram' ? 'instagram' : 'messenger');
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

    $session = getSession($from);
    $message = normalizeMessengerMessage($messaging);

    if (isset($message['type']) && $message['type'] === 'handover') {
        $newOwner = $message['new_owner_app_id'] ?? null;
        updateThreadOwner($from, $newOwner);
        touchSession($from);
        http_response_code(200);
        exit;
    }

    if (!$message) {
        http_response_code(200);
        exit;
    }


    if (isNewSession($session)) {
        resetSession($from);
    } else {
        if (!isBotInControl($from)) {
            touchSession($from);
            http_response_code(200);
            exit;
        }
    }

    $channelOn = defined('BOT_ON_MESSENGER') ? BOT_ON_MESSENGER : BOT_ON;

    if (BOT_ON === 1 && $channelOn === 1) {
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


    if (isset($messaging['take_thread_control']) || isset($messaging['pass_thread_control'])) {
        $eventData = $messaging['take_thread_control'] ?? $messaging['pass_thread_control'];
        $newOwner = $eventData['new_owner_app_id'] ?? null;
        return [
            'type' => 'handover',
            'new_owner_app_id' => $newOwner
        ];
    }

    if (!empty($messaging['message']['is_echo'])
        || !empty($messaging['message']['is_deleted'])
        || !empty($messaging['message']['is_unsupported'])) {
        return null;
    }

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
