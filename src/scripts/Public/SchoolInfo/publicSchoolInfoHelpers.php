<?php

require_once __DIR__ . '/publicInfoAllowlist.php';
require_once __DIR__ . '/publicPageInventory.php';
require_once __DIR__ . '/../Staff/publicStaffHelpers.php';

const PUBLIC_SCHOOL_CALENDARS = [
    ['id' => 'national', 'labelEn' => 'National', 'labelAr' => 'ناشونال', 'eventsKey' => 'events-pages.national-calendar-page.calendar', 'path' => '/events/national-calendar'],
    ['id' => 'british', 'labelEn' => 'British', 'labelAr' => 'بريطاني', 'eventsKey' => 'events-pages.british-calendar-page.calendar', 'path' => '/events/british-calendar'],
    ['id' => 'american', 'labelEn' => 'American', 'labelAr' => 'أمريكي', 'eventsKey' => 'events-pages.american-calendar-page.calendar', 'path' => '/events/american-calendar'],
    ['id' => 'national-kg', 'labelEn' => 'National KG', 'labelAr' => 'روضة ناشونال', 'eventsKey' => 'events-pages.kg-calendars-pages.national-kg-calendar.calendar', 'path' => '/events/national-kg-calendar'],
    ['id' => 'british-kg', 'labelEn' => 'British KG', 'labelAr' => 'روضة بريطاني', 'eventsKey' => 'events-pages.kg-calendars-pages.british-kg-calendar.calendar', 'path' => '/events/british-kg-calendar'],
    ['id' => 'american-kg', 'labelEn' => 'American KG', 'labelAr' => 'روضة أمريكي', 'eventsKey' => 'events-pages.kg-calendars-pages.american-kg-calendar.calendar', 'path' => '/events/american-kg-calendar'],
];

function public_info_locale_directory() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    $candidates = [
        $docRoot === '' ? null : dirname($docRoot) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'locales',
        $docRoot === '' ? null : $docRoot . DIRECTORY_SEPARATOR . 'locales',
        dirname(__DIR__, 4) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR . 'locales',
    ];

    foreach ($candidates as $candidate) {
        if ($candidate !== null && $candidate !== '' && is_dir($candidate)) {
            return $candidate;
        }
    }

    return null;
}

function public_info_read_locale_namespace($language, $namespace) {
    static $cache = [];

    $cacheKey = $language . '/' . $namespace;

    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }

    $directory = public_info_locale_directory();
    $decoded = null;

    if ($directory !== null) {
        $path = $directory . DIRECTORY_SEPARATOR . $language . DIRECTORY_SEPARATOR . $namespace . '.json';

        if (is_file($path)) {
            $raw = @file_get_contents($path);
            $parsed = $raw === false ? null : json_decode($raw, true);
            $decoded = is_array($parsed) ? $parsed : null;
        }
    }

    $cache[$cacheKey] = $decoded;

    return $decoded;
}

function public_info_traverse_locale($data, $segments) {
    $cursor = $data;

    foreach ($segments as $segment) {
        if (!is_array($cursor) || !array_key_exists($segment, $cursor)) {
            return null;
        }

        $cursor = $cursor[$segment];
    }

    return $cursor;
}

function public_info_locale_lookup($language, $keyPath) {
    $segments = explode('.', $keyPath);
    $data = public_info_read_locale_namespace($language, $segments[0]);

    if (!is_array($data)) {
        return null;
    }

    $nested = public_info_traverse_locale($data, $segments);

    return $nested !== null ? $nested : public_info_traverse_locale($data, array_slice($segments, 1));
}

function public_info_is_placeholder($text) {
    $value = strtolower(trim((string)$text));

    return $value === '' || strpos($value, 'this-page-is-under-construction') !== false || strpos($value, 'under-construction') !== false;
}

function public_info_strip_inline_links($text) {
    $withoutLinks = preg_replace('/\{\{([^|}]+)\|[^}]*\}\}/u', '$1', (string)$text);

    return trim(preg_replace('/\s+/u', ' ', (string)$withoutLinks));
}

function public_info_localised($row, $column, $language) {
    $value = $row[$column . '_' . $language] ?? null;

    if ($value === null || $value === '') {
        $value = $row[$column . '_en'] ?? null;
    }

    return ($value === null || $value === '') ? null : $value;
}

