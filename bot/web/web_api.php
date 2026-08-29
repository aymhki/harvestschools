<?php

function webReplyBuffer() {
    if (!isset($GLOBALS['WEB_CHAT_REPLIES']) || !is_array($GLOBALS['WEB_CHAT_REPLIES'])) {
        $GLOBALS['WEB_CHAT_REPLIES'] = [];
    }

    return $GLOBALS['WEB_CHAT_REPLIES'];
}

function webPushReply($reply) {
    webReplyBuffer();

    $GLOBALS['WEB_CHAT_REPLIES'][] = $reply;

    return $reply;
}

function webTakeReplies() {
    $replies = webReplyBuffer();

    $GLOBALS['WEB_CHAT_REPLIES'] = [];

    return $replies;
}

function sendText($to, $text) {
    return webPushReply([
        "type" => "text",
        "body" => (string) $text
    ]);
}

function sendButtons($to, $body, $buttons) {
    $prepared = [];

    foreach ($buttons as $btn) {
        $prepared[] = [
            "id"    => (string) $btn['id'],
            "title" => (string) $btn['title']
        ];
    }

    return webPushReply([
        "type"    => "buttons",
        "body"    => (string) $body,
        "buttons" => $prepared
    ]);
}

function sendList($to, $body, $buttonText, $sections) {
    $prepared = [];

    foreach ($sections as $section) {
        $rows = [];

        foreach (($section['rows'] ?? []) as $row) {
            $rows[] = [
                "id"          => (string) $row['id'],
                "title"       => (string) ($row['title'] ?? ''),
                "description" => (string) ($row['description'] ?? '')
            ];
        }

        $prepared[] = [
            "title" => (string) ($section['title'] ?? ''),
            "rows"  => $rows
        ];
    }

    return webPushReply([
        "type"       => "list",
        "body"       => (string) $body,
        "buttonText" => (string) $buttonText,
        "sections"   => $prepared
    ]);
}

function sendCtaUrlButton($to, $text, $buttonTitle, $url) {
    return webPushReply([
        "type"  => "cta_url",
        "body"  => (string) $text,
        "title" => (string) $buttonTitle,
        "url"   => (string) $url
    ]);
}
