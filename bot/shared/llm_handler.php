<?php
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
require_once dirname($doc_root) . '/configs/botConfig.php';

function llm_curl_post($url, $headers, $payload) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 30
    ]);
    $body = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        file_put_contents(__DIR__ . '/error.log', date('c') . " LLM CURL ERROR: {$curlErr}\n", FILE_APPEND);
        return false;
    }
    if ($httpCode < 200 || $httpCode >= 300) {
        file_put_contents(__DIR__ . '/error.log', date('c') . " LLM HTTP {$httpCode}: {$body}\n", FILE_APPEND);
        return false;
    }
    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        file_put_contents(__DIR__ . '/error.log', date('c') . " LLM JSON DECODE ERROR: {$body}\n", FILE_APPEND);
        return false;
    }
    return $decoded;
}

function llm_chat($systemPrompt, $history, $userMessage, $lang = 'en') {
    global $STRINGS;
    $result = false;
    if (LLM_PROVIDER === 'gemini') {
        $result = gemini_chat($systemPrompt, $history, $userMessage);
    } elseif (LLM_PROVIDER === 'deepseek') {
        $result = deepseek_chat($systemPrompt, $history, $userMessage);
    } elseif (LLM_PROVIDER === 'claude') {
        $result = claude_chat($systemPrompt, $history, $userMessage);
    }
    if ($result === false || $result === null || trim((string)$result) === '') {
        return $STRINGS['llm_error'][$lang] ?? "Sorry, could not process your request.";
    }
    return $result;
}

function gemini_chat($systemPrompt, $history, $userMessage) {
    $contents = [];
    foreach ($history as $h) {
        $contents[] = [
            "role"  => $h['role'] === 'assistant' ? 'model' : 'user',
            "parts" => [["text" => $h['message']]]
        ];
    }
    $contents[] = ["role" => "user", "parts" => [["text" => $userMessage]]];

    $payload = [
        "system_instruction" => ["parts" => [["text" => $systemPrompt]]],
        "contents" => $contents
    ];

    $url = "https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=" . GEMINI_API_KEY;
    $resp = llm_curl_post($url, ["Content-Type: application/json"], $payload);
    if ($resp === false) return false;
    return $resp['candidates'][0]['content']['parts'][0]['text'] ?? false;
}

function deepseek_chat($systemPrompt, $history, $userMessage) {
    $messages = [["role" => "system", "content" => $systemPrompt]];
    foreach ($history as $h) {
        $messages[] = ["role" => $h['role'], "content" => $h['message']];
    }
    $messages[] = ["role" => "user", "content" => $userMessage];
    $payload = [
        "model" => "deepseek-v4-pro",
        "messages" => $messages
    ];
    $headers = [
        "Authorization: Bearer " . DEEPSEEK_API_KEY,
        "Content-Type: application/json"
    ];
    $resp = llm_curl_post("https://api.deepseek.com/chat/completions", $headers, $payload);
    if ($resp === false) return false;
    return $resp['choices'][0]['message']['content'] ?? false;
}

function claude_chat($systemPrompt, $history, $userMessage) {
    $messages = [];
    foreach ($history as $h) {
        $messages[] = [
            "role"    => $h['role'] === 'assistant' ? 'assistant' : 'user',
            "content" => $h['message']
        ];
    }
    $messages[] = ["role" => "user", "content" => $userMessage];
    $payload = [
        "model"      => "claude-haiku-4-5-20251001",
        "max_tokens" => 1024,
        "system"     => $systemPrompt,
        "messages"   => $messages
    ];
    $headers = [
        "x-api-key: " . CLAUDE_API_KEY,
        "anthropic-version: 2023-06-01",
        "Content-Type: application/json"
    ];
    $resp = llm_curl_post("https://api.anthropic.com/v1/messages", $headers, $payload);
    if ($resp === false) return false;
    return $resp['content'][0]['text'] ?? false;
}