function public_school_profile($conn, $language) {
    $profile = [];
    $result = $conn->query("SELECT profile_key, category, value_en, value_ar, note_en, note_ar FROM info_system_school_profile ORDER BY sort_order ASC");

    while ($row = $result->fetch_assoc()) {
        $value = public_info_localised($row, 'value', $language);

        if ($value === null) {
            continue;
        }

        $profile[$row['profile_key']] = [
            'value'    => $value,
            'note'     => public_info_localised($row, 'note', $language),
            'category' => $row['category'],
        ];
    }

    return $profile;
}

function public_school_departments($conn, $language) {
    $departments = [];
    $result = $conn->query("SELECT dept_key, name_en, name_ar, contact_number, is_academic, sort_order FROM info_system_departments ORDER BY sort_order ASC");

    while ($row = $result->fetch_assoc()) {
        $departments[] = [
            'key'           => $row['dept_key'],
            'name'          => public_info_localised($row, 'name', $language),
            'contactNumber' => $row['contact_number'],
            'isAcademic'    => (int)$row['is_academic'] === 1,
            'sortOrder'     => (int)$row['sort_order'],
            'routePath'     => PUBLIC_DEPARTMENT_ROUTE_PATHS[$row['dept_key']] ?? null,
        ];
    }

    return $departments;
}

function public_school_stages($conn, $language, $includeUnoffered, $departmentKey = null) {
    $stages = [];

    $sql = "SELECT s.stage_key, s.dept_key, s.section_key, s.section_title_en, s.section_title_ar, s.name_en, s.name_ar, s.is_offered, s.age_en, s.age_ar, s.tuition_fees, s.sort_order, d.name_en AS dept_name_en, d.name_ar AS dept_name_ar
            FROM info_system_stages s
            LEFT JOIN info_system_departments d ON d.dept_key = s.dept_key";

    $conditions = [];
    $parameters = [];
    $types = '';

    if (!$includeUnoffered) {
        $conditions[] = "s.is_offered = 1";
    }

    if ($departmentKey !== null && $departmentKey !== '') {
        $conditions[] = "s.dept_key = ?";
        $parameters[] = $departmentKey;
        $types .= 's';
    }

    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(' AND ', $conditions);
    }

    $sql .= " ORDER BY s.dept_key, s.sort_order ASC";

    $stmt = $conn->prepare($sql);

    if (!empty($parameters)) {
        $stmt->bind_param($types, ...$parameters);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $fees = $row['tuition_fees'];
        $normalisedFees = ($fees === null || (int)$fees === 0) ? null : (int)$fees;

        $stages[] = [
            'key'            => $row['stage_key'],
            'departmentKey'  => $row['dept_key'],
            'departmentName' => public_info_localised($row, 'dept_name', $language),
            'sectionKey'     => $row['section_key'],
            'sectionTitle'   => public_info_localised($row, 'section_title', $language),
            'name'           => public_info_localised($row, 'name', $language),
            'isOffered'      => (int)$row['is_offered'] === 1,
            'minimumAge'     => public_info_localised($row, 'age', $language),
            'tuitionFees'    => $normalisedFees,
            'sortOrder'      => (int)$row['sort_order'],
            'routePath'      => PUBLIC_DEPARTMENT_ROUTE_PATHS[$row['dept_key']] ?? null,
        ];
    }

    $stmt->close();

    return $stages;
}

function public_school_policies($conn, $language) {
    $groups = [];
    $result = $conn->query("SELECT item_key, group_key, title_en, title_ar, detail_en, detail_ar FROM info_system_policy_items ORDER BY group_key, sort_order ASC");

    while ($row = $result->fetch_assoc()) {
        $groups[$row['group_key']][] = [
            'key'    => $row['item_key'],
            'title'  => public_info_localised($row, 'title', $language),
            'detail' => public_info_localised($row, 'detail', $language),
        ];
    }

    return $groups;
}

