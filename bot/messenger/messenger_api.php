<?php
require_once __DIR__ . '/../shared/config.php';

function msgr_request($payload) {
    $url = "https://graph.facebook.com/v25.0/me/messages?access_token=" . urlencode(MESSENGER_PAGE_ACCESS_TOKEN);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    return $resp;
}

function sendText($to, $text) {
    return msgr_request([
        "recipient"      => ["id" => $to],
        "messaging_type" => "RESPONSE",
        "message"        => ["text" => $text]
    ]);
}


function sendButtons($to, $body, $buttons) {
    $quickReplies = [];
    foreach ($buttons as $btn) {
        $quickReplies[] = [
            "content_type" => "text",
            "title"        => mb_substr($btn['title'], 0, 20),
            "payload"      => $btn['id']
        ];
    }
    return msgr_request([
        "recipient"      => ["id" => $to],
        "messaging_type" => "RESPONSE",
        "message"        => [
            "text"          => $body,
            "quick_replies" => $quickReplies
        ]
    ]);
}

function sendList($to, $body, $buttonText, $sections) {
    $rows = [];
    foreach ($sections as $section) {
        foreach ($section['rows'] as $row) {
            $rows[] = $row;
        }
    }
    if (count($rows) > 13) {
        file_put_contents(__DIR__ . '/error.log', date('c') . " sendList: " . count($rows) . " rows truncated to 13 for Messenger quick replies\n", FILE_APPEND);
        $rows = array_slice($rows, 0, 13);
    }
    $quickReplies = [];
    foreach ($rows as $row) {
        $quickReplies[] = [
            "content_type" => "text",
            "title"        => mb_substr($row['title'], 0, 20),
            "payload"      => $row['id']
        ];
    }
    return msgr_request([
        "recipient"      => ["id" => $to],
        "messaging_type" => "RESPONSE",
        "message"        => [
            "text"          => $body,
            "quick_replies" => $quickReplies
        ]
    ]);
}

function sendCtaUrlButton($to, $text, $buttonTitle, $url) {
    return msgr_request([
        "recipient"      => ["id" => $to],
        "messaging_type" => "RESPONSE",
        "message"        => [
            "attachment" => [
                "type"    => "template",
                "payload" => [
                    "template_type" => "button",
                    "text"          => $text,
                    "buttons"       => [
                        [
                            "type"  => "web_url",
                            "url"   => $url,
                            "title" => mb_substr($buttonTitle, 0, 20)
                        ]
                    ]
                ]
            ]
        ]
    ]);
}
