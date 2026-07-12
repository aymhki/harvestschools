<?php
require_once '../db.php';
require_once '../../../configs/botConfig.php';

function findStageById($stageId) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    foreach ($config['departments'] as $deptKey => $dept) {
        foreach ($dept['sections'] as $secKey => $section) {
            if (isset($section['stages'][$stageId])) {
                return $section['stages'][$stageId];
            }
        }
    }
    return null;
}

function getRequirementsForStage($stageId, $stageName, $lang) {
    $medicalStages = ['stg_nat_kg1', 'stg_brit_fs1', 'stg_am_prek'];
    $noReportStages = ['stg_pre_play', 'stg_play', 'stg_nat_kg1', 'stg_brit_fs1', 'stg_am_prek'];
    $needsMedical = in_array($stageId, $medicalStages);
    $needsReport = !in_array($stageId, $noReportStages);

    if ($lang === 'en') {
        $text = "*Admission Requirements for {$stageName}:*\n";
        $text .= "• Original Birth Certificate\n";
        $text .= "• 6 Recent Photos\n";
        $text .= "• Father and Mother ID copies\n";
        $text .= "• Updated Immunization Record\n";
        if ($needsMedical) $text .= "• Medical Certificate (issued by health insurance)\n";
        if ($needsReport) $text .= "• Previous School Report Card\n";
    } else {
        $text = "*متطلبات التقديم لمرحلة {$stageName}:*\n";
        $text .= "• أصل شهادة الميلاد\n";
        $text .= "• 6 صور شخصية حديثة\n";
        $text .= "• صور بطاقة الرقم القومي للأب والأم\n";
        $text .= "• سجل التطعيمات محدث\n";
        if ($needsMedical) $text .= "• شهادة طبية (مستخرجة من التأمين الصحي)\n";
        if ($needsReport) $text .= "• بيان نجاح / شهادة من المدرسة السابقة\n";
    }

    return $text;
}