function public_school_events($language) {
    $events = [];

    foreach (PUBLIC_SCHOOL_CALENDARS as $calendar) {
        $rows = public_info_locale_lookup($language, $calendar['eventsKey']);

        if (!is_array($rows)) {
            continue;
        }

        foreach ($rows as $index => $row) {
            if ($index === 0 || !is_array($row)) {
                continue;
            }

            $title = trim((string)($row['title'] ?? ''));
            $startRaw = trim((string)($row['start-date'] ?? ''));

            if ($title === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $startRaw)) {
                continue;
            }

            $endRaw = trim((string)($row['end-date'] ?? ''));

            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $endRaw)) {
                $endRaw = $startRaw;
            }

            $startTimestamp = strtotime($startRaw . ' 00:00:00 UTC');
            $endTimestamp = strtotime($endRaw . ' 00:00:00 UTC');

            $events[] = [
                'id'            => 'event.' . $calendar['id'] . '.' . $startRaw . '.' . substr(hash('sha256', $title), 0, 10),
                'title'         => $title,
                'startDate'     => $startTimestamp === false ? null : $startTimestamp * 1000,
                'rawStartDate'  => $startRaw,
                'endDate'       => $endTimestamp === false ? null : $endTimestamp * 1000,
                'rawEndDate'    => $endRaw,
                'calendarId'    => $calendar['id'],
                'calendarLabel' => $language === 'ar' ? $calendar['labelAr'] : $calendar['labelEn'],
                'routePath'     => $calendar['path'],
                'isMultiDay'    => $endRaw !== $startRaw,
            ];
        }
    }

    usort($events, function ($first, $second) {
        return ($first['startDate'] ?? 0) <=> ($second['startDate'] ?? 0);
    });

    return $events;
}

function public_school_pages($language) {
    $pages = [];

    foreach (PUBLIC_PAGE_INVENTORY as $page) {
        $title = null;

        if ($page['titleKey'] !== null) {
            $resolved = public_info_locale_lookup($language, $page['titleKey']);
            $title = is_string($resolved) && $resolved !== '' ? $resolved : null;
        }

        $pages[] = [
            'id'              => $page['id'],
            'title'           => $title ?? $page['titleEn'],
            'routePath'       => $page['path'],
            'keywords'        => $page['keywords'],
            'section'         => $page['section'],
            'renderableInApp' => true,
        ];
    }

    return $pages;
}

const PUBLIC_PROFILE_LABELS = [
    'school_name'        => ['en' => 'School name', 'ar' => 'اسم المدرسة', 'keywords' => ['school name', 'اسم المدرسة', 'المدرسة']],
    'address'            => ['en' => 'Address', 'ar' => 'العنوان', 'keywords' => ['address', 'location', 'where', 'العنوان', 'الموقع', 'مكان', 'فين']],
    'maps_url'           => ['en' => 'Map', 'ar' => 'الخريطة', 'keywords' => ['map', 'directions', 'maps', 'الخريطة', 'الاتجاهات']],
    'latitude'           => ['en' => 'Latitude', 'ar' => 'خط العرض', 'keywords' => ['latitude']],
    'longitude'          => ['en' => 'Longitude', 'ar' => 'خط الطول', 'keywords' => ['longitude']],
    'general_phone'      => ['en' => 'Phone number', 'ar' => 'رقم الهاتف', 'keywords' => ['phone', 'telephone', 'number', 'contact', 'رقم', 'الهاتف', 'التواصل', 'تليفون']],
    'email'              => ['en' => 'Email address', 'ar' => 'البريد الإلكتروني', 'keywords' => ['email', 'mail', 'البريد', 'الإيميل']],
    'website'            => ['en' => 'Website', 'ar' => 'الموقع الإلكتروني', 'keywords' => ['website', 'site', 'الموقع الإلكتروني']],
    'facebook_url'       => ['en' => 'Facebook', 'ar' => 'فيسبوك', 'keywords' => ['facebook', 'social', 'فيسبوك']],
    'messenger_url'      => ['en' => 'Messenger', 'ar' => 'ماسنجر', 'keywords' => ['messenger', 'chat', 'ماسنجر']],
    'working_hours'      => ['en' => 'Working hours', 'ar' => 'مواعيد العمل', 'keywords' => ['working hours', 'opening hours', 'hours', 'open', 'close', 'مواعيد', 'ساعات العمل', 'الدوام', 'مفتوحة']],
    'tuition_currency'   => ['en' => 'Currency', 'ar' => 'العملة', 'keywords' => ['currency', 'العملة']],
    'minimum_age_cutoff' => ['en' => 'Minimum age cutoff', 'ar' => 'موعد حساب السن', 'keywords' => ['age cutoff', 'october', 'minimum age', 'السن', 'أكتوبر', 'العمر']],
];

