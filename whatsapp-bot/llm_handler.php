<?php
require_once __DIR__ . '/config.php';

function llm_chat($systemPrompt, $history, $userMessage, $lang = 'en') {
    global $STRINGS;
    if (LLM_PROVIDER === 'gemini')   return gemini_chat($systemPrompt, $history, $userMessage, $lang);
    if (LLM_PROVIDER === 'deepseek') return deepseek_chat($systemPrompt, $history, $userMessage, $lang);
    return $STRINGS['llm_error'][$lang] ?? "LLM provider not configured.";
}

function gemini_chat($systemPrompt, $history, $userMessage, $lang = 'en') {
    global $STRINGS;
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
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $resp = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $resp['candidates'][0]['content']['parts'][0]['text'] ?? $STRINGS['llm_error'][$lang];
}

function deepseek_chat($systemPrompt, $history, $userMessage, $lang = 'en') {
    global $STRINGS;
    $messages = [["role" => "system", "content" => $systemPrompt]];
    foreach ($history as $h) {
        $messages[] = ["role" => $h['role'], "content" => $h['message']];
    }
    $messages[] = ["role" => "user", "content" => $userMessage];

    $payload = [
        "model" => "deepseek-chat",
        "messages" => $messages
    ];

    $ch = curl_init("https://api.deepseek.com/v1/chat/completions");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . DEEPSEEK_API_KEY,
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $resp = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $resp['choices'][0]['message']['content'] ?? $STRINGS['llm_error'][$lang];
}