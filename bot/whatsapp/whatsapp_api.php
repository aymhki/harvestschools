<?php
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
require_once dirname($doc_root) . '/configs/botConfig.php';
require_once '../shared/text_utils.php';


const WA_LIST_TITLE_LIMIT = 24;
const WA_LIST_DESC_LIMIT  = 72;
const WA_BODY_LIMIT       = 1024;

function waBodyText($body) {
    $body = (string) $body;

    if (mb_strlen($body, 'UTF-8') <= WA_BODY_LIMIT) {
        return $body;
    }

    file_put_contents(__DIR__ . '/error.log', date('c') . " waBodyText: body of " . mb_strlen($body, 'UTF-8') . " chars truncated to " . WA_BODY_LIMIT . "\n", FILE_APPEND);

    return smartTruncate($body, WA_BODY_LIMIT);
}

function wa_request($payload) {
    $url = "https://graph.facebook.com/v26.0/" . WHATSAPP_PHONE_ID . "/messages";
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . WHATSAPP_ACCOUNT_ACCESS_TOKEN,
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $resp = curl_exec($ch);
    return $resp;
}

function sendText($to, $text) {
    return wa_request([
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "text",
        "text" => ["body" => $text]
    ]);
}

function sendButtons($to, $body, $buttons) {
    $btnArr = [];
    foreach ($buttons as $btn) {
        $btnArr[] = [
            "type" => "reply",
            "reply" => ["id" => $btn['id'], "title" => mb_substr($btn['title'], 0, 20)]
        ];
    }
    return wa_request([
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "interactive",
        "interactive" => [
            "type" => "button",
            "body" => ["text" => waBodyText($body)],
            "action" => ["buttons" => $btnArr]
        ]
    ]);
}

function sendList($to, $body, $buttonText, $sections) {
    $preparedSections = [];

    foreach ($sections as $section) {
        $rows = [];

        foreach (($section['rows'] ?? []) as $row) {
            $rows[] = prepareWaListRow($row);
        }

        $preparedSections[] = [
            "title" => smartTruncate($section['title'] ?? '', WA_LIST_TITLE_LIMIT),
            "rows"  => $rows
        ];
    }

    return wa_request([
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "interactive",
        "interactive" => [
            "type" => "list",
            "body" => ["text" => waBodyText($body)],
            "action" => [
                "button" => smartTruncate($buttonText, 20),
                "sections" => $preparedSections
            ]
        ]
    ]);
}

function prepareWaListRow($row) {
    $split = splitTitleAndDescription($row['title'] ?? '', WA_LIST_TITLE_LIMIT, WA_LIST_DESC_LIMIT);

    $existingDesc = trim($row['description'] ?? '');
    $description  = $split['description'];

    if ($existingDesc !== '') {
        $description = trim($description . ' ' . $existingDesc);

        if (mb_strlen($description, 'UTF-8') > WA_LIST_DESC_LIMIT) {
            $description = smartTruncate($description, WA_LIST_DESC_LIMIT);
        }

    }

    $result = [
        "id"    => $row['id'],
        "title" => $split['title']
    ];

    if ($description !== '') {
        $result['description'] = $description;
    }

    return $result;
}

function sendCtaUrlButton($to, $text, $buttonTitle, $url) {
    return wa_request([
        "messaging_product" => "whatsapp",
        "to" => $to,
        "type" => "interactive",
        "interactive" => [
            "type" => "cta_url",
            "body" => ["text" => $text],
            "action" => [
                "name" => "cta_url",
                "parameters" => [
                    "display_text" => mb_substr($buttonTitle, 0, 20),
                    "url" => $url
                ]
            ]
        ]
    ]);
}