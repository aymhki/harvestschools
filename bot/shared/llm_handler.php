<?php
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
require_once dirname($doc_root) . '/configs/botConfig.php';

function llm_log($message) {
    file_put_contents(__DIR__ . '/error.log', date('c') . ' ' . $message . "\n", FILE_APPEND);
}

function llm_log_empty_reply($provider, $resp, $context) {
    $body = json_encode($resp, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($body === false) {
        $body = '[unencodable response]';
    } elseif (strlen($body) > 2000) {
        $body = substr($body, 0, 2000) . '...[truncated]';
    }

    llm_log("LLM EMPTY REPLY ({$provider}): {$context} | response: {$body}");
}

function llm_text_from_claude_blocks($blocks) {
    if (!is_array($blocks)) return '';

    $text = '';

    foreach ($blocks as $block) {
        if (!is_array($block)) continue;
        if (($block['type'] ?? '') !== 'text') continue;
        if (!is_string($block['text'] ?? null)) continue;

        $text .= $block['text'];
    }

    return $text;
}

function llm_claude_block_types($blocks) {
    if (!is_array($blocks) || !$blocks) return 'none';

    $types = [];

    foreach ($blocks as $block) {
        $types[] = is_array($block) ? ($block['type'] ?? '?') : gettype($block);
    }

    return implode(',', $types);
}

function llm_text_from_gemini_parts($parts) {
    if (!is_array($parts)) return '';

    $text = '';

    foreach ($parts as $part) {
        if (!is_array($part)) continue;
        if (!empty($part['thought'])) continue;
        if (!is_string($part['text'] ?? null)) continue;

        $text .= $part['text'];
    }

    return $text;
}

function llm_gemini_thought_count($parts) {
    if (!is_array($parts)) return 0;

    $thoughts = 0;

    foreach ($parts as $part) {
        if (is_array($part) && !empty($part['thought'])) $thoughts++;
    }

    return $thoughts;
}

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

    if ($curlErr) {
        llm_log("LLM CURL ERROR: {$curlErr}");
        return false;
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        llm_log("LLM HTTP {$httpCode}: {$body}");
        return false;
    }

    $decoded = json_decode($body, true);

    if (!is_array($decoded)) {
        llm_log("LLM JSON DECODE ERROR: {$body}");
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

    $parts = $resp['candidates'][0]['content']['parts'] ?? null;
    $text  = llm_text_from_gemini_parts($parts);

    if (trim($text) === '') {
        llm_log_empty_reply('gemini', $resp, sprintf(
            'finishReason=%s blockReason=%s candidates=%d parts=%d thoughts=%d',
            $resp['candidates'][0]['finishReason'] ?? 'none',
            $resp['promptFeedback']['blockReason'] ?? 'none',
            is_array($resp['candidates'] ?? null) ? count($resp['candidates']) : 0,
            is_array($parts) ? count($parts) : 0,
            llm_gemini_thought_count($parts)
        ));

        return false;
    }

    return $text;
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

    $text = $resp['choices'][0]['message']['content'] ?? null;

    if (!is_string($text) || trim($text) === '') {
        llm_log_empty_reply('deepseek', $resp, sprintf(
            'finish_reason=%s choices=%d reasoning_only=%s',
            $resp['choices'][0]['finish_reason'] ?? 'none',
            is_array($resp['choices'] ?? null) ? count($resp['choices']) : 0,
            trim((string)($resp['choices'][0]['message']['reasoning_content'] ?? '')) !== '' ? 'yes' : 'no'
        ));

        return false;
    }

    return $text;
}

function claude_build_payload($systemPrompt, $history, $userMessage) {
    $breakpointIndex = -1;

    for ($i = count($history) - 1; $i >= 0; $i--) {
        if (trim((string)$history[$i]['message']) !== '') {
            $breakpointIndex = $i;
            break;
        }
    }

    $messages = [];

    foreach ($history as $i => $h) {
        $role = $h['role'] === 'assistant' ? 'assistant' : 'user';

        if ($i === $breakpointIndex) {
            $messages[] = [
                "role"    => $role,
                "content" => [[
                    "type"          => "text",
                    "text"          => $h['message'],
                    "cache_control" => ["type" => "ephemeral"]
                ]]
            ];
        } else {
            $messages[] = ["role" => $role, "content" => $h['message']];
        }
    }

    $messages[] = ["role" => "user", "content" => $userMessage];

    return [
        "model"      => "claude-haiku-4-5-20251001",
        "max_tokens" => 1024,
        "system"     => [[
            "type"          => "text",
            "text"          => $systemPrompt,
            "cache_control" => ["type" => "ephemeral", "ttl" => "1h"]
        ]],
        "messages"   => $messages
    ];
}

function claude_chat($systemPrompt, $history, $userMessage) {
    $payload = claude_build_payload($systemPrompt, $history, $userMessage);
    $headers = [
        "x-api-key: " . CLAUDE_API_KEY,
        "anthropic-version: 2023-06-01",
        "Content-Type: application/json"
    ];
    $resp = llm_curl_post("https://api.anthropic.com/v1/messages", $headers, $payload);
    if ($resp === false) return false;

    $blocks = $resp['content'] ?? null;
    $text   = llm_text_from_claude_blocks($blocks);

    if (trim($text) === '') {
        llm_log_empty_reply('claude', $resp, sprintf(
            'stop_reason=%s refusal_category=%s blocks=%d types=%s',
            $resp['stop_reason'] ?? 'none',
            $resp['stop_details']['category'] ?? 'none',
            is_array($blocks) ? count($blocks) : 0,
            llm_claude_block_types($blocks)
        ));

        return false;
    }

    return $text;
}
