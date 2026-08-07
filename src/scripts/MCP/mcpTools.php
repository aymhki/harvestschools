<?php


const MCP_CALENDAR_IDS = ['national', 'british', 'american', 'national-kg', 'british-kg', 'american-kg'];
const MCP_DEPARTMENT_KEYS = ['reception', 'student_affairs', 'accounting', 'admissions', 'early', 'national', 'british', 'american'];
const MCP_PAGE_SECTIONS = ['general', 'admission', 'academics', 'students-life', 'events', 'gallery'];
const MCP_STAFF_DEPARTMENT_KEYS = ['national', 'british', 'american', 'kindergarten'];
const MCP_LIBRARY_COLLECTIONS = ['english', 'arabic'];
const MCP_LIBRARY_CATEGORY_KEYS = [
    'english-fairy-tales', 'english-drama', 'english-levels', 'english-general',
    'arabic-information', 'arabic-general', 'arabic-religion', 'arabic-stories',
];

function mcp_language_property(): array {
    return ['type' => 'string', 'enum' => ['en', 'ar'], 'default' => 'en', 'description' => 'Response language.'];
}

function mcp_department_property(): array {
    return ['type' => 'string', 'enum' => MCP_DEPARTMENT_KEYS, 'description' => 'Optional department filter.'];
}

function mcp_tool_schemas(): array {
    return [
        'get_school_info' => [
            'title' => 'Get school information',
            'description' => 'Answers a general question about Harvest International Schools from its published facts - '
                . 'address, opening hours, admission requirements, discounts, accreditations, transport and similar. '
                . 'An empty result means the school has not published an answer; say so rather than guessing.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'query'    => ['type' => 'string', 'description' => "The question in the user's own words."],
                    'language' => mcp_language_property(),
                ],
                'required' => ['query'],
            ],
        ],
        'get_tuition_fees' => [
            'title' => 'Get tuition fees',
            'description' => 'Returns published annual tuition fees in Egyptian Pounds (EGP). When isTuitionPublished '
                . 'is false the fee is NOT available - never present null as a price; refer the user to the admissions '
                . 'department instead.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'department' => mcp_department_property(),
                    'stage'      => ['type' => 'string', 'description' => 'Optional stage name filter, for example "Grade 5".'],
                    'language'   => mcp_language_property(),
                ],
            ],
        ],
        'get_stages_offered' => [
            'title' => 'Get stages offered',
            'description' => 'Lists the school\'s stages with their minimum registration ages. Students must meet the '
                . 'minimum age by October 1st. Every stage listed here carries isOffered: true, meaning the school '
                . 'publishes it and accepts students into it. A stage missing from this list is one the school does '
                . 'not publish, so say it is not available rather than guessing at its age or its fee.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'department' => mcp_department_property(),
                    'language'   => mcp_language_property(),
                ],
            ],
        ],
        'get_school_contacts' => [
            'title' => 'Get school contacts',
            'description' => 'Returns the school profile and department contact directory. Send fee questions to '
                . '"accounting" and application questions to "admissions".',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'department' => mcp_department_property(),
                    'language'   => mcp_language_property(),
                ],
            ],
        ],
        'find_academic_events' => [
            'title' => 'Find academic events',
            'description' => 'Searches the six school academic calendars. Dates in the result are epoch milliseconds in '
                . 'UTC. An empty result means nothing matched - do not invent dates.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'query'    => ['type' => 'string', 'description' => 'Optional text matched against event titles.'],
                    'division' => ['type' => 'string', 'enum' => MCP_CALENDAR_IDS, 'description' => 'Optional calendar filter.'],
                    'fromDate' => ['type' => 'string', 'description' => 'Optional lower bound as an ISO-8601 date, for example "2026-09-01".'],
                    'toDate'   => ['type' => 'string', 'description' => 'Optional upper bound as an ISO-8601 date.'],
                    'language' => mcp_language_property(),
                ],
            ],
        ],
        'get_next_event' => [
            'title' => 'Get the next school event',
            'description' => 'Returns the soonest upcoming event, optionally restricted to one calendar. Null when '
                . 'nothing is upcoming.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'division' => ['type' => 'string', 'enum' => MCP_CALENDAR_IDS, 'description' => 'Optional calendar filter.'],
                    'language' => mcp_language_property(),
                ],
            ],
        ],
        'get_school_staff' => [
            'title' => 'Get school staff',
            'description' => 'Lists the teachers, coordinators and heads the school publishes for one of its four '
                . 'staff pages. Each person carries the subject they teach where there is one, and their academic '
                . 'degree where the school has published it. People who serve the whole school appear under every '
                . 'department. Only published staff are here, so an empty result means the school has not published '
                . 'that list - never guess a name or a qualification.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'department' => [
                        'type' => 'string',
                        'enum' => MCP_STAFF_DEPARTMENT_KEYS,
                        'description' => 'Which staff page to read. Empty returns every department.',
                    ],
                    'query'    => ['type' => 'string', 'description' => 'Optional text matched against names, positions, subjects and degrees.'],
                    'language' => mcp_language_property(),
                ],
            ],
        ],
        'get_library_books' => [
            'title' => 'Get school library books',
            'description' => 'Searches the books the school library lends to students. The school keeps an English '
                . 'library and an Arabic library, each split into categories. Every book is listed in both languages, '
                . 'so an Arabic title and an English title can be the same book. Leaving every filter empty returns '
                . 'the whole catalogue, which is long - prefer a query or a category. An empty result means the '
                . 'library does not lend that book; never invent a title, an author or a series.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'query'      => ['type' => 'string', 'description' => 'Optional text matched against book titles and their series or publisher.'],
                    'category'   => [
                        'type' => 'string',
                        'enum' => MCP_LIBRARY_CATEGORY_KEYS,
                        'description' => 'Optional category filter, e.g. arabic-stories for the Arabic story shelf.',
                    ],
                    'collection' => [
                        'type' => 'string',
                        'enum' => MCP_LIBRARY_COLLECTIONS,
                        'description' => 'Optional filter for which of the two libraries the book physically sits in.',
                    ],
                    'limit'      => ['type' => 'integer', 'minimum' => 1, 'maximum' => 200, 'default' => 50,
                        'description' => 'How many books to return per category.'],
                    'language'   => mcp_language_property(),
                ],
            ],
        ],
        'list_pages' => [
            'title' => 'List school pages',
            'description' => 'Lists public pages of the Harvest Schools website and app, with their route paths. '
                . 'Administrative, alumni and booking areas are deliberately absent.',
            'inputSchema' => [
                'type' => 'object',
                'properties' => [
                    'section'  => ['type' => 'string', 'enum' => MCP_PAGE_SECTIONS, 'description' => 'Optional section filter.'],
                    'language' => mcp_language_property(),
                ],
            ],
        ],
    ];
}

