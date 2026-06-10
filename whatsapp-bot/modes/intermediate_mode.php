<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';

function getIntermediateData() {
    return [
        'menus' => [
            'en' => [
                'main_title' => 'Main Menu',
                'main_body' => 'Welcome to Harvest International Schools! Please choose a topic below:',
                'main_btn' => 'Options',
                'dept_title' => 'Choose Department',
                'dept_body' => 'Please select the educational department:',
                'stage_title' => 'Choose Stage/Grade',
                'stage_body' => 'Please select the grade group:',
                'back_to_main' => 'Reply "Menu" at any time to return to the main menu.',
            ],
            'ar' => [
                'main_title' => 'القائمة الرئيسية',
                'main_body' => 'مرحباً بكم في مدارس هارڤست الدولية! يرجى اختيار موضوع من القائمة:',
                'main_btn' => 'الخيارات',
                'dept_title' => 'اختر القسم',
                'dept_body' => 'يرجى اختيار القسم التعليمي:',
                'stage_title' => 'اختر المرحلة/الصف',
                'stage_body' => 'يرجى اختيار المجموعة الدراسية:',
                'back_to_main' => 'أرسل "القائمة" في أي وقت للعودة إلى القائمة الرئيسية.',
            ]
        ],
        'main_options' => [
            ['id' => 'menu_stages', 'en' => 'Stages Offered', 'ar' => 'المراحل المتاحة'],
            ['id' => 'menu_age', 'en' => 'Minimum Age', 'ar' => 'سن القبول'],
            ['id' => 'menu_reqs', 'en' => 'Admission Reqs', 'ar' => 'متطلبات التقديم'],
            ['id' => 'menu_fees', 'en' => 'Tuition Fees', 'ar' => 'المصروفات الدراسية'],
            ['id' => 'menu_disc', 'en' => 'Discounts', 'ar' => 'الخصومات'],
            ['id' => 'menu_accr', 'en' => 'Accreditations', 'ar' => 'الاعتمادات'],
            ['id' => 'menu_faqs', 'en' => 'FAQs', 'ar' => 'الأسئلة الشائعة'],
        ],
        'departments' => [
            ['id' => 'dept_kg', 'en' => 'Kindergarten (KG)', 'ar' => 'رياض الأطفال'],
            ['id' => 'dept_nat', 'en' => 'National', 'ar' => 'ناشونال'],
            ['id' => 'dept_brit', 'en' => 'British (IG)', 'ar' => 'القسم البريطاني'],
            ['id' => 'dept_am', 'en' => 'American', 'ar' => 'القسم الأمريكي'],
        ],
        'stages' => [
            'dept_kg' => [
                ['id' => 'stg_kg_early', 'en' => 'Pre-Play & Play', 'ar' => 'Pre-Play & Play'],
                ['id' => 'stg_kg_kg', 'en' => 'KG1 & KG2', 'ar' => 'KG1 & KG2'],
                ['id' => 'stg_kg_fs', 'en' => 'FS1 (British)', 'ar' => 'FS1 (British)'],
                ['id' => 'stg_kg_prek', 'en' => 'Pre-K & K (American)', 'ar' => 'Pre-K & K'],
            ],
            'dept_nat' => [
                ['id' => 'stg_nat_jr', 'en' => 'Junior 2 - Junior 6', 'ar' => 'Junior 2 - 6'],
                ['id' => 'stg_nat_mid', 'en' => 'Middle 1 - Middle 3', 'ar' => 'Middle 1 - 3'],
                ['id' => 'stg_nat_sr', 'en' => 'Senior 1 - Senior 3', 'ar' => 'Senior 1 - 3'],
            ],
            'dept_brit' => [
                ['id' => 'stg_brit_prim', 'en' => 'Year 2 - Year 6', 'ar' => 'Year 2 - 6'],
                ['id' => 'stg_brit_low', 'en' => 'Year 8 - Year 9', 'ar' => 'Year 8 - 9'],
                ['id' => 'stg_brit_up', 'en' => 'Year 10 - Year 12', 'ar' => 'Year 10 - 12'],
            ],
            'dept_am' => [
                ['id' => 'stg_am_elem1', 'en' => 'Grade 1 - Grade 4', 'ar' => 'Grade 1 - 4'],
                ['id' => 'stg_am_elem2', 'en' => 'Grade 5 - Grade 8', 'ar' => 'Grade 5 - 8'],
                ['id' => 'stg_am_high', 'en' => 'Grade 9 - Grade 12', 'ar' => 'Grade 9 - 12'],
            ]
        ],
        'static_content' => [
            'menu_reqs' => [
                'en' => "*Admission Requirements:*\n\n• Original Birth Certificate\n• 6 Recent Photos\n• Father and Mother ID copies\n• Updated Immunization Record\n• Medical Certificate (Health Insurance) - KG1 only\n• Previous School Report - KG2 through Senior 3",
                'ar' => "*متطلبات التقديم:*\n\n• أصل شهادة الميلاد\n• 6 صور شخصية حديثة\n• صور بطاقة الرقم القومي للأب والأم\n• سجل التطعيمات محدث\n• شهادة طبية (التأمين الصحي) - KG1 فقط\n• بيان نجاح / شهادة من المدرسة السابقة - من KG2 حتى Senior 3"
            ],
            'menu_disc' => [
                'en' => "*Discounts:*\n\n• *Siblings Discount:* 10% off tuition fees\n• *Staff Discount:* 40% off tuition fees\n\n_For combined discount cases, please confirm directly with our Accounting department to get an accurate quote._",
                'ar' => "*الخصومات:*\n\n• *خصم الأخوة:* 10% من المصروفات الدراسية\n• *خصم العاملين:* 40% من المصروفات الدراسية\n\n_في حالات الخصومات المجمعة، يرجى مراجعة قسم الحسابات مباشرة للحصول على التأكيد الدقيق._"
            ],
            'menu_accr' => [
                'en' => "*Accreditations:*\n\n• *National Dept:* Accredited by the Egyptian Ministry of Education\n• *British Dept:* Accredited by Cambridge / Pearson Edexcel / Oxford\n• *American Dept:* Accredited by Cognia",
                'ar' => "*الاعتمادات:*\n\n• *القسم القومي:* معتمد من وزارة التربية والتعليم المصرية\n• *القسم البريطاني:* معتمد من Cambridge / Pearson Edexcel / Oxford\n• *القسم الأمريكي:* معتمد من Cognia"
            ],
            'menu_faqs' => [
                'en' => "*Frequently Asked Questions:*\n\n*Q: Is the school mixed?*\nA: Yes.\n\n*Q: Does the school accept transfers?*\nA: Yes, as long as they pass the entry test.\n\n*Q: Do fees change every year?*\nA: Only increases applied by the Ministry of Education (up to 10%).\n\n*Q: Are there foreign teachers?*\nA: Teachers are mostly Egyptian and highly qualified.\n\n*Q: Is there transportation?*\nA: Yes, school buses cover every district in Alexandria.\n\n*Q: Are there sports activities?*\nA: Yes, all kinds of sports throughout the year.",
                'ar' => "*الأسئلة الشائعة:*\n\n*س: هل المدرسة مختلطة؟*\nج: نعم.\n\n*س: هل تقبل المدرسة التحويلات؟*\nج: نعم، بشرط اجتياز اختبار القبول بالمدرسة.\n\n*س: هل تتغير المصروفات سنوياً؟*\nج: تطبق فقط الزيادات المقررة من وزارة التربية والتعليم (حتى 10%).\n\n*س: هل يوجد مدرسين أجانب؟*\nج: المدرسون في الغالب مصريون ذوو كفاءة عالية.\n\n*س: هل يوجد باصات للمدرسة؟*\nج: نعم، تغطي الباصات جميع مناطق الإسكندرية.\n\n*س: هل توجد أنشطة رياضية؟*\nج: نعم، توفر المدرسة جميع أنواع الأنشطة الرياضية على مدار العام."
            ],
            'fees_disclaimer' => [
                'en' => "\n\n_Note: Tuition does NOT include uniforms, books, transportation, or activities. You may also be eligible for siblings/staff discounts. Please check with Accounting for specifics._",
                'ar' => "\n\n_ملاحظة: المصروفات لا تشمل الزي المدرسي، الكتب، الباص، أو الأنشطة. قد تكون مؤهلاً لخصومات الأخوة أو العاملين. يرجى مراجعة قسم الحسابات للتفاصيل._"
            ]
        ],
        'data' => [
            'stg_kg_early' => [
                'en' => ['stages' => "• Pre-Playgroup\n• Playgroup", 'age' => "• Pre-Playgroup: 2 yrs 4 mos\n• Playgroup: 2 yrs 6 mos", 'fees' => "• Pre-Playgroup: 24,150 EGP\n• Playgroup: 28,750 EGP"],
                'ar' => ['stages' => "• Pre-Playgroup\n• Playgroup", 'age' => "• Pre-Playgroup: سنتان و 4 شهور\n• Playgroup: سنتان و 6 شهور", 'fees' => "• Pre-Playgroup: 24,150 ج.م\n• Playgroup: 28,750 ج.م"],
            ],
            'stg_kg_kg' => [
                'en' => ['stages' => "• KG1\n• KG2", 'age' => "• KG1: 4 yrs\n• KG2: 5 yrs", 'fees' => "• KG1: 35,000 EGP\n• KG2: 35,000 EGP"],
                'ar' => ['stages' => "• KG1\n• KG2", 'age' => "• KG1: 4 سنوات\n• KG2: 5 سنوات", 'fees' => "• KG1: 35,000 ج.م\n• KG2: 35,000 ج.م"],
            ],
            'stg_kg_fs' => [
                'en' => ['stages' => "• Foundation Stage 1 (FS1)\n_(Note: FS2 not available)_", 'age' => "• FS1: 3 yrs 6 mos", 'fees' => "• FS1: 52,900 EGP"],
                'ar' => ['stages' => "• Foundation Stage 1 (FS1)\n_(ملاحظة: FS2 غير متاح)_", 'age' => "• FS1: 3 سنوات و 6 شهور", 'fees' => "• FS1: 52,900 ج.م"],
            ],
            'stg_kg_prek' => [
                'en' => ['stages' => "• Pre-Kindergarten (Pre-K)\n• Kindergarten (K)", 'age' => "• Pre-K: 3 yrs 6 mos\n• K: 4 yrs 6 mos", 'fees' => "• Pre-K: 55,200 EGP\n• K: 47,500 EGP"],
                'ar' => ['stages' => "• Pre-Kindergarten (Pre-K)\n• Kindergarten (K)", 'age' => "• Pre-K: 3 سنوات و 6 شهور\n• K: 4 سنوات و 6 شهور", 'fees' => "• Pre-K: 55,200 ج.م\n• K: 47,500 ج.م"],
            ],
            'stg_nat_jr' => [
                'en' => ['stages' => "• Junior 2 to Junior 6\n_(Note: Jr.1 not available)_", 'age' => "• Jr.2: 7 yrs\n• Jr.3: 8 yrs\n• Jr.4: 9 yrs\n• Jr.5: 10 yrs\n• Jr.6: 11 yrs", 'fees' => "• Jr.2 to Jr.3: 32,490 EGP/yr\n• Jr.4 to Jr.6: 34,490 EGP/yr"],
                'ar' => ['stages' => "• Junior 2 إلى Junior 6\n_(ملاحظة: Jr.1 غير متاح)_", 'age' => "• Jr.2: 7 سنوات\n• Jr.3: 8 سنوات\n• Jr.4: 9 سنوات\n• Jr.5: 10 سنوات\n• Jr.6: 11 سنة", 'fees' => "• Jr.2 إلى Jr.3: 32,490 ج.م/سنة\n• Jr.4 إلى Jr.6: 34,490 ج.م/سنة"],
            ],
            'stg_nat_mid' => [
                'en' => ['stages' => "• Middle 1 to Middle 3", 'age' => "• M.1: 12 yrs\n• M.2: 13 yrs\n• M.3: 14 yrs", 'fees' => "• M.1 to M.3: 36,490 EGP/yr"],
                'ar' => ['stages' => "• Middle 1 إلى Middle 3", 'age' => "• M.1: 12 سنة\n• M.2: 13 سنة\n• M.3: 14 سنة", 'fees' => "• M.1 إلى M.3: 36,490 ج.م/سنة"],
            ],
            'stg_nat_sr' => [
                'en' => ['stages' => "• Senior 1 to Senior 3", 'age' => "• Sr.1: 15 yrs\n• Sr.2: 16 yrs\n• Sr.3: 17 yrs", 'fees' => "• Sr.1 to Sr.3: 35,000 EGP/yr"],
                'ar' => ['stages' => "• Senior 1 إلى Senior 3", 'age' => "• Sr.1: 15 سنة\n• Sr.2: 16 سنة\n• Sr.3: 17 سنة", 'fees' => "• Sr.1 إلى Sr.3: 35,000 ج.م/سنة"],
            ],
            'stg_brit_prim' => [
                'en' => ['stages' => "• Year 2\n• Year 4 to Year 6\n_(Note: Yr.1, Yr.3 not available)_", 'age' => "• Yr.2: 6y 6m\n• Yr.4: 8y 6m\n• Yr.5: 9y 6m\n• Yr.6: 10y 6m", 'fees' => "• Yr.2: 68,310 EGP\n• Yr.4 to Yr.6: 72,680 EGP/yr"],
                'ar' => ['stages' => "• Year 2\n• Year 4 إلى Year 6\n_(ملاحظة: Yr.1, Yr.3 غير متاح)_", 'age' => "• Yr.2: 6 سنوات و 6 ش\n• Yr.4: 8 سنوات و 6 ش\n• Yr.5: 9 سنوات و 6 ش\n• Yr.6: 10 سنوات و 6 ش", 'fees' => "• Yr.2: 68,310 ج.م\n• Yr.4 إلى Yr.6: 72,680 ج.م/سنة"],
            ],
            'stg_brit_low' => [
                'en' => ['stages' => "• Year 8 to Year 9\n_(Note: Yr.7 not available)_", 'age' => "• Yr.8: 12y 6m\n• Yr.9: 13y 6m", 'fees' => "• Yr.8 to Yr.9: 78,315 EGP/yr"],
                'ar' => ['stages' => "• Year 8 إلى Year 9\n_(ملاحظة: Yr.7 غير متاح)_", 'age' => "• Yr.8: 12 سنة و 6 ش\n• Yr.9: 13 سنة و 6 ش", 'fees' => "• Yr.8 إلى Yr.9: 78,315 ج.م/سنة"],
            ],
            'stg_brit_up' => [
                'en' => ['stages' => "• Year 10 to Year 12", 'age' => "• Yr.10: 14y 6m\n• Yr.11: 15y 6m\n• Yr.12: 16y 6m", 'fees' => "• Yr.10: 86,825 EGP\n• Yr.11: 45,425 EGP\n• Yr.12: 37,145 EGP"],
                'ar' => ['stages' => "• Year 10 إلى Year 12", 'age' => "• Yr.10: 14 سنة و 6 ش\n• Yr.11: 15 سنة و 6 ش\n• Yr.12: 16 سنة و 6 ش", 'fees' => "• Yr.10: 86,825 ج.م\n• Yr.11: 45,425 ج.م\n• Yr.12: 37,145 ج.م"],
            ],
            'stg_am_elem1' => [
                'en' => ['stages' => "• Grade 1 to Grade 4", 'age' => "• Gr.1: 5y 6m\n• Gr.2: 6y 6m\n• Gr.3: 7y 6m\n• Gr.4: 8y 6m", 'fees' => "• Gr.1: 72,680 EGP\n• Gr.2: 73,600 EGP\n• Gr.3: 75,210 EGP\n• Gr.4: 77,165 EGP"],
                'ar' => ['stages' => "• Grade 1 إلى Grade 4", 'age' => "• Gr.1: 5 سنوات و 6 ش\n• Gr.2: 6 سنوات و 6 ش\n• Gr.3: 7 سنوات و 6 ش\n• Gr.4: 8 سنوات و 6 ش", 'fees' => "• Gr.1: 72,680 ج.م\n• Gr.2: 73,600 ج.م\n• Gr.3: 75,210 ج.م\n• Gr.4: 77,165 ج.م"],
            ],
            'stg_am_elem2' => [
                'en' => ['stages' => "• Grade 5 to Grade 8", 'age' => "• Gr.5: 9y 6m\n• Gr.6: 10y 6m\n• Gr.7: 11y 6m\n• Gr.8: 12y 6m", 'fees' => "• Gr.5 to Gr.6: 78,515 EGP/yr\n• Gr.7 to Gr.8: 82,100 EGP/yr"],
                'ar' => ['stages' => "• Grade 5 إلى Grade 8", 'age' => "• Gr.5: 9 سنوات و 6 ش\n• Gr.6: 10 سنوات و 6 ش\n• Gr.7: 11 سنة و 6 ش\n• Gr.8: 12 سنة و 6 ش", 'fees' => "• Gr.5 إلى Gr.6: 78,515 ج.م/سنة\n• Gr.7 إلى Gr.8: 82,100 ج.م/سنة"],
            ],
            'stg_am_high' => [
                'en' => ['stages' => "• Grade 9 to Grade 12", 'age' => "• Gr.9: 13y 6m\n• Gr.10: 14y 6m\n• Gr.11: 15y 6m\n• Gr.12: 16y 6m", 'fees' => "• Gr.9: 82,100 EGP\n• Gr.10: 91,770 EGP\n• Gr.11: 93,495 EGP\n• Gr.12: 95,105 EGP"],
                'ar' => ['stages' => "• Grade 9 إلى Grade 12", 'age' => "• Gr.9: 13 سنة و 6 ش\n• Gr.10: 14 سنة و 6 ش\n• Gr.11: 15 سنة و 6 ش\n• Gr.12: 16 سنة و 6 ش", 'fees' => "• Gr.9: 82,100 ج.م\n• Gr.10: 91,770 ج.م\n• Gr.11: 93,495 ج.م\n• Gr.12: 95,105 ج.م"],
            ],
        ]
    ];
}