function handleIntermediateMode($from, $message) {
    $session = getSession($from);
    $type = $message['type'] ?? '';

    if ($type === 'text') {
        $textBody = strtolower(trim($message['text']['body'] ?? ''));
        if (in_array($textBody, ['menu', 'القائمة', 'main menu'])) {
            if ($session && $session['language']) {
                sendMainMenuIntermediate($from, $session['language'], true);
                return;
            }
        }
    }

    if (!$session || !$session['language']) {
        if ($type === 'interactive') {
            $btnId = $message['interactive']['button_reply']['id'] ?? '';
            if ($btnId === 'lang_en' || $btnId === 'lang_ar') {
                $lang = $btnId === 'lang_en' ? 'en' : 'ar';
                createOrUpdateSession($from, $lang, 'menu');
                sendMainMenuIntermediate($from, $lang, false);
                return;
            }
        }

        askLanguageMode($from);
        return;
    }

    $lang = $session['language'];
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;

    if ($type === 'interactive') {
        $replyId = $message['interactive']['list_reply']['id'] ?? $message['interactive']['button_reply']['id'] ?? '';

        if (strpos($replyId, 'lang_toggle_') === 0) {
            $lang = ($lang === 'en') ? 'ar' : 'en';
            createOrUpdateSession($from, $lang, 'menu');
            $replyId = substr($replyId, 12);
        }

        if ($replyId === 'main_menu') {
            sendMainMenuIntermediate($from, $lang, true);
            return;
        }

        if ($replyId === 'menu_apply') {
            $link = "https://schooleverywhere-harvest.com/schooleverywhere/management/onlineadmission/applyonline/onlineadmission1.php";

            $msg = ($lang === 'en')
                ? "Thank you for your interest in Harvest International Schools. Please click the button below to apply:"
                : "شكراً لاهتمامكم بمدارس هارڤست الدولية. يرجى الضغط على الزر أدناه للتقديم:";
            $urlBtnTitle = ($lang === 'en') ? 'Apply Now' : 'تقدم الأن';

            sendCtaUrlButton($from, $msg, $urlBtnTitle, $link);

            $menuMsg = ($lang === 'en')
                ? "Return to navigation:"
                : "العودة للقائمة:";

            sendButtons($from, $menuMsg, [
                ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang]]
            ]);

            return;
        }

        if ($replyId === 'menu_contact') {
            sendContactMenuIntermediate($from, $lang);
            return;
        }

        if (strpos($replyId, 'contact_') === 0) {
            $deptId = substr($replyId, 8);
            $contacts = $config['contact_departments'];
            if (isset($contacts[$deptId])) {
                $dept = $contacts[$deptId];
                $deptName = $dept[$lang];
                $waLink = "https://wa.me/" . $dept['number'];
                $msg = ($lang === 'en')
                    ? "Please click on the button below to start a chat with *{$deptName}*:"
                    : "يرجى الضغط على الزر أدناه لبدء المحادثة مع *{$deptName}*:";
                $btnTitle = ($lang === 'en') ? 'Start Chat' : 'ابدأ المحادثة';
                sendCtaUrlButton($from, $msg, $btnTitle, $waLink);

                $menuMsg = ($lang === 'en')
                    ? "Return to navigation:"
                    : "العودة للقائمة:";

                sendButtons($from, $menuMsg, [
                    ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang] ]
                ]);
            }
            return;
        }

        if (strpos($replyId, 'menu_') === 0) {

            if (in_array($replyId, ['menu_disc', 'menu_accr'])) {
                $text = $config['static_content'][$replyId][$lang];
                sendFinalTextWithMenuButton($from, $text, $lang, $replyId);
                return;
            }

            if ($replyId === 'menu_careers') {
                $link = "https://harvestschools.com/vacancies";
                $msg = $config['static_content']['menu_careers'][$lang];
                $urlBtnTitle = ($lang === 'en') ? 'Apply' : 'تقدم';

                sendCtaUrlButton($from, $msg, $urlBtnTitle, $link);

                $menuMsg = ($lang === 'en')
                    ? "Return to navigation:"
                    : "العودة للقائمة:";

                sendButtons($from, $menuMsg, [
                    ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang]]
                ]);

                return;
            }

            if ($replyId === 'menu_address') {
                $addressText = $config['static_content']['menu_address'][$lang];
                $mapLink = "https://maps.app.goo.gl/4mWYs9jX5T2gK1FL7";
                $mapBtnTitle = ($lang === 'en') ? 'View on Map' : 'عرض على الخريطة';

                sendCtaUrlButton($from, $addressText, $mapBtnTitle, $mapLink);

                $menuMsg = ($lang === 'en')
                    ? "Return to navigation:"
                    : "العودة للقائمة:";

                sendButtons($from, $menuMsg, [
                    ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang]]
                ]);

                return;
            }

            if ($replyId === 'menu_faqs') {
                sendFaqMenuIntermediate($from, $lang);
                return;
            }

            if ($replyId === 'menu_info') {
                sendInfoMenuIntermediate($from, $lang);
                return;
            }

            if ($replyId === 'menu_fees') {
                sendFeesAndDiscountsMenuIntermediate($from, $lang);
                return;
            }

            if (in_array($replyId, ['menu_stages', 'menu_age', 'menu_reqs'])) {
                $action = str_replace('menu_', '', $replyId);
                sendDepartmentMenuIntermediate($from, $lang, $action);
                return;
            }
        }
        if (strpos($replyId, 'faq_') === 0) {
            $faq = $config['faqs'][$replyId] ?? null;
            if ($faq) {
                $text = "*" . $faq['q'][$lang] . "*\n\n" . $faq['a'][$lang];
                sendFinalTextWithMenuButton($from, $text, $lang, $replyId);
            }
            return;
        }

        if (strpos($replyId, 'act_') === 0) {
            $rest = substr($replyId, 4);
            $sep = strpos($rest, '_');

            if ($sep !== false) {
                $action = substr($rest, 0, $sep);
                $deptKey = substr($rest, $sep + 1);
                $dept = $config['departments'][$deptKey] ?? null;

                if ($dept && count($dept['sections']) === 1) {
                    $onlySecKey = array_key_first($dept['sections']);
                    sendStageMenuIntermediate($from, $lang, $action, $deptKey, $onlySecKey);
                    return;
                }

                sendSectionMenuIntermediate($from, $lang, $action, $deptKey);
                return;
            }
        }

        if (strpos($replyId, 'sec_') === 0) {
            $parts = explode('_', $replyId, 4);
            if (count($parts) == 4) {
                $action = $parts[1];
                $deptKey = $parts[2];
                $secKey = $parts[3];
                sendStageMenuIntermediate($from, $lang, $action, $deptKey, $secKey);
                return;
            }
        }

        if (strpos($replyId, 'res_') === 0) {
            $parts = explode('_', $replyId);
            array_shift($parts);
            $action = array_shift($parts);
            $stageId = implode('_', $parts);
            $stageData = findStageById($stageId);

            if ($stageData) {
                $stageName = $stageData['name'][$lang];
                $responseText = "";

                if ($stageData['offered']) {
                    if ($action === 'age') {
                        $ageStr = $stageData['age'][$lang];
                        $responseText = ($lang === 'en')
                            ? "*Minimum Registration Age for {$stageName}:* {$ageStr}\n\n{$config['static_content']['minimum_age_disc'][$lang]}"
                            : "*الحد الأدنى لسن القبول لمرحلة {$stageName}:* {$ageStr}\n\n{$config['static_content']['minimum_age_disc'][$lang]}";


                    } elseif ($action === 'fees') {
                        $currency = ($lang === 'en') ? "EGP" : "ج.م";
                        $feesStr = number_format($stageData['fees']);
                        $disclaimer = $config['static_content']['fees_disclaimer'][$lang];
                        $responseText = ($lang === 'en')
                            ? "*Annual Tuition Fees for {$stageName}:* {$feesStr} {$currency}"
                            : "*المصروفات الدراسية السنوية لمرحلة {$stageName}:* {$feesStr} {$currency}";
                        $responseText .= $disclaimer;
                    } elseif ($action === 'reqs') {
                        $responseText = getRequirementsForStage($stageId, $stageName, $lang);
                    } else {
                        $responseText = ($lang === 'en')
                            ? "*{$stageName}* is currently offered at Harvest Schools."
                            : "مرحلة *{$stageName}* متاحة حالياً للتسجيل في مدارس هارڤست.";
                    }

                } else {
                    $responseText = ($lang === 'en')
                        ? "Sorry, *{$stageName}* is currently NOT offered at Harvest Schools."
                        : "نعتذر، مرحلة *{$stageName}* غير متاحة حالياً في مدارس هارڤست.";
                }

                sendFinalTextWithMenuButton($from, $responseText, $lang, $replyId);
            }

            return;
        }

    }

    sendMainMenuIntermediate($from, $lang, true);
}
function askLanguageMode($to) {
    sendButtons($to, "Please choose your language.\nيرجى اختيار اللغة.", [
        ["id" => "lang_en", "title" => "English"],
        ["id" => "lang_ar", "title" => "العربية"]
    ]);
}