function mcp_knowledge(string $language): ?array {
    static $documents = [];

    $language = public_info_normalise_language($language);

    if (array_key_exists($language, $documents)) {
        return $documents[$language];
    }

    $connection = mcp_database_connection();
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    list($document) = public_school_load_document($docRoot, $language, $connection);

    $documents[$language] = $document;

    return $document;
}

function mcp_stage_view(array $stage, string $currency): array {
    $fees = $stage['tuitionFees'] ?? null;

    return [
        'key'                => $stage['key'] ?? '',
        'name'               => $stage['name'] ?? '',
        'departmentKey'      => $stage['departmentKey'] ?? '',
        'departmentName'     => $stage['departmentName'] ?? '',
        'sectionTitle'       => $stage['sectionTitle'] ?? '',
        'isOffered'          => (bool)($stage['isOffered'] ?? true),
        'minimumAge'         => $stage['minimumAge'] ?? null,
        'tuitionFees'        => $fees,
        'tuitionCurrency'    => $fees === null ? null : $currency,
        'isTuitionPublished' => $fees !== null,
        'routePath'          => $stage['routePath'] ?? null,
    ];
}

function mcp_select_stages(array $knowledge, string $department, string $stage): array {
    $currency = $knowledge['school']['currency'] ?? 'EGP';
    $needle = mb_strtolower(trim($stage));
    $selected = [];

    foreach (($knowledge['stages'] ?? []) as $entry) {
        if ($department !== '' && ($entry['departmentKey'] ?? '') !== $department) {
            continue;
        }

        if ($needle !== '' && mb_strpos(mb_strtolower((string)($entry['name'] ?? '')), $needle) === false) {
            continue;
        }

        $selected[] = mcp_stage_view($entry, $currency);
    }

    return ['tuitionCurrency' => $currency, 'stages' => $selected];
}

function mcp_encode(array $payload): string {
    return json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}

const MCP_STOPWORDS = [
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had',
    'what', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'can', 'could',
    'would', 'should', 'of', 'in', 'on', 'at', 'for', 'to', 'and', 'or', 'any', 'there',
    'your', 'you', 'my', 'me', 'we', 'us', 'it', 'its', 'about', 'tell', 'please', 'school',
    'schools', 'harvest', 'هل', 'ما', 'ماذا', 'من', 'في', 'على', 'عن', 'هي', 'هو', 'المدرسة',
    'مدرسة', 'يوجد', 'لديكم', 'كم',
];