function handleIntermediateMode($from, $message) {
    $session = getSession($from);
    $type = $message['type'] ?? '';

    if ($type === 'text') {
        $textBody = strtolower(trim($message['text']['body'] ?? ''));
        if (in_array($textBody, ['menu', 'القائمة', 'main menu'])) {
            if ($session && $session['language']) {
                sendMainMenu($from, $session['language']);
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
                sendMainMenu($from, $lang);
                return;
            }
        }
        askLanguageMode($from);
        return;
    }

    $lang = $session['language'];
    $data = getIntermediateData();

    if ($type === 'interactive') {
        $replyId = $message['interactive']['list_reply']['id'] ?? $message['interactive']['button_reply']['id'] ?? '';

        if (strpos($replyId, 'menu_') === 0) {
            // Direct text responses
            if (in_array($replyId, ['menu_reqs', 'menu_disc', 'menu_accr', 'menu_faqs'])) {
                $text = $data['static_content'][$replyId][$lang] . "\n\n_" . $data['menus'][$lang]['back_to_main'] . "_";
                sendText($from, $text);
                return;
            }

            if (in_array($replyId, ['menu_stages', 'menu_age', 'menu_fees'])) {
                $action = str_replace('menu_', '', $replyId); // stages, age, fees
                sendDepartmentMenuIntermediate($from, $lang, $action);
                return;
            }
        }

        if (strpos($replyId, 'act_') === 0) {
            $parts = explode('_', $replyId);
            if (count($parts) == 4) {
                $action = $parts[1];
                $deptKey = $parts[2] . '_' . $parts[3]; // e.g. dept_am
                sendStageMenuIntermediate($from, $lang, $action, $deptKey);
                return;
            }
        }

        if (strpos($replyId, 'res_') === 0) {
            $parts = explode('_', $replyId);
            $action = $parts[1];
            $stageKey = str_replace("res_{$action}_", '', $replyId);

            $resultData = $data['data'][$stageKey][$lang][$action] ?? '';

            if ($resultData) {
                $responseText = "*Harvest International Schools*\n\n" . $resultData;
                if ($action === 'fees') {
                    $responseText .= $data['static_content']['fees_disclaimer'][$lang];
                }
                $responseText .= "\n\n_" . $data['menus'][$lang]['back_to_main'] . "_";
                sendText($from, $responseText);
            }
            return;
        }
    }

    sendMainMenu($from, $lang);
}

