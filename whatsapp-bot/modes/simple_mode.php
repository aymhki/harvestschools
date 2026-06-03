<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';

function handleSimpleMode($from, $message) {
    global $DEPARTMENTS, $STRINGS;

    $session = getSession($from);
    $type = $message['type'] ?? '';

    // First contact OR no language yet → ask for language
    if (!$session || !$session['language']) {
        // If they clicked the language button
        if ($type === 'interactive') {
            $btnId = $message['interactive']['button_reply']['id'] ?? '';
            if ($btnId === 'lang_en' || $btnId === 'lang_ar') {
                $lang = $btnId === 'lang_en' ? 'en' : 'ar';
                createOrUpdateSession($from, $lang, 'menu');
                sendDepartmentMenu($from, $lang);
                return;
            }
        }
        // Otherwise ignore text input & show language picker
        askLanguage($from);
        return;
    }

    // They have a language; handle department selection
    if ($type === 'interactive') {
        $listId = $message['interactive']['list_reply']['id']
            ?? $message['interactive']['button_reply']['id']
            ?? '';

        // Allow language reset
        if ($listId === 'lang_en' || $listId === 'lang_ar') {
            $lang = $listId === 'lang_en' ? 'en' : 'ar';
            createOrUpdateSession($from, $lang, 'menu');
            sendDepartmentMenu($from, $lang);
            return;
        }

        if (isset($DEPARTMENTS[$listId])) {
            $dept = $DEPARTMENTS[$listId];
            $lang = $session['language'];
            $deptName = $dept[$lang];
            $waLink = "https://wa.me/" . $dept['number'];

            $msg = $STRINGS['tap_to_chat'][$lang] . " *{$deptName}*:\n{$waLink}";
            sendText($from, $msg);

            // Re-show menu after a moment? Optional. We'll just keep state.
            return;
        }
    }

    // Ignore raw text — re-show menu
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