function mcp_search_terms(string $query): array {
    $terms = array_filter(preg_split('/[\s,.\?!]+/u', mb_strtolower(trim($query))));
    $meaningful = array_values(array_filter($terms, static fn($t) => mb_strlen($t) > 1 && !in_array($t, MCP_STOPWORDS, true)));

    return $meaningful === [] ? array_values($terms) : $meaningful;
}

function mcp_tokenise(string $text): array {
    $tokens = preg_split('/[^\p{L}\p{N}]+/u', mb_strtolower($text), -1, PREG_SPLIT_NO_EMPTY);

    return $tokens === false ? [] : $tokens;
}

function mcp_term_matches(string $term, array $tokens): bool {
    foreach ($tokens as $token) {
        if ($token === $term) {
            return true;
        }

        if (mb_strlen($term) >= 4 && mb_strlen($token) >= 4) {
            $shorter = mb_strlen($term) < mb_strlen($token) ? $term : $token;
            $longer = $shorter === $term ? $token : $term;

            if (mb_strlen($longer) - mb_strlen($shorter) <= 2 && mb_strpos($longer, $shorter) === 0) {
                return true;
            }
        }
    }

    return false;
}

function mcp_score_fact(array $fact, array $terms): int {
    static $cache = [];

    $id = (string)($fact['id'] ?? '');

    if (!isset($cache[$id])) {
        $cache[$id] = [
            'topic'    => mcp_tokenise((string)($fact['topic'] ?? '')),
            'keywords' => mcp_tokenise(implode(' ', $fact['keywords'] ?? [])),
            'answer'   => mcp_tokenise((string)($fact['answer'] ?? '')),
        ];
    }

    $tokens = $cache[$id];
    $score = 0;

    foreach ($terms as $term) {
        $score += mcp_term_matches($term, $tokens['topic']) ? 6 : 0;
        $score += mcp_term_matches($term, $tokens['keywords']) ? 4 : 0;
        $score += mcp_term_matches($term, $tokens['answer']) ? 1 : 0;
    }

    return $score;
}