function askLanguageMode($to) {
    sendButtons($to, "Please choose your language / يرجى اختيار اللغة", [
        ["id" => "lang_en", "title" => "English"],
        ["id" => "lang_ar", "title" => "العربية"]
    ]);
}

function sendMainMenu($to, $lang) {
    $data = getIntermediateData();
    $ui = $data['menus'][$lang];
    $options = $data['main_options'];

    $rows = [];
    foreach ($options as $opt) {
        $rows[] = ["id" => $opt['id'], "title" => mb_substr($opt[$lang], 0, 24)];
    }

    sendList($to, $ui['main_body'], $ui['main_btn'], [[
        "title" => mb_substr($ui['main_title'], 0, 24),
        "rows" => $rows
    ]]);
}

function sendDepartmentMenuIntermediate($to, $lang, $action) {
    $data = getIntermediateData();
    $ui = $data['menus'][$lang];
    $depts = $data['departments'];

    $rows = [];
    foreach ($depts as $dept) {
        $id = "act_" . $action . "_" . $dept['id'];
        $rows[] = ["id" => $id, "title" => mb_substr($dept[$lang], 0, 24)];
    }

    sendList($to, $ui['dept_body'], $ui['main_btn'], [[
        "title" => mb_substr($ui['dept_title'], 0, 24),
        "rows" => $rows
    ]]);
}

function sendStageMenuIntermediate($to, $lang, $action, $deptKey) {
    $data = getIntermediateData();
    $ui = $data['menus'][$lang];
    $stages = $data['stages'][$deptKey] ?? [];

    $rows = [];
    foreach ($stages as $stage) {
        $id = "res_" . $action . "_" . $stage['id'];
        $rows[] = ["id" => $id, "title" => mb_substr($stage[$lang], 0, 24)];
    }

    if (empty($rows)) {
        sendText($to, "No stages found. / لا توجد مراحل متاحة.");
        return;
    }

    sendList($to, $ui['stage_body'], $ui['main_btn'], [[
        "title" => mb_substr($ui['stage_title'], 0, 24),
        "rows" => $rows
    ]]);
}