function public_profile_label($profileKey, $language) {
    $entry = PUBLIC_PROFILE_LABELS[$profileKey] ?? null;

    if ($entry === null) {
        return str_replace('_', ' ', $profileKey);
    }

    return $entry[$language] ?? $entry['en'];
}

function public_profile_keywords($profileKey) {
    $entry = PUBLIC_PROFILE_LABELS[$profileKey] ?? null;

    return $entry === null ? [str_replace('_', ' ', $profileKey)] : $entry['keywords'];
}

const PUBLIC_NARRATIVE_FACTS = [
    [
        'key'      => 'home.harvest-schools-vision',
        'category' => 'about',
        'topicEn'  => 'Vision',
        'topicAr'  => 'الرؤية',
        'keywords' => ['vision', 'الرؤية'],
    ],
    [
        'key'      => 'home.harvest-schools-mission',
        'category' => 'about',
        'topicEn'  => 'Mission',
        'topicAr'  => 'الرسالة',
        'keywords' => ['mission', 'الرسالة'],
    ],
    [
        'key'      => 'home.harvest-schools-about-us',
        'category' => 'about',
        'topicEn'  => 'About Harvest Schools',
        'topicAr'  => 'عن مدارس هارڤست',
        'keywords' => ['about', 'history', 'founder', 'founded', 'who founded', 'story', 'عن المدرسة', 'المؤسس', 'تأسست', 'تاريخ'],
    ],
    [
        'key'      => 'home.harvest-schools-elearning-and-academics',
        'category' => 'academics',
        'topicEn'  => 'E-learning and academics',
        'topicAr'  => 'التعلم الإلكتروني والأكاديميات',
        'keywords' => ['elearning', 'e-learning', 'online learning', 'التعلم الإلكتروني'],
    ],
    [
        'key'      => 'corporate-home.harvest-schools-about-us',
        'category' => 'about',
        'topicEn'  => 'Al-Fajr Al-Basem, the founding company',
        'topicAr'  => 'الفجر الباسم، الشركة المؤسِّسة',
        'keywords' => [
            'founding company', 'parent company', 'al-fajr', 'al fajr al basem', 'alfajr', 'company',
            'founder', 'founded', 'history', 'الشركة', 'الفجر الباسم', 'المؤسس', 'تأسست',
        ],
    ],
];


const PUBLIC_PARTNERS = [
    [
        'key'            => 'schooleverywhere',
        'titleKey'       => 'academics-pages.partners.schooleverywhere-title',
        'descriptionKey' => 'academics-pages.partners.schooleverywhere-description',
        'keywords'       => ['partner', 'partners', 'schooleverywhere', 'school everywhere', 'portal', 'شريك', 'شركاء', 'الشركاء', 'بوابة'],
    ],
    [
        'key'            => 'ucmas',
        'titleKey'       => 'academics-pages.partners.ucmas-title',
        'descriptionKey' => 'academics-pages.partners.ucmas-description',
        'keywords'       => ['partner', 'partners', 'ucmas', 'mental arithmetic', 'abacus', 'شريك', 'شركاء', 'الشركاء', 'الحساب الذهني'],
    ],
];

const PUBLIC_FACILITY_LIST_KEYS = [
    'academics-pages.facilities.imageAlts',
    'academics-pages.facilities.sports.outdoorCourtsList',
];

const PUBLIC_FACILITY_TITLE_KEYS = [
    'academics-pages.facilities.computerLab.title',
    'academics-pages.facilities.library.title',
    'academics-pages.facilities.canteen.title',
    'academics-pages.facilities.smartClasses.title',
    'academics-pages.facilities.sports.gymnasiumsTitle',
    'academics-pages.facilities.sports.swimmingPoolTitle',
];


function public_facility_label($value) {
    $label = trim((string)$value);
    $label = rtrim($label, ": \u{060C}");
    $label = preg_replace('/\s*Policy$/iu', '', $label);
    $label = preg_replace('/^\x{0633}\x{064A}\x{0627}\x{0633}\x{0629}\s+/u', '', $label);

    return trim($label);
}

