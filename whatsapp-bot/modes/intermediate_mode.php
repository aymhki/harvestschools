<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';

/**
 * ========================================================================
 * SINGLE SOURCE OF TRUTH CONFIGURATION
 * Edit fees, ages, availability, and names here. The bot will automatically
 * update all localized menus and responses.
 * ========================================================================
 */
function getSchoolConfig() {
    return [
        'ui' => [
            'main_title' => ['en' => 'Main Menu', 'ar' => 'القائمة الرئيسية'],
            'main_body' => ['en' => 'Welcome to Harvest International Schools! Please choose a topic below:', 'ar' => 'مرحباً بكم في مدارس هارڤست الدولية! يرجى اختيار موضوع من القائمة:'],
            'main_btn' => ['en' => 'Options', 'ar' => 'الخيارات'],
            'dept_title' => ['en' => 'Choose Department', 'ar' => 'اختر القسم'],
            'dept_body' => ['en' => 'Please select the educational department:', 'ar' => 'يرجى اختيار القسم التعليمي:'],
            'stage_title' => ['en' => 'Choose Stage/Grade', 'ar' => 'اختر المرحلة/الصف'],
            'stage_body' => ['en' => 'Please select the grade:', 'ar' => 'يرجى اختيار الصف الدراسي:'],
            'back_btn' => ['en' => '🔙 Main Menu', 'ar' => '🔙 القائمة الرئيسية'],
            'nav_section' => ['en' => 'Navigation', 'ar' => 'التنقل'],
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
        // =========================================================
        // DEPARTMENTS & STAGES DATA
        // Edit offered status, age, and tuition directly below.
        // Sections group items properly for WhatsApp's 10-item limit.
        // =========================================================
        'departments' => [
            'early' => [
                'name' => ['en' => 'Early Years', 'ar' => 'مرحلة ما قبل المدرسة'],
                'sections' => [
                    'early_stg' => [
                        'title' => ['en' => 'Pre-Play & Play', 'ar' => 'Pre-Play & Play'],
                        'stages' => [
                            'stg_pre_play' => ['name' => ['en' => 'Pre-Playgroup', 'ar' => 'Pre-Playgroup'], 'offered' => true, 'age' => ['en' => '2 years and 4 months', 'ar' => 'سنتان و 4 شهور'], 'fees' => 24150],
                            'stg_play' => ['name' => ['en' => 'Playgroup', 'ar' => 'Playgroup'], 'offered' => true, 'age' => ['en' => '2 years and 6 months', 'ar' => 'سنتان و 6 شهور'], 'fees' => 28750],
                        ]
                    ]
                ]
            ],
            'national' => [
                'name' => ['en' => 'National', 'ar' => 'القسم القومي'],
                'sections' => [
                    'nat_kg' => [
                        'title' => ['en' => 'Kindergarten', 'ar' => 'رياض الأطفال'],
                        'stages' => [
                            'stg_nat_kg1' => ['name' => ['en' => 'KG 1', 'ar' => 'كي جي 1'], 'offered' => true, 'age' => ['en' => '4 years', 'ar' => '4 سنوات'], 'fees' => 35000],
                            'stg_nat_kg2' => ['name' => ['en' => 'KG 2', 'ar' => 'كي جي 2'], 'offered' => true, 'age' => ['en' => '5 years', 'ar' => '5 سنوات'], 'fees' => 35000],
                        ]
                    ],
                    'nat_jr' => [
                        'title' => ['en' => 'Primary (Junior)', 'ar' => 'الابتدائي (Junior)'],
                        'stages' => [
                            'stg_nat_jr1' => ['name' => ['en' => 'Junior 1', 'ar' => 'الصف الأول الابتدائي'], 'offered' => false, 'age' => ['en' => '6 years', 'ar' => '6 سنوات'], 'fees' => 32490],
                            'stg_nat_jr2' => ['name' => ['en' => 'Junior 2', 'ar' => 'الصف الثاني الابتدائي'], 'offered' => true, 'age' => ['en' => '7 years', 'ar' => '7 سنوات'], 'fees' => 32490],
                            'stg_nat_jr3' => ['name' => ['en' => 'Junior 3', 'ar' => 'الصف الثالث الابتدائي'], 'offered' => true, 'age' => ['en' => '8 years', 'ar' => '8 سنوات'], 'fees' => 32490],
                            'stg_nat_jr4' => ['name' => ['en' => 'Junior 4', 'ar' => 'الصف الرابع الابتدائي'], 'offered' => true, 'age' => ['en' => '9 years', 'ar' => '9 سنوات'], 'fees' => 34490],
                            'stg_nat_jr5' => ['name' => ['en' => 'Junior 5', 'ar' => 'الصف الخامس الابتدائي'], 'offered' => true, 'age' => ['en' => '10 years', 'ar' => '10 سنوات'], 'fees' => 34490],
                            'stg_nat_jr6' => ['name' => ['en' => 'Junior 6', 'ar' => 'الصف السادس الابتدائي'], 'offered' => true, 'age' => ['en' => '11 years', 'ar' => '11 سنوات'], 'fees' => 34490],
                        ]
                    ],
                    'nat_mid' => [
                        'title' => ['en' => 'Preparatory (Middle)', 'ar' => 'الإعدادي (Middle)'],
                        'stages' => [
                            'stg_nat_m1' => ['name' => ['en' => 'Middle 1', 'ar' => 'الصف الأول الإعدادي'], 'offered' => true, 'age' => ['en' => '12 years', 'ar' => '12 سنة'], 'fees' => 36490],
                            'stg_nat_m2' => ['name' => ['en' => 'Middle 2', 'ar' => 'الصف الثاني الإعدادي'], 'offered' => true, 'age' => ['en' => '13 years', 'ar' => '13 سنة'], 'fees' => 36490],
                            'stg_nat_m3' => ['name' => ['en' => 'Middle 3', 'ar' => 'الصف الثالث الإعدادي'], 'offered' => true, 'age' => ['en' => '14 years', 'ar' => '14 سنة'], 'fees' => 36490],
                        ]
                    ],
                    'nat_sr' => [
                        'title' => ['en' => 'Secondary (Senior)', 'ar' => 'الثانوي (Senior)'],
                        'stages' => [
                            'stg_nat_sr1' => ['name' => ['en' => 'Senior 1', 'ar' => 'الصف الأول الثانوي'], 'offered' => true, 'age' => ['en' => '15 years', 'ar' => '15 سنة'], 'fees' => 35000],
                            'stg_nat_sr2' => ['name' => ['en' => 'Senior 2', 'ar' => 'الصف الثاني الثانوي'], 'offered' => true, 'age' => ['en' => '16 years', 'ar' => '16 سنة'], 'fees' => 35000],
                            'stg_nat_sr3' => ['name' => ['en' => 'Senior 3', 'ar' => 'الصف الثالث الثانوي'], 'offered' => true, 'age' => ['en' => '17 years', 'ar' => '17 سنة'], 'fees' => 35000],
                        ]
                    ]
                ]
            ],
            'british' => [
                'name' => ['en' => 'British (IG)', 'ar' => 'القسم البريطاني'],
                'sections' => [
                    'brit_fs' => [
                        'title' => ['en' => 'Foundation Stage', 'ar' => 'Foundation Stage'],
                        'stages' => [
                            'stg_brit_fs1' => ['name' => ['en' => 'FS 1', 'ar' => 'FS 1'], 'offered' => true, 'age' => ['en' => '3 years and 6 months', 'ar' => '3 سنوات و 6 شهور'], 'fees' => 52900],
                            'stg_brit_fs2' => ['name' => ['en' => 'FS 2', 'ar' => 'FS 2'], 'offered' => false, 'age' => ['en' => '4 years and 6 months', 'ar' => '4 سنوات و 6 شهور'], 'fees' => 55200],
                        ]
                    ],
                    'brit_prim' => [
                        'title' => ['en' => 'Primary (Years 1-6)', 'ar' => 'الابتدائي (Years 1-6)'],
                        'stages' => [
                            'stg_brit_y1' => ['name' => ['en' => 'Year 1', 'ar' => 'Year 1'], 'offered' => false, 'age' => ['en' => '5 years and 6 months', 'ar' => '5 سنوات و 6 شهور'], 'fees' => 68310],
                            'stg_brit_y2' => ['name' => ['en' => 'Year 2', 'ar' => 'Year 2'], 'offered' => true, 'age' => ['en' => '6 years and 6 months', 'ar' => '6 سنوات و 6 شهور'], 'fees' => 68310],
                            'stg_brit_y3' => ['name' => ['en' => 'Year 3', 'ar' => 'Year 3'], 'offered' => false, 'age' => ['en' => '7 years and 6 months', 'ar' => '7 سنوات و 6 شهور'], 'fees' => 68310],
                            'stg_brit_y4' => ['name' => ['en' => 'Year 4', 'ar' => 'Year 4'], 'offered' => true, 'age' => ['en' => '8 years and 6 months', 'ar' => '8 سنوات و 6 شهور'], 'fees' => 72680],
                            'stg_brit_y5' => ['name' => ['en' => 'Year 5', 'ar' => 'Year 5'], 'offered' => true, 'age' => ['en' => '9 years and 6 months', 'ar' => '9 سنوات و 6 شهور'], 'fees' => 72680],
                            'stg_brit_y6' => ['name' => ['en' => 'Year 6', 'ar' => 'Year 6'], 'offered' => true, 'age' => ['en' => '10 years and 6 months', 'ar' => '10 سنوات و 6 شهور'], 'fees' => 72680],
                        ]
                    ],
                    'brit_sec' => [
                        'title' => ['en' => 'Secondary (Years 7-12)', 'ar' => 'الثانوي (Years 7-12)'],
                        'stages' => [
                            'stg_brit_y7' => ['name' => ['en' => 'Year 7', 'ar' => 'Year 7'], 'offered' => false, 'age' => ['en' => '11 years and 6 months', 'ar' => '11 سنة و 6 شهور'], 'fees' => 78315],
                            'stg_brit_y8' => ['name' => ['en' => 'Year 8', 'ar' => 'Year 8'], 'offered' => true, 'age' => ['en' => '12 years and 6 months', 'ar' => '12 سنة و 6 شهور'], 'fees' => 78315],
                            'stg_brit_y9' => ['name' => ['en' => 'Year 9', 'ar' => 'Year 9'], 'offered' => true, 'age' => ['en' => '13 years and 6 months', 'ar' => '13 سنة و 6 شهور'], 'fees' => 78315],
                            'stg_brit_y10' => ['name' => ['en' => 'Year 10', 'ar' => 'Year 10'], 'offered' => true, 'age' => ['en' => '14 years and 6 months', 'ar' => '14 سنة و 6 شهور'], 'fees' => 86825],
                            'stg_brit_y11' => ['name' => ['en' => 'Year 11', 'ar' => 'Year 11'], 'offered' => true, 'age' => ['en' => '15 years and 6 months', 'ar' => '15 سنة و 6 شهور'], 'fees' => 45425],
                            'stg_brit_y12' => ['name' => ['en' => 'Year 12', 'ar' => 'Year 12'], 'offered' => true, 'age' => ['en' => '16 years and 6 months', 'ar' => '16 سنة و 6 شهور'], 'fees' => 37145],
                        ]
                    ]
                ]
            ],
            'american' => [
                'name' => ['en' => 'American', 'ar' => 'القسم الأمريكي'],
                'sections' => [
                    'am_kg' => [
                        'title' => ['en' => 'Kindergarten', 'ar' => 'رياض الأطفال'],
                        'stages' => [
                            'stg_am_prek' => ['name' => ['en' => 'Pre-K', 'ar' => 'Pre-K'], 'offered' => true, 'age' => ['en' => '3 years and 6 months', 'ar' => '3 سنوات و 6 شهور'], 'fees' => 55200],
                            'stg_am_k' => ['name' => ['en' => 'Kindergarten (K)', 'ar' => 'Kindergarten (K)'], 'offered' => true, 'age' => ['en' => '4 years and 6 months', 'ar' => '4 سنوات و 6 شهور'], 'fees' => 47500],
                        ]
                    ],
                    'am_elem' => [
                        'title' => ['en' => 'Elementary (Grades 1-5)', 'ar' => 'الابتدائي (Grades 1-5)'],
                        'stages' => [
                            'stg_am_g1' => ['name' => ['en' => 'Grade 1', 'ar' => 'Grade 1'], 'offered' => true, 'age' => ['en' => '5 years and 6 months', 'ar' => '5 سنوات و 6 شهور'], 'fees' => 72680],
                            'stg_am_g2' => ['name' => ['en' => 'Grade 2', 'ar' => 'Grade 2'], 'offered' => true, 'age' => ['en' => '6 years and 6 months', 'ar' => '6 سنوات و 6 شهور'], 'fees' => 73600],
                            'stg_am_g3' => ['name' => ['en' => 'Grade 3', 'ar' => 'Grade 3'], 'offered' => true, 'age' => ['en' => '7 years and 6 months', 'ar' => '7 سنوات و 6 شهور'], 'fees' => 75210],
                            'stg_am_g4' => ['name' => ['en' => 'Grade 4', 'ar' => 'Grade 4'], 'offered' => true, 'age' => ['en' => '8 years and 6 months', 'ar' => '8 سنوات و 6 شهور'], 'fees' => 77165],
                            'stg_am_g5' => ['name' => ['en' => 'Grade 5', 'ar' => 'Grade 5'], 'offered' => true, 'age' => ['en' => '9 years and 6 months', 'ar' => '9 سنوات و 6 شهور'], 'fees' => 78515],
                        ]
                    ],
                    'am_mid' => [
                        'title' => ['en' => 'Middle (Grades 6-8)', 'ar' => 'الإعدادي (Grades 6-8)'],
                        'stages' => [
                            'stg_am_g6' => ['name' => ['en' => 'Grade 6', 'ar' => 'Grade 6'], 'offered' => true, 'age' => ['en' => '10 years and 6 months', 'ar' => '10 سنوات و 6 شهور'], 'fees' => 78515],
                            'stg_am_g7' => ['name' => ['en' => 'Grade 7', 'ar' => 'Grade 7'], 'offered' => true, 'age' => ['en' => '11 years and 6 months', 'ar' => '11 سنة و 6 شهور'], 'fees' => 82100],
                            'stg_am_g8' => ['name' => ['en' => 'Grade 8', 'ar' => 'Grade 8'], 'offered' => true, 'age' => ['en' => '12 years and 6 months', 'ar' => '12 سنة و 6 شهور'], 'fees' => 82100],
                        ]
                    ],
                    'am_high' => [
                        'title' => ['en' => 'High School (Grades 9-12)', 'ar' => 'الثانوي (Grades 9-12)'],
                        'stages' => [
                            'stg_am_g9' => ['name' => ['en' => 'Grade 9', 'ar' => 'Grade 9'], 'offered' => true, 'age' => ['en' => '13 years and 6 months', 'ar' => '13 سنة و 6 شهور'], 'fees' => 82100],
                            'stg_am_g10' => ['name' => ['en' => 'Grade 10', 'ar' => 'Grade 10'], 'offered' => true, 'age' => ['en' => '14 years and 6 months', 'ar' => '14 سنة و 6 شهور'], 'fees' => 91770],
                            'stg_am_g11' => ['name' => ['en' => 'Grade 11', 'ar' => 'Grade 11'], 'offered' => true, 'age' => ['en' => '15 years and 6 months', 'ar' => '15 سنة و 6 شهور'], 'fees' => 93495],
                            'stg_am_g12' => ['name' => ['en' => 'Grade 12', 'ar' => 'Grade 12'], 'offered' => true, 'age' => ['en' => '16 years and 6 months', 'ar' => '16 سنة و 6 شهور'], 'fees' => 95105],
                        ]
                    ]
                ]
            ],
        ]
    ];
}

function findStageById($stageId) {
    $config = getSchoolConfig();
    foreach ($config['departments'] as $deptKey => $dept) {
        foreach ($dept['sections'] as $secKey => $section) {
            if (isset($section['stages'][$stageId])) {
                return $section['stages'][$stageId];
            }
        }
    }
    return null;
}

function handleIntermediateMode($from, $message) {
    $session = getSession($from);
    $type = $message['type'] ?? '';

    if ($type === 'text') {
        $textBody = strtolower(trim($message['text']['body'] ?? ''));
        if (in_array($textBody, ['menu', 'القائمة', 'main menu'])) {
            if ($session && $session['language']) {
                sendMainMenuIntermediate($from, $session['language']);
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
                sendMainMenuIntermediate($from, $lang);
                return;
            }
        }
        askLanguageMode($from);
        return;
    }

    $lang = $session['language'];
    $config = getSchoolConfig();

    if ($type === 'interactive') {
        $replyId = $message['interactive']['list_reply']['id'] ?? $message['interactive']['button_reply']['id'] ?? '';

        if ($replyId === 'main_menu') {
            sendMainMenuIntermediate($from, $lang);
            return;
        }

        if (strpos($replyId, 'menu_') === 0) {
            // Direct text responses
            if (in_array($replyId, ['menu_reqs', 'menu_disc', 'menu_accr', 'menu_faqs'])) {
                $text = $config['static_content'][$replyId][$lang];
                sendFinalTextWithMenuButton($from, $text, $lang);
                return;
            }

            // Requires Department selection
            if (in_array($replyId, ['menu_stages', 'menu_age', 'menu_fees'])) {
                $action = str_replace('menu_', '', $replyId);
                sendDepartmentMenuIntermediate($from, $lang, $action);
                return;
            }
        }

        if (strpos($replyId, 'act_') === 0) {
            $parts = explode('_', $replyId);
            if (count($parts) >= 3) {
                $action = $parts[1];
                $deptKey = $parts[2];
                sendStageMenuIntermediate($from, $lang, $action, $deptKey);
                return;
            }
        }

        if (strpos($replyId, 'res_') === 0) {
            $parts = explode('_', $replyId);
            $action = $parts[1]; // fees, age, stages

            array_shift($parts); array_shift($parts);
            $stageId = implode('_', $parts);

            $stageData = findStageById($stageId);

            if ($stageData) {
                $stageName = $stageData['name'][$lang];
                $responseText = "";

                if ($action === 'stages') {
                    if ($stageData['offered']) {
                        $enText = "✅ *{$stageName}* is currently offered at Harvest Schools.";
                        $arText = "✅ مرحلة *{$stageName}* متاحة حالياً للتسجيل في مدارس هارڤست.";
                        $responseText = ($lang === 'en') ? $enText : $arText;
                    } else {
                        $enText = "❌ Sorry, *{$stageName}* is currently NOT offered at Harvest Schools.";
                        $arText = "❌ نعتذر، مرحلة *{$stageName}* غير متاحة حالياً في مدارس هارڤست.";
                        $responseText = ($lang === 'en') ? $enText : $arText;
                    }
                }
                elseif ($action === 'age') {
                    if (!$stageData['offered']) {
                        $responseText = ($lang === 'en')
                            ? "❌ *{$stageName}* is currently not offered."
                            : "❌ *{$stageName}* غير متاحة حالياً.";
                    } else {
                        $ageStr = $stageData['age'][$lang];
                        $enText = "The minimum registration age for *{$stageName}* is:\n👉 {$ageStr}";
                        $arText = "الحد الأدنى لسن القبول في مرحلة *{$stageName}* هو:\n👉 {$ageStr}";
                        $responseText = ($lang === 'en') ? $enText : $arText;
                    }
                }
                elseif ($action === 'fees') {
                    if (!$stageData['offered']) {
                        $responseText = ($lang === 'en')
                            ? "❌ *{$stageName}* is currently not offered."
                            : "❌ *{$stageName}* غير متاحة حالياً.";
                    } else {
                        $feesStr = number_format($stageData['fees']);
                        $currency = ($lang === 'en') ? "EGP" : "ج.م";

                        $enText = "The annual tuition fees for *{$stageName}* are:\n👉 *{$feesStr} {$currency}*";
                        $arText = "المصروفات الدراسية السنوية لمرحلة *{$stageName}* هي:\n👉 *{$feesStr} {$currency}*";

                        $responseText = (($lang === 'en') ? $enText : $arText) . $config['static_content']['fees_disclaimer'][$lang];
                    }
                }

                sendFinalTextWithMenuButton($from, $responseText, $lang);
            }
            return;
        }
    }

    sendMainMenuIntermediate($from, $lang);
}

function askLanguageMode($to) {
    sendButtons($to, "Please choose your language / يرجى اختيار اللغة", [
        ["id" => "lang_en", "title" => "English"],
        ["id" => "lang_ar", "title" => "العربية"]
    ]);
}

function sendMainMenuIntermediate($to, $lang) {
    $config = getSchoolConfig();
    $ui = $config['ui'];

    $rows = [];
    foreach ($config['main_options'] as $opt) {
        $rows[] = ["id" => $opt['id'], "title" => mb_substr($opt[$lang], 0, 24)];
    }

    sendList($to, $ui['main_body'][$lang], $ui['main_btn'][$lang], [[
        "title" => mb_substr($ui['main_title'][$lang], 0, 24),
        "rows" => $rows
    ]]);
}

function sendDepartmentMenuIntermediate($to, $lang, $action) {
    $config = getSchoolConfig();
    $ui = $config['ui'];

    $deptRows = [];
    foreach ($config['departments'] as $deptKey => $deptData) {
        $id = "act_" . $action . "_" . $deptKey;
        $deptRows[] = ["id" => $id, "title" => mb_substr($deptData['name'][$lang], 0, 24)];
    }

    $sections = [
        [
            "title" => mb_substr($ui['dept_title'][$lang], 0, 24),
            "rows" => $deptRows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => [ ["id" => "main_menu", "title" => mb_substr($ui['back_btn'][$lang], 0, 24)] ]
        ]
    ];

    sendList($to, $ui['dept_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendStageMenuIntermediate($to, $lang, $action, $deptKey) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $dept = $config['departments'][$deptKey] ?? null;

    if (!$dept) return;

    $sections = [];

    foreach ($dept['sections'] as $secKey => $secData) {
        $rows = [];
        foreach ($secData['stages'] as $stageId => $stage) {
            $id = "res_" . $action . "_" . $stageId; // e.g. res_fees_stg_am_g9

            // Indicate if not offered in the row title (Optional but helpful UI touch)
            $titleMark = $stage['offered'] ? '' : ($lang === 'en' ? ' (N/A)' : ' (غير متاح)');
            $rows[] = ["id" => $id, "title" => mb_substr($stage['name'][$lang] . $titleMark, 0, 24)];
        }

        if (!empty($rows)) {
            $sections[] = [
                "title" => mb_substr($secData['title'][$lang], 0, 24),
                "rows" => $rows
            ];
        }
    }

    $sections[] = [
        "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
        "rows" => [ ["id" => "main_menu", "title" => mb_substr($ui['back_btn'][$lang], 0, 24)] ]
    ];

    sendList($to, $ui['stage_body'][$lang], $ui['main_btn'][$lang], $sections);
}

function sendFinalTextWithMenuButton($to, $text, $lang) {
    $config = getSchoolConfig();
    $btnTitle = mb_substr($config['ui']['back_btn'][$lang], 0, 20);

    sendButtons($to, $text, [
        ["id" => "main_menu", "title" => $btnTitle]
    ]);
}