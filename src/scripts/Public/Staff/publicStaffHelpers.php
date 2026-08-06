<?php

require_once __DIR__ . '/staffDepartments.php';

const PUBLIC_STAFF_SCHEMA_VERSION = 1;


function public_staff_members($conn, $departmentKey, $language) {
    $isArabic = $language === 'ar';

    $stmt = $conn->prepare(
        "SELECT name_en, name_ar, position_en, position_ar, subject_en, subject_ar,
                display_style, sort_order,
                UNIX_TIMESTAMP(updated_at) AS updated_at
         FROM staff_employees
         WHERE is_public = 1
           AND (departments = 'all' OR FIND_IN_SET(?, departments))
         ORDER BY sort_order ASC, name_en ASC"
    );

    $stmt->bind_param("s", $departmentKey);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $highlights = [];
    $members = [];
    $lastUpdated = 0;

    while ($row = $result->fetch_assoc()) {
        $lastUpdated = max($lastUpdated, (int)$row['updated_at']);

        $entry = [
            'name'     => (string)($isArabic ? $row['name_ar'] : $row['name_en']),
            'position' => (string)($isArabic ? $row['position_ar'] : $row['position_en']),
            'subject'  => (string)($isArabic ? $row['subject_ar'] : $row['subject_en']),
        ];

        if ($row['display_style'] === 'highlight') {
            $highlights[] = ['position' => $entry['position'], 'name' => $entry['name']];
            continue;
        }

        $members[] = $entry;
    }

    return ['highlights' => $highlights, 'members' => $members, 'lastUpdated' => $lastUpdated];
}


function public_staff_document($conn, $departmentKey, $language) {
    $staff = public_staff_members($conn, $departmentKey, $language);

    $document = [
        'schemaVersion' => PUBLIC_STAFF_SCHEMA_VERSION,
        'language'      => $language,
        'department'    => [
            'key'  => $departmentKey,
            'name' => staff_department_name($departmentKey, $language),
        ],
        'highlights'    => $staff['highlights'],
        'members'       => $staff['members'],
        'lastUpdated'   => $staff['lastUpdated'],
    ];

    $document['contentHash'] = hash('sha256', json_encode($document, JSON_UNESCAPED_UNICODE));

    return $document;
}

function public_staff_directory($conn, $language) {
    $directory = [];

    foreach (staff_department_keys() as $departmentKey) {
        $staff = public_staff_members($conn, $departmentKey, $language);

        if ($staff['highlights'] === [] && $staff['members'] === []) {
            continue;
        }

        $directory[] = [
            'departmentKey'  => $departmentKey,
            'departmentName' => staff_department_name($departmentKey, $language),
            'routePath'      => '/academics/staff/' . $departmentKey . '-staff',
            'highlights'     => $staff['highlights'],
            'members'        => $staff['members'],
            'memberCount'    => count($staff['members']) + count($staff['highlights']),
            'lastUpdated'    => $staff['lastUpdated'],
        ];
    }

    return $directory;
}