function getNavRows($lang, $currentMenuId) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    return [
        ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang]],
        ["id" => "menu_apply", "title" => $config['ui']['apply_btn'][$lang]],
        ["id" => "lang_toggle_" . $currentMenuId, "title" => $config['ui']['change_lang_btn'][$lang]]
    ];
}

function sendMainMenuIntermediate($to, $lang, $fallback) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $rows = [];

    foreach ($config['main_options'] as $opt) {
        $rows[] = ["id" => $opt['id'], "title" => $opt[$lang]];
    }

    $sections = [
        [
            "title" => $ui['main_title'][$lang],
            "rows" => $rows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => [
                ["id" => "lang_toggle_main_menu", "title" => $ui['change_lang_btn'][$lang]]
            ]
        ]
    ];

    if ($fallback === true) {
        sendList($to, $ui['main_body_fallback'][$lang], $ui['main_btn'][$lang], $sections);
    } else {
        sendList($to, $ui['main_body'][$lang], $ui['main_btn'][$lang], $sections);
    }
}

function sendFaqMenuIntermediate($to, $lang) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $rows = [];

    foreach ($config['faqs'] as $faqId => $faqData) {
        $rows[] = ["id" => $faqId, "title" => $faqData['q'][$lang]];
    }

    $sections = [
        [
            "title" => $ui['faq_title'][$lang],
            "rows" => $rows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, 'menu_faqs')
        ]
    ];

    sendList($to, $ui['faq_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendContactMenuIntermediate($to, $lang) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $rows = [];

    foreach ($config['contact_departments'] as $id => $dept) {
        $rows[] = ["id" => "contact_" . $id, "title" => $dept[$lang]];
    }

    $sections = [
        [
            "title" => $ui['contact_title'][$lang],
            "rows" => $rows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => [
                ["id" => "main_menu", "title" => $config['ui']['back_btn'][$lang]],
                ["id" => "lang_toggle_menu_contact", "title" => $config['ui']['change_lang_btn'][$lang]]
            ]
        ]
    ];

    sendList($to, $ui['contact_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendFeesAndDiscountsMenuIntermediate($to, $lang) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $deptRows = [];

    foreach ($config['departments'] as $deptKey => $deptData) {
        $deptRows[] = ["id" => "act_fees_{$deptKey}", "title" => $deptData['name'][$lang]];
    }

    $sections = [
        [
            "title" => $ui['dept_title'][$lang],
            "rows" => $deptRows
        ],
        [
            "title" => $ui['disc_section'][$lang],
            "rows" => [
                ["id" => "menu_disc", "title" => $ui['disc_item'][$lang]]
            ]
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, 'menu_fees')
        ]
    ];

    sendList($to, $ui['fees_disc_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendInfoMenuIntermediate($to, $lang) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $sections = [
        [
            "title" => $ui['info_title'][$lang],
            "rows" => [
                ["id" => "menu_faqs", "title" => $ui['faqs_item'][$lang]],
                ["id" => "menu_careers", "title" => $ui['careers_item'][$lang]],
            ]
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, 'menu_info')
        ]
    ];

    sendList($to, $ui['info_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendDepartmentMenuIntermediate($to, $lang, $action) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $deptRows = [];

    foreach ($config['departments'] as $deptKey => $deptData) {
        $id = "act_{$action}_{$deptKey}";
        $deptRows[] = ["id" => $id, "title" => $deptData['name'][$lang]];
    }

    $sections = [
        [
            "title" => $ui['dept_title'][$lang],
            "rows" => $deptRows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, "menu_{$action}")
        ]
    ];

    sendList($to, $ui['dept_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendSectionMenuIntermediate($to, $lang, $action, $deptKey) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $dept = $config['departments'][$deptKey] ?? null;
    if (!$dept) return;
    $secRows = [];

    foreach ($dept['sections'] as $secKey => $secData) {
        $id = "sec_{$action}_{$deptKey}_{$secKey}";
        $secRows[] = ["id" => $id, "title" => $secData['title'][$lang]];
    }

    $sections = [
        [
            "title" => $ui['sec_title'][$lang],
            "rows" => $secRows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, "act_{$action}_{$deptKey}")
        ]
    ];

    sendList($to, $ui['sec_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendStageMenuIntermediate($to, $lang, $action, $deptKey, $secKey) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];
    $stageData = $config['departments'][$deptKey]['sections'][$secKey] ?? null;
    if (!$stageData) return;
    $filterUnoffered = in_array($action, ['fees', 'reqs']);
    $rows = [];

    foreach ($stageData['stages'] as $stageId => $stage) {
        if ($filterUnoffered && !$stage['offered']) continue;
        $id = "res_{$action}_{$stageId}";
        $rows[] = ["id" => $id, "title" => $stage['name'][$lang]];
    }

    $bodyText = $ui['stage_body'][$lang];

    if ($filterUnoffered) {
        $bodyText .= "\n\n_" . $ui['unoffered_note'][$lang] . "_";
    }

    $sections = [
        [
            "title" => $stageData['title'][$lang],
            "rows" => $rows
        ],
        [
            "title" => $ui['nav_section'][$lang],
            "rows" => getNavRows($lang, "sec_{$action}_{$deptKey}_{$secKey}")
        ]
    ];

    sendList($to, $bodyText, $ui['main_btn'][$lang], $sections);
}

function sendFinalTextWithMenuButton($to, $text, $lang, $currentMenuId) {
    global $SCHOOL_CONFIG;
    $config = $SCHOOL_CONFIG;
    $ui = $config['ui'];

    sendButtons($to, $text, [
        ["id" => "main_menu", "title" => $ui['back_btn'][$lang]],
        ["id" => "menu_apply", "title" => $ui['apply_btn'][$lang]],
        ["id" => "lang_toggle_" . $currentMenuId, "title" => $ui['change_lang_btn'][$lang]]
    ]);

}