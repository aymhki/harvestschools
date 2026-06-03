<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';
require_once __DIR__ . '/../llm_handler.php';

function handleAdvancedMode($from, $message) {
    global $STRINGS, $DEPARTMENTS;

    $session = getSession($from);
    $type    = $message['type'] ?? '';

    // ---------- 1. LANGUAGE SELECTION ----------
    if (!$session || !$session['language']) {
        if ($type === 'interactive') {
            $btnId = $message['interactive']['button_reply']['id'] ?? '';
            if ($btnId === 'lang_en' || $btnId === 'lang_ar') {
                $lang = $btnId === 'lang_en' ? 'en' : 'ar';

                // If user is brand new OR config says don't keep history → clear it
                if (USE_HISTORY_ACROSS_SESSIONS === 0) clearUserHistory($from);

                createOrUpdateSession($from, $lang, 'chatting');
                startNewSession($from);

                $welcome = $STRINGS['welcome'][$lang];
                sendText($from, $welcome);
                saveMessage($from, 'assistant', $welcome);
                return;
            }
        }
        sendButtons($from, $STRINGS['choose_lang'], [
            ["id" => "lang_en", "title" => "English"],
            ["id" => "lang_ar", "title" => "العربية"]
        ]);
        return;
    }

    $lang = $session['language'];

    // ---------- 2. DETECT NEW SESSION (returning user) ----------
    if (isNewSession($session)) {
        if (USE_HISTORY_ACROSS_SESSIONS === 0) clearUserHistory($from);
        startNewSession($from);
        updateSessionState($from, 'chatting');
    } else {
        touchSession($from);
    }
    // Re-fetch session after update
    $session = getSession($from);

    // ---------- 3. HANDLE BUTTON/LIST INTERACTIONS ----------
    if ($type === 'interactive') {
        $btnId  = $message['interactive']['button_reply']['id'] ?? '';
        $listId = $message['interactive']['list_reply']['id']   ?? '';

        // Feedback: helpful
        if ($btnId === 'fb_helpful') {
            $msg = $STRINGS['anything_else'][$lang];
            sendText($from, $msg);
            saveMessage($from, 'assistant', $msg);
            updateSessionState($from, 'chatting');
            return;
        }

        // Feedback: not helpful → show department list
        if ($btnId === 'fb_not_helpful') {
            $msg = $STRINGS['escalate'][$lang];
            sendText($from, $msg);
            saveMessage($from, 'assistant', $msg);
            sendDepartmentList($from, $lang);
            updateSessionState($from, 'escalated');
            return;
        }

        // Department picked from list
        if (isset($DEPARTMENTS[$listId])) {
            $dept = $DEPARTMENTS[$listId];
            $deptName = $dept[$lang];
            $waLink = "https://wa.me/" . $dept['number'];
            $msg = $STRINGS['tap_to_chat'][$lang] . " *{$deptName}*:\n{$waLink}";
            sendText($from, $msg);
            saveMessage($from, 'assistant', $msg);
            updateSessionState($from, 'chatting');
            return;
        }
    }

    // ---------- 4. NORMAL TEXT MESSAGE → CALL LLM ----------
    $userText = '';
    if ($type === 'text') {
        $userText = $message['text']['body'] ?? '';
    } elseif ($type === 'interactive') {
        $userText = $message['interactive']['button_reply']['title']
            ?? $message['interactive']['list_reply']['title']
            ?? '';
    }
    if (!$userText) return;

    saveMessage($from, 'user', $userText);

    $history = getRelevantHistory($from, $session, 50);
    array_pop($history); // remove the just-saved user msg from history

    $systemPrompt = SCHOOL_SYSTEM_PROMPT . "\nUser's preferred language: " . $lang;
    $reply = llm_chat($systemPrompt, $history, $userText, $lang);

    saveMessage($from, 'assistant', $reply);
    sendText($from, $reply);

    // After LLM reply → send feedback buttons
    sendFeedbackButtons($from, $lang);
}

function sendFeedbackButtons($to, $lang) {
    global $STRINGS;
    sendButtons($to, $STRINGS['feedback_prompt'][$lang], [
        ["id" => "fb_helpful",     "title" => $STRINGS['btn_helpful'][$lang]],
        ["id" => "fb_not_helpful", "title" => $STRINGS['btn_not_helpful'][$lang]]
    ]);
}

function sendDepartmentList($to, $lang) {
    global $DEPARTMENTS, $STRINGS;
    $rows = [];
    foreach ($DEPARTMENTS as $id => $d) {
        $rows[] = ["id" => $id, "title" => mb_substr($d[$lang], 0, 24)];
    }
    sendList($to, $STRINGS['departments_title'][$lang], $STRINGS['departments_title'][$lang], [[
        "title" => $STRINGS['departments_title'][$lang],
        "rows"  => $rows
    ]]);
}