function public_school_facilities($language) {
    $facilities = [];
    $seen = [];

    $append = function ($value) use (&$facilities, &$seen) {
        $label = public_facility_label($value);

        if ($label === '') {
            return;
        }

        $fingerprint = mb_strtolower($label);

        if (isset($seen[$fingerprint])) {
            return;
        }

        $seen[$fingerprint] = true;
        $facilities[] = $label;
    };

    foreach (PUBLIC_FACILITY_LIST_KEYS as $listKey) {
        $entries = public_info_locale_lookup($language, $listKey);

        if (is_array($entries)) {
            foreach ($entries as $entry) {
                if (is_string($entry)) {
                    $append($entry);
                }
            }
        }
    }

    foreach (PUBLIC_FACILITY_TITLE_KEYS as $titleKey) {
        $title = public_info_locale_lookup($language, $titleKey);

        if (is_string($title)) {
            $append($title);
        }
    }

    return $facilities;
}

function public_narrative_fact_id($category, $localeKey) {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $localeKey));

    return 'fact.' . $category . '.' . trim($slug, '-');
}

function public_school_fact($id, $category, $topic, $answer, $keywords, $routePath, $source, $sourceKey) {
    return [
        'id'        => $id,
        'category'  => $category,
        'topic'     => $topic,
        'answer'    => $answer,
        'keywords'  => array_values(array_unique(array_filter($keywords))),
        'routePath' => $routePath,
        'source'    => $source,
        'sourceKey' => $sourceKey,
    ];
}

