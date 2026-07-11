<?php
require_once __DIR__ . '/../shared/config.php';
require_once __DIR__ . '/../shared/text_utils.php';

const MESSENGER_LIST_PAYLOAD_DELIM = '::title::';

function encodeListPayload($id, $title) {
    return $id . MESSENGER_LIST_PAYLOAD_DELIM . $title;
}

function decodeListPayload($payload) {
    $payload = (string) $payload;
    $pos = strpos($payload, MESSENGER_LIST_PAYLOAD_DELIM);
    if ($pos === false) {
        return ['id' => $payload, 'title' => null];
    }
    return [
        'id'    => substr($payload, 0, $pos),
        'title' => substr($payload, $pos + strlen(MESSENGER_LIST_PAYLOAD_DELIM))
    ];
}

function isRtlText($text) {
    return (bool) preg_match('/\p{Arabic}/u', (string) $text);
}

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
        foreach (($section['rows'] ?? []) as $row) {
            $rows[] = $row;
        }
    }

    if (count($rows) > 10) {
        file_put_contents(__DIR__ . '/error.log', date('c') . " sendList: " . count($rows) . " rows truncated to 10 for Messenger/Instagram generic template\n", FILE_APPEND);
        $rows = array_slice($rows, 0, 10);
    }

    if (empty($rows)) {
        return trim((string) $body) !== '' ? sendText($to, $body) : null;
    }

    $selectLabel = isRtlText($body) ? 'اختر' : 'Select';

    $elements = [];
    foreach ($rows as $row) {
        $rowTitle = $row['title'] ?? '';
        $split = splitTitleAndDescription($rowTitle, 80, 80);

        $element = [
            "title"   => $split['title'] !== '' ? $split['title'] : mb_substr($rowTitle, 0, 80),
            "buttons" => [[
                "type"    => "postback",
                "title"   => $selectLabel,
                "payload" => encodeListPayload($row['id'], $rowTitle)
            ]]
        ];

        if ($split['description'] !== '') {
            $element['subtitle'] = $split['description'];
        }

        $elements[] = $element;
    }

    if (trim((string) $body) !== '') {
        sendText($to, $body);
    }

    return msgr_request([
        "recipient"      => ["id" => $to],
        "messaging_type" => "RESPONSE",
        "message"        => [
            "attachment" => [
                "type"    => "template",
                "payload" => [
                    "template_type" => "generic",
                    "elements"      => $elements
                ]
            ]
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
