<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/whatsapp_api.php';

// ---- Verification (GET) ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode      = $_GET['hub_mode']         ?? '';
    $token     = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge']    ?? '';
    if ($mode === 'subscribe' && $token === WHATSAPP_VERIFY_TOKEN) {
        echo $challenge;
        exit;
    }
    http_response_code(403);
    exit;
}

// ---- Incoming events (POST) ----
$input = json_decode(file_get_contents('php://input'), true);
file_put_contents(__DIR__ . '/webhook.log', date('c') . " " . json_encode($input) . "\n", FILE_APPEND);

try {
    $entry = $input['entry'][0]['changes'][0]['value'] ?? null;
    if (!$entry) { http_response_code(200); exit; }

    $messages = $entry['messages'] ?? [];
    if (empty($messages)) { http_response_code(200); exit; }

    $message = $messages[0];
    $from = $message['from'];

    // Route to correct mode
    if (BOT_MODE === 'advanced') {
        require_once __DIR__ . '/modes/advanced_mode.php';
        handleAdvancedMode($from, $message);
    } else {
        require_once __DIR__ . '/modes/simple_mode.php';
        handleSimpleMode($from, $message);
    }
} catch (Throwable $e) {
    file_put_contents(__DIR__ . '/error.log', date('c') . " " . $e->getMessage() . "\n", FILE_APPEND);
}

http_response_code(200);