function public_school_facts($profile, $departments, $stages, $policies, $language) {
    $facts = [];
    $currency = $profile['tuition_currency']['value'] ?? 'EGP';

    foreach ($profile as $profileKey => $entry) {
        if (in_array($profileKey, ['latitude', 'longitude'], true)) {
            continue;
        }

        $answer = $entry['note'] === null ? $entry['value'] : $entry['value'] . ' — ' . $entry['note'];

        $facts[] = public_school_fact(
            'fact.profile.' . $profileKey,
            $entry['category'],
            public_profile_label($profileKey, $language),
            $answer,
            public_profile_keywords($profileKey),
            null,
            'infosystem',
            'info_system_school_profile.' . $profileKey
        );
    }

    foreach ($departments as $department) {
        $facts[] = public_school_fact(
            'fact.contact.department.' . $department['key'],
            'contact',
            $department['name'],
            $department['name'] . ': ' . $department['contactNumber'],
            [$department['name'], $department['key'], 'phone', 'contact', 'رقم', 'تواصل'],
            $department['routePath'],
            'infosystem',
            'info_system_departments.' . $department['key']
        );
    }

    foreach ($stages as $stage) {
        $topic = trim(($stage['departmentName'] ?? '') . ' — ' . ($stage['name'] ?? ''));

        if ($stage['tuitionFees'] === null) {
            $feeAnswer = $language === 'ar'
                ? 'المصروفات الدراسية لهذه المرحلة غير منشورة. يرجى التواصل مع قسم التقديمات.'
                : 'Tuition fees for this stage are not published. Please contact the admissions department.';
        } else {
            $feeAnswer = $language === 'ar'
                ? 'المصروفات الدراسية السنوية: ' . number_format($stage['tuitionFees']) . ' ' . $currency
                : 'Annual tuition fees: ' . number_format($stage['tuitionFees']) . ' ' . $currency;
        }

        $facts[] = public_school_fact(
            'fact.fees.' . $stage['key'],
            'fees',
            $topic,
            $feeAnswer,
            [$stage['name'], $stage['departmentName'], 'fees', 'tuition', 'مصروفات'],
            $stage['routePath'],
            'infosystem',
            'info_system_stages.' . $stage['key'] . '.tuition_fees'
        );

        if ($stage['minimumAge'] !== null) {
            $facts[] = public_school_fact(
                'fact.age.' . $stage['key'],
                'stages',
                $topic,
                $language === 'ar'
                    ? 'الحد الأدنى لسن التسجيل: ' . $stage['minimumAge']
                    : 'Minimum registration age: ' . $stage['minimumAge'],
                [$stage['name'], $stage['departmentName'], 'age', 'minimum age', 'سن'],
                $stage['routePath'],
                'infosystem',
                'info_system_stages.' . $stage['key'] . '.age_' . $language
            );
        }
    }

    foreach ($policies as $groupKey => $items) {
        foreach ($items as $item) {
            $answer = $item['detail'] === null ? $item['title'] : $item['title'] . ': ' . $item['detail'];

            $facts[] = public_school_fact(
                'fact.policy.' . $item['key'],
                $groupKey === 'discounts' ? 'fees' : 'policy',
                $item['title'],
                $answer,
                [$item['title'], str_replace('_', ' ', $groupKey)],
                null,
                'infosystem',
                'info_system_policy_items.' . $item['key']
            );
        }
    }

    foreach (PUBLIC_NARRATIVE_FACTS as $narrative) {
        $prose = public_info_locale_lookup($language, $narrative['key']);

        if (!is_string($prose) || trim($prose) === '' || public_info_is_placeholder($prose)) {
            continue;
        }

        $facts[] = public_school_fact(
            public_narrative_fact_id($narrative['category'], $narrative['key']),
            $narrative['category'],
            $language === 'ar' ? $narrative['topicAr'] : $narrative['topicEn'],
            public_info_strip_inline_links($prose),
            $narrative['keywords'],
            '/home',
            'locales',
            $narrative['key']
        );
    }

    foreach (PUBLIC_PARTNERS as $partner) {
        $title = public_info_locale_lookup($language, $partner['titleKey']);
        $description = public_info_locale_lookup($language, $partner['descriptionKey']);

        if (!is_string($description) || public_info_is_placeholder($description)) {
            continue;
        }

        $facts[] = public_school_fact(
            'fact.partner.' . $partner['key'],
            'academics',
            is_string($title) && $title !== '' ? $title : $partner['key'],
            public_info_strip_inline_links($description),
            $partner['keywords'],
            '/academics/partners',
            'locales',
            $partner['descriptionKey']
        );
    }

    $facilities = public_school_facilities($language);

    if ($facilities !== []) {
        $facts[] = public_school_fact(
            'fact.facilities.list',
            'academics',
            $language === 'ar' ? 'مرافق المدرسة' : 'School facilities',
            ($language === 'ar'
                ? 'تشمل مرافق المدرسة: '
                : 'The school facilities include: ') . implode($language === 'ar' ? '، ' : ', ', $facilities) . '.',
            array_merge(
                ['facilities', 'facility', 'campus', 'sports', 'labs', 'pool', 'gym', 'library',
                 'مرافق', 'المرافق', 'الحرم', 'ملاعب', 'معامل', 'حمام السباحة', 'المكتبة'],
                $facilities
            ),
            '/academics/facilities',
            'locales',
            'academics-pages.facilities'
        );
    }

    $faqs = public_info_locale_lookup($language, 'faqs-pages.faqs-page.q-and-a-list');

    if (is_array($faqs)) {
        foreach ($faqs as $index => $faq) {
            if (!is_array($faq)) {
                continue;
            }

            $question = trim((string)($faq['question'] ?? ''));
            $answer = public_info_strip_inline_links($faq['answer'] ?? '');

            if ($question === '' || $answer === '') {
                continue;
            }

            $facts[] = public_school_fact(
                'fact.faq.' . substr(hash('sha256', $question), 0, 12),
                'faq',
                $question,
                $answer,
                ['faq', 'question'],
                '/faqs',
                'locales',
                'faqs-pages.faqs-page.q-and-a-list[' . $index . ']'
            );
        }
    }

    return $facts;
}


function public_school_staff_facts($staff, $language) {
    $facts = [];
    $isArabic = $language === 'ar';

    foreach ($staff as $department) {
        $sentences = [];

        foreach ($department['highlights'] as $highlight) {
            $sentences[] = $highlight['position'] . ': ' . $highlight['name'];
        }

        $sentences[] = $isArabic
            ? 'عدد أعضاء هيئة التدريس المنشورين: ' . $department['memberCount']
            : $department['memberCount'] . ' published staff members.';

        $facts[] = public_school_fact(
            'fact.staff.' . $department['departmentKey'],
            'academics',
            $isArabic
                ? 'كوادر ' . $department['departmentName']
                : $department['departmentName'] . ' staff',
            implode(' ', $sentences),
            $isArabic
                ? ['كوادر', 'موظفين', 'معلمين', 'مدرسين', 'رئيس القسم', $department['departmentName']]
                : ['staff', 'teachers', 'faculty', 'head of department', 'coordinator', $department['departmentName']],
            $department['routePath'],
            'infosystem',
            'staff_employees.' . $department['departmentKey']
        );
    }

    return $facts;
}

