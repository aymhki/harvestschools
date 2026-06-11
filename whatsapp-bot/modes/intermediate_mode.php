<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../whatsapp_api.php';
function getSchoolConfig() {
    return [
        'contact_departments' => [
            'reception' => ['en' => 'Harvest Reception', 'ar' => 'الريسيبشن', 'number' => '201061894477'],
            'student_affairs' => ['en' => 'Student Affairs', 'ar' => 'شئون الطلبة', 'number' => '201118900259'],
            'accounting' => ['en' => 'Accounting', 'ar' => 'الحسابات', 'number' => '201118900946'],
            'admissions' => ['en' => 'Harvest Admissions', 'ar' => 'التقديمات', 'number' => '201062255862'],
            'national' => ['en' => 'National Department', 'ar' => 'قسم الناشونال', 'number' => '201028329668'],
            'british' => ['en' => 'IG Department', 'ar' => 'القسم البريطاني', 'number' => '201097875407'],
            'kindergarten' => ['en' => 'KG Department', 'ar' => 'قسم الكي جي', 'number' => '201028319440'],
            'american' => ['en' => 'American Department', 'ar' => 'القسم الامريكي', 'number' => '201028940675'],
        ],
        'ui' => [
            'main_title' => ['en' => 'Main Menu', 'ar' => 'القائمة الرئيسية'],
            'main_body' => ['en' => 'Welcome to Harvest International Schools chat bot. Please choose a topic below:', 'ar' => 'مرحباً بكم في مدارس هارڤست الدولية. يرجى اختيار موضوع من القائمة:'],
            'main_body_fallback' => ['en' => 'Please choose a topic from the menu below:', 'ar' => 'يرجى اختيار موضوع من القائمة أدناه:'],
            'main_btn' => ['en' => 'Options', 'ar' => 'الخيارات'],
            'dept_title' => ['en' => 'Choose Department', 'ar' => 'اختر القسم'],
            'dept_body' => ['en' => 'Please select the educational department:', 'ar' => 'يرجى اختيار القسم التعليمي:'],
            'sec_title' => ['en' => 'Choose Stage Group', 'ar' => 'اختر المرحلة الدراسية'],
            'sec_body' => ['en' => 'Please select the stage group:', 'ar' => 'يرجى اختيار المجموعة الدراسية:'],
            'stage_title' => ['en' => 'Choose Grade', 'ar' => 'اختر الصف'],
            'stage_body' => ['en' => 'Please select the specific grade:', 'ar' => 'يرجى اختيار الصف الدراسي بالتحديد:'],
            'faq_title' => ['en' => 'FAQs', 'ar' => 'الأسئلة الشائعة'],
            'faq_body' => ['en' => 'Select a question to view the answer:', 'ar' => 'اختر سؤالاً لعرض الإجابة:'],
            'back_btn' => ['en' => 'Main Menu', 'ar' => 'القائمة الرئيسية'],
            'apply_btn' => ['en' => 'Apply Now', 'ar' => 'تقدم الأن'],
            'change_lang_btn' => ['en' => 'تغيير للغة العربية', 'ar' => 'Change to English'],
            'nav_section' => ['en' => 'Navigation', 'ar' => 'التنقل'],
            'contact_title' => ['en' => 'Contact Departments', 'ar' => 'أقسام التواصل'],
            'contact_body' => ['en' => 'Please select a department to chat with:', 'ar' => 'يرجى اختيار القسم للتحدث معه:'],
            'unoffered_note' => ['en' => 'Please note that unavailable stages will not be shown here.', 'ar' => 'يرجى ملاحظة أنه لن يتم عرض المراحل غير المتاحة هنا.'],
            'fees_disc_body' => ['en' => 'Select a department to view tuition fees, or view our discounts policy:', 'ar' => 'اختر القسم لعرض المصروفات أو اطلع على سياسة الخصومات:'],
            'disc_section' => ['en' => 'Discounts', 'ar' => 'الخصومات'],
            'disc_item' => ['en' => 'View Discounts', 'ar' => 'عرض الخصومات'],
            'info_title' => ['en' => 'Information', 'ar' => 'معلومات'],
            'info_body' => ['en' => 'Please select a topic:', 'ar' => 'يرجى اختيار موضوع:'],
            'faqs_item' => ['en' => 'FAQs', 'ar' => 'الأسئلة الشائعة'],
            'careers_item' => ['en' => 'Careers / Vacancies', 'ar' => 'الوظائف المتاحة'],
        ],
        'main_options' => [
            ['id' => 'menu_stages', 'en' => 'Stages Offered', 'ar' => 'المراحل المتاحة'],
            ['id' => 'menu_age', 'en' => 'Minimum Age', 'ar' => 'سن القبول'],
            ['id' => 'menu_reqs', 'en' => 'Admission Requirements', 'ar' => 'متطلبات التقديم'],
            ['id' => 'menu_fees', 'en' => 'Tuition Fees & Discounts', 'ar' => 'المصروفات والخصومات'],
            ['id' => 'menu_accr', 'en' => 'Accreditations', 'ar' => 'الاعتمادات'],
            ['id' => 'menu_info', 'en' => 'FAQs & Careers', 'ar' => 'الأسئلة والوظائف'],
            ['id' => 'menu_contact', 'en' => 'Chat with a Department', 'ar' => 'التحدث مع احد الأقسام'],
            ['id' => 'menu_apply', 'en' => 'Apply Now', 'ar' => 'تقدم الأن'],
        ],
        'static_content' => [
            'menu_disc' => [
                'en' => "*Discounts:*\n\n• *Siblings Discount:* 10% off tuition fees\n• *Staff Discount:* 40% off tuition fees\n\n_For combined discount cases, please confirm directly with our Accounting department to get an accurate quote._",
                'ar' => "*الخصومات:*\n\n• *خصم الأخوة:* 10% من المصروفات الدراسية\n• *خصم العاملين:* 40% من المصروفات الدراسية\n\n_في حالات الخصومات المجمعة، يرجى مراجعة قسم الحسابات مباشرة للحصول على التأكيد الدقيق._"
            ],
            'menu_accr' => [
                'en' => "*Accreditations:*\n\n• *National Dept:* Accredited by the Egyptian Ministry of Education\n• *British Dept:* Accredited by Cambridge / Pearson Edexcel / Oxford\n• *American Dept:* Accredited by Cognia",
                'ar' => "*الاعتمادات:*\n\n• *القسم القومي:* معتمد من وزارة التربية والتعليم المصرية\n• *القسم البريطاني:* معتمد من Cambridge / Pearson Edexcel / Oxford\n• *القسم الأمريكي:* معتمد من Cognia"
            ],
            'menu_careers' => [
                'en' => "We're always open to talented educators joining the Harvest family.\n\nYou can submit your application here:\nhttps://harvestschools.com/vacancies",
                'ar' => "نحن نرحب دائماً بالكوادر التعليمية المتميزة للانضمام إلى عائلة هارڤست.\n\nيمكنك تقديم طلب التوظيف من هنا:\nhttps://harvestschools.com/vacancies"
            ],
            'fees_disclaimer' => [
                'en' => "\n\n_Note: Tuition does NOT include uniforms, books, transportation, or activities. You may also be eligible for siblings/staff discounts. Please check with Accounting for specifics._",
                'ar' => "\n\n_ملاحظة: المصروفات لا تشمل الزي المدرسي، الكتب، الباص، أو الأنشطة. قد تكون مؤهلاً لخصومات الأخوة أو العاملين. يرجى مراجعة قسم الحسابات للتفاصيل._"
            ]
        ],
        'faqs' => [
            'faq_mixed' => [
                'q' => ['en' => 'Is the school mixed?', 'ar' => 'هل المدرسة مختلطة؟'],
                'a' => ['en' => 'Yes, Harvest International Schools is a mixed school.', 'ar' => 'نعم، مدارس هارڤست هي مدرسة مختلطة.']
            ],
            'faq_transfer' => [
                'q' => ['en' => 'Accept transfers?', 'ar' => 'هل تقبل التحويلات؟'],
                'a' => ['en' => 'Yes, transfer students are accepted as long as they pass an entry test held at the school.', 'ar' => 'نعم، تقبل المدرسة التحويلات بشرط اجتياز الطالب لاختبار القبول بالمدرسة.']
            ],
            'faq_fees' => [
                'q' => ['en' => 'Do fees change yearly?', 'ar' => 'هل تتغير المصروفات سنوياً؟'],
                'a' => ['en' => 'Only increases applied by the Ministry of Education are applied, which can be up to 10%.', 'ar' => 'تطبق فقط الزيادات المقررة من وزارة التربية والتعليم، والتي قد تصل إلى 10%.']
            ],
            'faq_teachers' => [
                'q' => ['en' => 'Are there foreign teachers?', 'ar' => 'هل يوجد مدرسين أجانب؟'],
                'a' => ['en' => 'Our teachers are mostly Egyptian and highly qualified.', 'ar' => 'المدرسون في الغالب مصريون ذوو كفاءة عالية جداً.']
            ],
            'faq_bus' => [
                'q' => ['en' => 'Is there transportation?', 'ar' => 'هل يوجد باصات للمدرسة؟'],
                'a' => ['en' => 'Yes, school buses cover every district in Alexandria.', 'ar' => 'نعم، تغطي الباصات جميع مناطق الإسكندرية.']
            ],
            'faq_sports' => [
                'q' => ['en' => 'Are there sports?', 'ar' => 'هل توجد أنشطة رياضية؟'],
                'a' => ['en' => 'Yes, Harvest Academy provides all kinds of sports activities throughout the year.', 'ar' => 'نعم، توفر المدرسة جميع أنواع الأنشطة الرياضية على مدار العام.']
            ],
        ],
        'departments' => [
            'early' => [
                'name' => ['en' => 'Pre-Play & Playschool', 'ar' => 'مرحلة ما قبل المدرسة'],
                'sections' => [
                    'early_stg' => [
                        'title' => ['en' => 'Pre-Play & Playschool', 'ar' => 'Pre-Play & Playschool'],
                        'stages' => [
                            'stg_pre_play' => ['name' => ['en' => 'Pre-Play', 'ar' => 'Pre-Play'], 'offered' => true, 'age' => ['en' => '2 years and 4 months', 'ar' => 'سنتان و 4 شهور'], 'fees' => 24150],
                            'stg_play' => ['name' => ['en' => 'Playschool', 'ar' => 'Playschool'], 'offered' => true, 'age' => ['en' => '2 years and 6 months', 'ar' => 'سنتان و 6 شهور'], 'fees' => 28750],
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
                        'title' => ['en' => 'Primary (Junior)', 'ar' => 'الابتدائي'],
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
                        'title' => ['en' => 'Preparatory (Middle)', 'ar' => 'الإعدادي'],
                        'stages' => [
                            'stg_nat_m1' => ['name' => ['en' => 'Middle 1', 'ar' => 'الصف الأول الإعدادي'], 'offered' => true, 'age' => ['en' => '12 years', 'ar' => '12 سنة'], 'fees' => 36490],
                            'stg_nat_m2' => ['name' => ['en' => 'Middle 2', 'ar' => 'الصف الثاني الإعدادي'], 'offered' => true, 'age' => ['en' => '13 years', 'ar' => '13 سنة'], 'fees' => 36490],
                            'stg_nat_m3' => ['name' => ['en' => 'Middle 3', 'ar' => 'الصف الثالث الإعدادي'], 'offered' => true, 'age' => ['en' => '14 years', 'ar' => '14 سنة'], 'fees' => 36490],
                        ]
                    ],
                    'nat_sr' => [
                        'title' => ['en' => 'Secondary (Senior)', 'ar' => 'الثانوي'],
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
                        'title' => ['en' => 'Foundation Stage', 'ar' => 'المرحلة التأسيسية'],
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
    $config = getSchoolConfig();
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
                ["id" => "main_menu", "title" => mb_substr($config['ui']['back_btn'][$lang], 0, 20)]
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
            }
            return;
        }
        if (strpos($replyId, 'menu_') === 0) {
            if (in_array($replyId, ['menu_disc', 'menu_accr', 'menu_careers'])) {
                $text = $config['static_content'][$replyId][$lang];
                sendFinalTextWithMenuButton($from, $text, $lang, $replyId);
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
            $parts = explode('_', $replyId);
            if (count($parts) >= 3) {
                $action = $parts[1];
                $deptKey = $parts[2];
                if ($deptKey === 'early') {
                    sendStageMenuIntermediate($from, $lang, $action, 'early', 'early_stg');
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
            array_shift($parts); array_shift($parts);
            $stageId = implode('_', $parts);
            $stageData = findStageById($stageId);
            if ($stageData) {
                $stageName = $stageData['name'][$lang];
                $responseText = "";
                if ($stageData['offered']) {
                    $currency = ($lang === 'en') ? "EGP" : "ج.م";
                    $feesStr = number_format($stageData['fees']);
                    $ageStr = $stageData['age'][$lang];
                    $reqsStr = getRequirementsForStage($stageId, $stageName, $lang);
                    $disclaimer = $config['static_content']['fees_disclaimer'][$lang];
                    if ($lang === 'en') {
                        $responseText = "*{$stageName}* is currently offered at Harvest Schools.\n\n";
                        $responseText .= "*Minimum Registration Age:* {$ageStr}\n";
                        $responseText .= "*Annual Tuition Fees:* {$feesStr} {$currency}\n\n";
                        $responseText .= "{$reqsStr}";
                        $responseText .= "{$disclaimer}";
                    } else {
                        $responseText = "مرحلة *{$stageName}* متاحة حالياً للتسجيل في مدارس هارڤست.\n\n";
                        $responseText .= "*الحد الأدنى لسن القبول:* {$ageStr}\n";
                        $responseText .= "*المصروفات الدراسية السنوية:* {$feesStr} {$currency}\n\n";
                        $responseText .= "{$reqsStr}";
                        $responseText .= "{$disclaimer}";
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
    $config = getSchoolConfig();
    return [
        ["id" => "main_menu", "title" => mb_substr($config['ui']['back_btn'][$lang], 0, 24)],
        ["id" => "menu_apply", "title" => mb_substr($config['ui']['apply_btn'][$lang], 0, 24)],
        ["id" => "lang_toggle_" . $currentMenuId, "title" => mb_substr($config['ui']['change_lang_btn'][$lang], 0, 24)]
    ];
}
function sendMainMenuIntermediate($to, $lang, $fallback) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $rows = [];
    foreach ($config['main_options'] as $opt) {
        $rows[] = ["id" => $opt['id'], "title" => mb_substr($opt[$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['main_title'][$lang], 0, 24),
            "rows" => $rows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => [
                ["id" => "lang_toggle_main_menu", "title" => mb_substr($ui['change_lang_btn'][$lang], 0, 24)]
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
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $rows = [];
    foreach ($config['faqs'] as $faqId => $faqData) {
        $rows[] = ["id" => $faqId, "title" => mb_substr($faqData['q'][$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['faq_title'][$lang], 0, 24),
            "rows" => $rows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, 'menu_faqs')
        ]
    ];
    sendList($to, $ui['faq_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendContactMenuIntermediate($to, $lang) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $rows = [];
    foreach ($config['contact_departments'] as $id => $dept) {
        $rows[] = ["id" => "contact_" . $id, "title" => mb_substr($dept[$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['contact_title'][$lang], 0, 24),
            "rows" => $rows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => [
                ["id" => "main_menu", "title" => mb_substr($config['ui']['back_btn'][$lang], 0, 24)],
            ]
        ]
    ];
    sendList($to, $ui['contact_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendFeesAndDiscountsMenuIntermediate($to, $lang) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $deptRows = [];
    foreach ($config['departments'] as $deptKey => $deptData) {
        $deptRows[] = ["id" => "act_fees_{$deptKey}", "title" => mb_substr($deptData['name'][$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['dept_title'][$lang], 0, 24),
            "rows" => $deptRows
        ],
        [
            "title" => mb_substr($ui['disc_section'][$lang], 0, 24),
            "rows" => [
                ["id" => "menu_disc", "title" => mb_substr($ui['disc_item'][$lang], 0, 24)]
            ]
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, 'menu_fees')
        ]
    ];
    sendList($to, $ui['fees_disc_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendInfoMenuIntermediate($to, $lang) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $sections = [
        [
            "title" => mb_substr($ui['info_title'][$lang], 0, 24),
            "rows" => [
                ["id" => "menu_faqs", "title" => mb_substr($ui['faqs_item'][$lang], 0, 24)],
                ["id" => "menu_careers", "title" => mb_substr($ui['careers_item'][$lang], 0, 24)],
            ]
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, 'menu_info')
        ]
    ];
    sendList($to, $ui['info_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendDepartmentMenuIntermediate($to, $lang, $action) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $deptRows = [];
    foreach ($config['departments'] as $deptKey => $deptData) {
        $id = "act_{$action}_{$deptKey}";
        $deptRows[] = ["id" => $id, "title" => mb_substr($deptData['name'][$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['dept_title'][$lang], 0, 24),
            "rows" => $deptRows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, "menu_{$action}")
        ]
    ];
    sendList($to, $ui['dept_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendSectionMenuIntermediate($to, $lang, $action, $deptKey) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $dept = $config['departments'][$deptKey] ?? null;
    if (!$dept) return;
    $secRows = [];
    foreach ($dept['sections'] as $secKey => $secData) {
        $id = "sec_{$action}_{$deptKey}_{$secKey}";
        $secRows[] = ["id" => $id, "title" => mb_substr($secData['title'][$lang], 0, 24)];
    }
    $sections = [
        [
            "title" => mb_substr($ui['sec_title'][$lang], 0, 24),
            "rows" => $secRows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, "act_{$action}_{$deptKey}")
        ]
    ];
    sendList($to, $ui['sec_body'][$lang], $ui['main_btn'][$lang], $sections);
}
function sendStageMenuIntermediate($to, $lang, $action, $deptKey, $secKey) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    $stageData = $config['departments'][$deptKey]['sections'][$secKey] ?? null;
    if (!$stageData) return;
    $filterUnoffered = in_array($action, ['fees', 'reqs']);
    $rows = [];
    foreach ($stageData['stages'] as $stageId => $stage) {
        if ($filterUnoffered && !$stage['offered']) continue;
        $id = "res_{$action}_{$stageId}";
        $rows[] = ["id" => $id, "title" => mb_substr($stage['name'][$lang], 0, 24)];
    }
    $bodyText = $ui['stage_body'][$lang];
    if ($filterUnoffered) {
        $bodyText .= "\n\n_" . $ui['unoffered_note'][$lang] . "_";
    }
    $sections = [
        [
            "title" => mb_substr($stageData['title'][$lang], 0, 24),
            "rows" => $rows
        ],
        [
            "title" => mb_substr($ui['nav_section'][$lang], 0, 24),
            "rows" => getNavRows($lang, "sec_{$action}_{$deptKey}_{$secKey}")
        ]
    ];
    sendList($to, $bodyText, $ui['main_btn'][$lang], $sections);
}
function sendFinalTextWithMenuButton($to, $text, $lang, $currentMenuId) {
    $config = getSchoolConfig();
    $ui = $config['ui'];
    sendButtons($to, $text, [
        ["id" => "main_menu", "title" => mb_substr($ui['back_btn'][$lang], 0, 20)],
        ["id" => "menu_apply", "title" => mb_substr($ui['apply_btn'][$lang], 0, 20)],
        ["id" => "lang_toggle_" . $currentMenuId, "title" => mb_substr($ui['change_lang_btn'][$lang], 0, 20)]
    ]);
}