<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';

function handleSimpleMode($from, $message) {
    global $DEPARTMENTS, $STRINGS;

    $session = getSession($from);
    $type = $message['type'] ?? '';

    if (!$session || !$session['language']) {

        if ($type === 'interactive') {
            $btnId = $message['interactive']['button_reply']['id'] ?? '';
            if ($btnId === 'lang_en' || $btnId === 'lang_ar') {
                $lang = $btnId === 'lang_en' ? 'en' : 'ar';
                createOrUpdateSession($from, $lang, 'menu');
                sendDepartmentMenu($from, $lang);
                return;
            }
        }

        askLanguage($from);
        return;
    }

    if ($type === 'interactive') {
        $listId = $message['interactive']['list_reply']['id']
            ?? $message['interactive']['button_reply']['id']
            ?? '';

        if ($listId === 'lang_en' || $listId === 'lang_ar') {
            $lang = $listId === 'lang_en' ? 'en' : 'ar';
            createOrUpdateSession($from, $lang, 'menu');
            sendDepartmentMenu($from, $lang);
            return;
        }

        if (isset($DEPARTMENTS[$listId])) {
            $lang = $session['language'];
            $dept = $DEPARTMENTS[$listId];
            $deptName = $dept[$lang];
            $waLink = "https://wa.me/" . $dept['number'];
            $msg = $STRINGS['tap_to_chat'][$lang] . " *{$deptName}*:\n{$waLink}";
            $urlBtnTitle = ($lang === 'en') ? 'Start Chatting' : 'ابدأ المحادثة';
            sendCtaUrlButton($from, $msg, $urlBtnTitle, $waLink);
            return;
        }
    }

    sendDepartmentMenu($from, $session['language']);
}

function askLanguage($to) {
    global $STRINGS;
    sendButtons($to, $STRINGS['choose_lang'], [
        ["id" => "lang_en", "title" => "English"],
        ["id" => "lang_ar", "title" => "العربية"]
    ]);
}

function sendDepartmentMenu($to, $lang) {
    global $DEPARTMENTS, $STRINGS;
    $rows = [];
    foreach ($DEPARTMENTS as $id => $d) {
        $rows[] = ["id" => $id, "title" => mb_substr($d[$lang], 0, 24)];
    }

    sendList($to, $STRINGS['choose_department'][$lang], $STRINGS['departments_title'][$lang], [[
        "title" => $STRINGS['departments_title'][$lang],
        "rows"  => $rows
    ]]);
}