function public_school_document($conn, $language) {
    $rules = public_info_read_rule_settings($conn);
    $includeUnoffered = ($rules['SHOW_UNOFFERED_STAGES'] ?? '1') === '1';

    $profile = public_school_profile($conn, $language);
    $departments = public_school_departments($conn, $language);
    $stages = public_school_stages($conn, $language, $includeUnoffered);
    $policies = public_school_policies($conn, $language);
    $staff = public_staff_directory($conn, $language);

    $document = [
        'schemaVersion' => PUBLIC_INFO_SCHEMA_VERSION,
        'generatedAt'   => gmdate('c'),
        'contentHash'   => '',
        'language'      => $language,
        'school'        => [
            'name'         => $profile['school_name']['value'] ?? null,
            'address'      => $profile['address']['value'] ?? null,
            'phone'        => array_values(array_filter(array_merge(
                                [$profile['general_phone']['value'] ?? null],
                                array_map(function ($department) { return $department['contactNumber']; }, $departments)
                              ))),
            'email'        => $profile['email']['value'] ?? null,
            'website'      => $profile['website']['value'] ?? null,
            'socials'      => array_filter([
                'facebook'  => $profile['facebook_url']['value'] ?? null,
                'messenger' => $profile['messenger_url']['value'] ?? null,
            ]),
            'workingHours' => $profile['working_hours']['value'] ?? null,
            'mapsUrl'      => $profile['maps_url']['value'] ?? null,
            'coordinates'  => (isset($profile['latitude']['value']) && isset($profile['longitude']['value']))
                ? ['latitude' => (float)$profile['latitude']['value'], 'longitude' => (float)$profile['longitude']['value']]
                : null,
            'currency'     => $profile['tuition_currency']['value'] ?? 'EGP',
        ],
        'departments' => $departments,
        'stages'      => $stages,
        'policies'    => $policies,
        'staff'       => $staff,
        'facts'       => array_merge(
            public_school_facts($profile, $departments, $stages, $policies, $language),
            public_school_staff_facts($staff, $language)
        ),
        'events'      => public_school_events($language),
        'pages'       => public_school_pages($language),
    ];

    $document['contentHash'] = public_school_content_hash($document);

    return $document;
}


function public_school_write_artifacts($conn, $docRoot, $suffix = '') {
    $hashes = [];

    foreach (PUBLIC_INFO_SUPPORTED_LANGUAGES as $language) {
        $document = public_school_document($conn, $language);
        $encoded = json_encode($document, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($encoded === false) {
            throw new Exception("Failed to encode the public school knowledge artifact for $language", 500);
        }

        $path = dirname(rtrim($docRoot, '/\\')) . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR
            . 'school-knowledge-' . $language . $suffix . '.json';
        $tempPath = $path . '.' . uniqid('tmp', true);

        if (file_put_contents($tempPath, $encoded) === false || !rename($tempPath, $path)) {
            @unlink($tempPath);
            throw new Exception("Failed to write $path", 500);
        }

        @chmod($path, 0644);

        $hashes[$language] = $document['contentHash'];
    }

    return $hashes;
}

function public_school_artifact_path($docRoot, $language) {
    return dirname(rtrim($docRoot, '/\\')) . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR
        . 'school-knowledge-' . public_info_normalise_language($language) . '.json';
}

function public_school_load_document($docRoot, $language, &$conn = null) {
    $language = public_info_normalise_language($language);
    $artifactPath = public_school_artifact_path($docRoot, $language);

    if (is_file($artifactPath)) {
        $raw = @file_get_contents($artifactPath);
        $decoded = $raw === false ? null : json_decode($raw, true);

        if (is_array($decoded) && (int)($decoded['schemaVersion'] ?? 0) === PUBLIC_INFO_SCHEMA_VERSION) {
            return [$decoded, 'artifact'];
        }
    }

    if (!($conn instanceof mysqli)) {
        $dbConfig = require dirname(rtrim($docRoot, '/\\')) . '/configs/dbConfig.php';
        $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

        if ($conn->connect_error) {
            return [null, 'unavailable'];
        }

        $conn->set_charset("utf8mb4");
    }

    return [public_school_document($conn, $language), 'live'];
}

function public_school_content_hash($document) {
    $hashable = $document;
    unset($hashable['generatedAt'], $hashable['contentHash']);

    return substr(hash('sha256', json_encode($hashable, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)), 0, 32);
}
