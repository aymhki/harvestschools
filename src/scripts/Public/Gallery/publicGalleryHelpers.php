<?php

const PUBLIC_GALLERY_SCHEMA_VERSION = 1;

const PUBLIC_GALLERY_SECTIONS = ['photos', 'videos', 'all'];


function public_gallery_section_exists($section) {
    return in_array($section, PUBLIC_GALLERY_SECTIONS, true);
}


function public_gallery_alt_text($fileName) {
    return (string)pathinfo($fileName, PATHINFO_FILENAME);
}


function public_gallery_collages($conn, $language) {
    $isArabic = $language === 'ar';

    $stmt = $conn->prepare(
        "SELECT c.id, c.folder_name, c.title_en, c.title_ar, c.layout,
                p.file_name,
                UNIX_TIMESTAMP(GREATEST(c.updated_at, COALESCE(p.updated_at, c.updated_at))) AS updated_at
         FROM gallery_collages c
         LEFT JOIN gallery_photos p ON p.collage_id = c.id
         WHERE c.is_public = 1
         ORDER BY c.sort_order ASC, c.id ASC, p.sort_order ASC, p.id ASC"
    );

    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $collages = [];
    $lastUpdated = 0;

    while ($row = $result->fetch_assoc()) {
        $collageId = (int)$row['id'];
        $lastUpdated = max($lastUpdated, (int)$row['updated_at']);

        if (!isset($collages[$collageId])) {
            $collages[$collageId] = [
                'id'     => $collageId,
                'title'  => (string)($isArabic ? $row['title_ar'] : $row['title_en']),
                'layout' => (string)$row['layout'],
                'photos' => [],
            ];
        }

        if ($row['file_name'] === null) {
            continue;
        }

        $collages[$collageId]['photos'][] = [
            'path' => 'photos/' . $row['folder_name'] . '/' . $row['file_name'],
            'alt'  => public_gallery_alt_text($row['file_name']),
        ];
    }

    $collages = array_values(array_filter($collages, static function ($collage) {
        return $collage['photos'] !== [];
    }));

    return ['collages' => $collages, 'lastUpdated' => $lastUpdated];
}


function public_gallery_videos($conn, $language) {
    $isArabic = $language === 'ar';

    $stmt = $conn->prepare(
        "SELECT id, title_en, title_ar, file_name, thumbnail_at, duration_seconds,
                UNIX_TIMESTAMP(updated_at) AS updated_at
         FROM gallery_videos
         WHERE is_public = 1 AND status = 'ready'
         ORDER BY sort_order ASC, id ASC"
    );

    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $videos = [];
    $lastUpdated = 0;

    while ($row = $result->fetch_assoc()) {
        $lastUpdated = max($lastUpdated, (int)$row['updated_at']);

        $videos[] = [
            'id'              => (int)$row['id'],
            'title'           => (string)($isArabic ? $row['title_ar'] : $row['title_en']),
            'path'            => 'videos/' . $row['file_name'],
            'thumbnailAt'     => (float)$row['thumbnail_at'],
            'durationSeconds' => $row['duration_seconds'] === null ? null : (float)$row['duration_seconds'],
        ];
    }

    return ['videos' => $videos, 'lastUpdated' => $lastUpdated];
}


function public_gallery_document($conn, $language, $section) {
    $document = [
        'schemaVersion' => PUBLIC_GALLERY_SCHEMA_VERSION,
        'language'      => $language,
        'section'       => $section,
        'collages'      => [],
        'videos'        => [],
        'lastUpdated'   => 0,
    ];

    if ($section === 'photos' || $section === 'all') {
        $photos = public_gallery_collages($conn, $language);

        $document['collages'] = $photos['collages'];
        $document['lastUpdated'] = max($document['lastUpdated'], $photos['lastUpdated']);
    }

    if ($section === 'videos' || $section === 'all') {
        $videos = public_gallery_videos($conn, $language);

        $document['videos'] = $videos['videos'];
        $document['lastUpdated'] = max($document['lastUpdated'], $videos['lastUpdated']);
    }

    $document['contentHash'] = hash('sha256', json_encode($document, JSON_UNESCAPED_UNICODE));

    return $document;
}