function mcp_tool_invoke(string $name, array $arguments): string {
    $language = public_info_normalise_language($arguments['language'] ?? 'en');
    $knowledge = mcp_knowledge($language);

    if ($knowledge === null) {
        return mcp_encode(['error' => 'School information is temporarily unavailable.']);
    }

    switch ($name) {
        case 'get_school_info':
            $query = trim((string)($arguments['query'] ?? ''));
            $terms = mcp_search_terms($query);
            $scored = [];

            foreach (($knowledge['facts'] ?? []) as $fact) {
                $score = mcp_score_fact($fact, $terms);

                if ($score > 0) {
                    $scored[] = ['score' => $score, 'fact' => [
                        'id'        => $fact['id'] ?? '',
                        'category'  => $fact['category'] ?? '',
                        'topic'     => $fact['topic'] ?? '',
                        'answer'    => $fact['answer'] ?? '',
                        'routePath' => $fact['routePath'] ?? null,
                        'source'    => $fact['source'] ?? '',
                        'sourceKey' => $fact['sourceKey'] ?? '',
                    ]];
                }
            }

            usort($scored, fn($first, $second) => $second['score'] <=> $first['score']);

            return mcp_encode([
                'query'    => $query,
                'language' => $language,
                'matches'  => array_column(array_slice($scored, 0, 5), 'fact'),
            ]);

        case 'get_tuition_fees':
            $result = mcp_select_stages($knowledge, (string)($arguments['department'] ?? ''), (string)($arguments['stage'] ?? ''));

            return mcp_encode([
                'language'        => $language,
                'tuitionCurrency' => $result['tuitionCurrency'],
                'stages'          => $result['stages'],
            ]);

        case 'get_stages_offered':
            // Whether unoffered stages are published is decided once, by the
            // SHOW_UNOFFERED_STAGES setting, when the document is built. Every
            // stage that reaches here is one the school publishes, so there is
            // nothing left to filter and nothing to hedge about.
            $result = mcp_select_stages($knowledge, (string)($arguments['department'] ?? ''), '');

            return mcp_encode(['language' => $language, 'stages' => $result['stages']]);

        case 'get_school_contacts':
            $department = (string)($arguments['department'] ?? '');
            $departments = [];

            foreach (($knowledge['departments'] ?? []) as $entry) {
                if ($department !== '' && ($entry['key'] ?? '') !== $department) {
                    continue;
                }

                $departments[] = $entry;
            }

            return mcp_encode([
                'language'    => $language,
                'school'      => $knowledge['school'] ?? null,
                'departments' => $departments,
            ]);

        case 'find_academic_events':
            $needle = mb_strtolower(trim((string)($arguments['query'] ?? '')));
            $division = (string)($arguments['division'] ?? '');
            $fromRaw = (string)($arguments['fromDate'] ?? '');
            $toRaw = (string)($arguments['toDate'] ?? '');
            $from = $fromRaw === '' ? null : strtotime($fromRaw . ' 00:00:00 UTC');
            $to = $toRaw === '' ? null : strtotime($toRaw . ' 23:59:59 UTC');
            $events = [];

            foreach (($knowledge['events'] ?? []) as $event) {
                if ($division !== '' && ($event['calendarId'] ?? '') !== $division) {
                    continue;
                }

                if ($needle !== '' && mb_strpos(mb_strtolower((string)($event['title'] ?? '')), $needle) === false) {
                    continue;
                }

                $start = (int)($event['startDate'] ?? 0);
                $end = (int)($event['endDate'] ?? $start);

                if ($from !== null && $from !== false && $end < $from * 1000) {
                    continue;
                }

                if ($to !== null && $to !== false && $start > $to * 1000) {
                    continue;
                }

                $events[] = $event;

                if (count($events) >= 25) {
                    break;
                }
            }

            return mcp_encode(['language' => $language, 'count' => count($events), 'events' => $events]);

        case 'get_next_event':
            $division = (string)($arguments['division'] ?? '');
            $now = (int)(microtime(true) * 1000);

            foreach (($knowledge['events'] ?? []) as $event) {
                if ($division !== '' && ($event['calendarId'] ?? '') !== $division) {
                    continue;
                }

                if ((int)($event['startDate'] ?? 0) >= $now) {
                    return mcp_encode(['language' => $language, 'event' => $event]);
                }
            }

            return mcp_encode(['language' => $language, 'event' => null]);

        case 'get_school_staff':
            $department = strtolower(trim((string)($arguments['department'] ?? '')));
            $needle = mb_strtolower(trim((string)($arguments['query'] ?? '')));
            $staff = [];

            foreach (($knowledge['staff'] ?? []) as $entry) {
                if ($department !== '' && ($entry['departmentKey'] ?? '') !== $department) {
                    continue;
                }

                if ($needle === '') {
                    $staff[] = $entry;
                    continue;
                }

                $matches = static function (array $person) use ($needle) {
                    foreach (['name', 'position', 'subject', 'degree'] as $field) {
                        if (mb_strpos(mb_strtolower((string)($person[$field] ?? '')), $needle) !== false) {
                            return true;
                        }
                    }

                    return false;
                };

                $highlights = array_values(array_filter($entry['highlights'] ?? [], $matches));
                $members = array_values(array_filter($entry['members'] ?? [], $matches));

                if ($highlights === [] && $members === []) {
                    continue;
                }

                $entry['highlights'] = $highlights;
                $entry['members'] = $members;
                $entry['memberCount'] = count($highlights) + count($members);
                $staff[] = $entry;
            }

            return mcp_encode(['language' => $language, 'staff' => $staff]);

        case 'get_library_books':
            $needle = mb_strtolower(trim((string)($arguments['query'] ?? '')));
            $category = trim((string)($arguments['category'] ?? ''));
            $collection = trim((string)($arguments['collection'] ?? ''));
            $limit = (int)($arguments['limit'] ?? 50);
            $limit = max(1, min(200, $limit ?: 50));
            $library = [];

            foreach (($knowledge['library'] ?? []) as $entry) {
                if ($category !== '' && ($entry['categoryKey'] ?? '') !== $category) {
                    continue;
                }

                if ($collection !== '' && ($entry['collection'] ?? '') !== $collection) {
                    continue;
                }

                $books = $entry['books'] ?? [];

                if ($needle !== '') {
                    $books = array_values(array_filter($books, static function (array $book) use ($needle) {
                        foreach (['title', 'series'] as $field) {
                            if (mb_strpos(mb_strtolower((string)($book[$field] ?? '')), $needle) !== false) {
                                return true;
                            }
                        }

                        return false;
                    }));

                    if ($books === []) {
                        continue;
                    }
                }

                // bookCount stays the true size of the shelf so the assistant can
                // say "showing 50 of 177" rather than claiming the shelf is small.
                $entry['bookCount'] = count($books);
                $entry['books'] = array_slice($books, 0, $limit);
                $entry['isTruncated'] = count($books) > $limit;
                $library[] = $entry;
            }

            return mcp_encode(['language' => $language, 'library' => $library]);

        case 'list_pages':
            $section = (string)($arguments['section'] ?? '');
            $pages = [];

            foreach (($knowledge['pages'] ?? []) as $page) {
                if ($section !== '' && ($page['section'] ?? '') !== $section) {
                    continue;
                }

                $pages[] = $page;
            }

            return mcp_encode(['language' => $language, 'pages' => $pages]);
    }

    return mcp_encode(['error' => 'Unknown tool: ' . $name]);
}
