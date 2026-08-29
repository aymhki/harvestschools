<?php
require_once __DIR__ . '/../../headers.php';
require_once __DIR__ . '/../../turnstileHelpers.php';
require_once __DIR__ . '/../SchoolInfo/publicRateLimit.php';

set_cors_headers();

const WEB_CHAT_MAX_MESSAGE_LENGTH = 1000;
const WEB_CHAT_MESSAGES_PER_MINUTE = 20;
const WEB_CHAT_MESSAGES_PER_CONVERSATION = 200;
const WEB_CHAT_NEW_CONVERSATIONS_PER_HOUR = 6;

function web_chat_fail($message, $code) {
    http_response_code($code);
    echo json_encode(["success" => false, "message" => $message, "code" => $code]);
    exit;
}

function web_chat_bot_directory($docRoot) {
    foreach ([$docRoot . '/bot', dirname($docRoot) . '/bot'] as $candidate) {
        if (is_file($candidate . '/shared/db.php')) {
            return $candidate;
        }
    }

    return null;
}

function web_chat_new_conversation_id() {
    return 'w' . bin2hex(random_bytes(9));
}

function web_chat_is_conversation_id($value) {
    return is_string($value) && preg_match('/^w[0-9a-f]{18}$/', $value) === 1;
}

function web_chat_clean_text($value) {
    $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value);

    return trim((string) $stripped);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST, OPTIONS');
    web_chat_fail("Method not allowed", 405);
}

if (!public_rate_limit_allow('web-chat', WEB_CHAT_MESSAGES_PER_MINUTE, 60)) {
    public_rate_limit_reject();
}

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$botDirectory = web_chat_bot_directory($doc_root);

if ($botDirectory === null) {
    web_chat_fail("The chat assistant is temporarily unavailable", 503);
}

require_once $botDirectory . '/shared/db.php';
require_once $botDirectory . '/web/web_api.php';

setActiveChannel('web');

try {
    $payload = json_decode(file_get_contents('php://input'), true);

    if (!is_array($payload)) {
        web_chat_fail("Invalid request body", 400);
    }

    $channelOn = defined('BOT_ON_WEB') ? BOT_ON_WEB : BOT_ON;

    if (BOT_ON !== 1 || $channelOn !== 1) {
        web_chat_fail("The chat assistant is currently switched off", 503);
    }

    $conversationId = $payload['conversationId'] ?? '';
    $isNewConversation = ($conversationId === '' || $conversationId === null);

    if ($isNewConversation) {
        $turnstileCheck = verify_turnstile_token_if_present(null, true);

        if (!$turnstileCheck['ok']) {
            web_chat_fail("Human verification failed. Please refresh the page and try again.", 403);
        }

        if (!public_rate_limit_allow('web-chat-new', WEB_CHAT_NEW_CONVERSATIONS_PER_HOUR, 3600)) {
            public_rate_limit_reject();
        }

        $conversationId = web_chat_new_conversation_id();
        createOrUpdateSession($conversationId, null, 'new');
        $session = getSession($conversationId);
    } else {
        if (!web_chat_is_conversation_id($conversationId)) {
            web_chat_fail("Unknown conversation", 410);
        }

        $session = getSession($conversationId);

        if (!$session) {
            web_chat_fail("Unknown conversation", 410);
        }

        if (!public_rate_limit_allow('web-chat-' . $conversationId, WEB_CHAT_MESSAGES_PER_CONVERSATION, 86400)) {
            web_chat_fail("This conversation has reached its message limit. Please start a new one.", 429);
        }
    }

    $messageType = (string) ($payload['type'] ?? 'open');
    $message = ['type' => 'open'];

    if ($messageType === 'reset') {
        if ($isNewConversation) {
            web_chat_fail("Unknown conversation", 410);
        }

        resetSession($conversationId);
    } elseif ($messageType === 'text') {
        if (BOT_MODE !== 'advanced') {
            web_chat_fail("Please choose one of the options", 400);
        }

        $text = web_chat_clean_text($payload['text'] ?? '');

        if ($text === '') {
            web_chat_fail("Please type a message", 400);
        }

        if (mb_strlen($text, 'UTF-8') > WEB_CHAT_MAX_MESSAGE_LENGTH) {
            web_chat_fail("That message is too long. Please shorten it and try again.", 413);
        }

        $message = ['type' => 'text', 'text' => ['body' => $text]];
    } elseif ($messageType === 'button' || $messageType === 'list') {
        $replyId = mb_substr(web_chat_clean_text($payload['replyId'] ?? ''), 0, WEB_CHAT_MAX_MESSAGE_LENGTH);
        $replyTitle = mb_substr(web_chat_clean_text($payload['replyTitle'] ?? ''), 0, WEB_CHAT_MAX_MESSAGE_LENGTH);

        if ($replyId === '') {
            web_chat_fail("Please choose an option", 400);
        }

        $message = [
            'type' => 'interactive',
            'interactive' => [
                ($messageType === 'list' ? 'list_reply' : 'button_reply') => ['id' => $replyId, 'title' => $replyTitle]
            ]
        ];
    }

    if (BOT_MODE === 'advanced') {
        require_once $botDirectory . '/shared/modes/advanced_mode.php';
        handleAdvancedMode($conversationId, $message);
    } else if (BOT_MODE === 'intermediate') {
        require_once $botDirectory . '/shared/modes/intermediate_mode.php';
        handleIntermediateMode($conversationId, $message);
    } else {
        require_once $botDirectory . '/shared/modes/simple_mode.php';
        handleSimpleMode($conversationId, $message);
    }

    $replies = webTakeReplies();

    if ($replies === [] && BOT_MODE === 'advanced') {
        $session = getSession($conversationId);
        $language = ($session && $session['language'] === 'ar') ? 'ar' : 'en';

        if (isset($STRINGS['welcome'][$language])) {
            sendText($conversationId, $STRINGS['welcome'][$language]);
            $replies = webTakeReplies();
        }
    }

    echo json_encode([
        "success"        => true,
        "message"        => "Reply generated successfully",
        "code"           => 200,
        "conversationId" => $conversationId,
        "isNew"          => $isNewConversation,
        "replies"        => $replies
    ]);

} catch (Throwable $e) {
    web_chat_fail("The chat assistant is temporarily unavailable", 500);
}
