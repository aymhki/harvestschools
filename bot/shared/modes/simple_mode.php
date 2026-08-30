<?php
require_once __DIR__ . '/../db.php';

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
        $listId = $message['interactive']['list_reply']['id'] ?? $message['interactive']['button_reply']['id'] ?? '';

        if ($listId === 'lang_en' || $listId === 'lang_ar') {
            $lang = $listId === 'lang_en' ? 'en' : 'ar';
            createOrUpdateSession($from, $lang, 'menu');
            sendDepartmentMenu($from, $lang);
            return;
        }

        if (departmentIsChattable($DEPARTMENTS, $listId)) {
            $lang = $session['language'];
            $dept = $DEPARTMENTS[$listId];
            $deptName = $dept[$lang];
            $waLink = "https://wa.me/" . $dept['number'];
            $msg = $STRINGS['tap_to_chat'][$lang] . " *{$deptName}*:\n";
            $urlBtnTitle = $STRINGS['start_chatting'][$lang];
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
    $available = chattableDepartments($DEPARTMENTS);
    $rows = [];
    foreach ($available as $id => $d) {
        $rows[] = ["id" => $id, "title" => $d[$lang]];
    }

    $rows[] = ["id" => $lang === "en" ? "lang_ar" : "lang_en", "title" => $lang === "en" ? "تغيير للعربية" : "Change to English"];

    $bodyText = $STRINGS['choose_department'][$lang];

    if (count($available) !== count($DEPARTMENTS) && isset($STRINGS['hidden_departments_note'][$lang])) {
        $bodyText .= "\n\n_" . $STRINGS['hidden_departments_note'][$lang] . "_";
    }

    sendList($to, $bodyText, $STRINGS['departments_title'][$lang], [[
        "title" => $STRINGS['departments_title'][$lang],
        "rows"  => $rows
    ]]);
}
