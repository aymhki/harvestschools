<?php

require_once __DIR__ . '/libraryCategories.php';

const PUBLIC_LIBRARY_SCHEMA_VERSION = 1;

function public_library_books($conn, $categoryKey, $language) {
    $isArabic = $language === 'ar';

    $stmt = $conn->prepare(
        "SELECT title_en, title_ar, series_en, series_ar, sort_order,
                UNIX_TIMESTAMP(updated_at) AS updated_at
         FROM library_books
         WHERE category_key = ? AND is_public = 1
         ORDER BY sort_order ASC, title_en ASC"
    );

    $stmt->bind_param("s", $categoryKey);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $books = [];
    $lastUpdated = 0;

    while ($row = $result->fetch_assoc()) {
        $lastUpdated = max($lastUpdated, (int)$row['updated_at']);

        $books[] = [
            'title'  => (string)($isArabic ? $row['title_ar'] : $row['title_en']),
            'series' => (string)($isArabic ? $row['series_ar'] : $row['series_en']),
        ];
    }

    return ['books' => $books, 'lastUpdated' => $lastUpdated];
}

function public_library_document($conn, $categoryKey, $language) {
    $collection = library_collection_of($categoryKey);
    $result = public_library_books($conn, $categoryKey, $language);

    $document = [
        'schemaVersion' => PUBLIC_LIBRARY_SCHEMA_VERSION,
        'language'      => $language,
        'category'      => [
            'key'             => $categoryKey,
            'label'           => library_category_label($categoryKey, $language),
            'collection'      => $collection,
            'collectionLabel' => library_collection_label($collection, $language),
            'routePath'       => library_category_path($categoryKey),
        ],
        'books'         => $result['books'],
        'lastUpdated'   => $result['lastUpdated'],
    ];

    $document['contentHash'] = hash('sha256', json_encode($document, JSON_UNESCAPED_UNICODE));

    return $document;
}

function public_library_catalogue($conn, $language) {
    $catalogue = [];

    foreach (library_category_keys() as $categoryKey) {
        $result = public_library_books($conn, $categoryKey, $language);

        if ($result['books'] === []) {
            continue;
        }

        $collection = library_collection_of($categoryKey);

        $catalogue[] = [
            'categoryKey'     => $categoryKey,
            'categoryName'    => library_category_label($categoryKey, $language),
            'collection'      => $collection,
            'collectionName'  => library_collection_label($collection, $language),
            'routePath'       => library_category_path($categoryKey),
            'bookCount'       => count($result['books']),
            'books'           => $result['books'],
            'lastUpdated'     => $result['lastUpdated'],
        ];
    }

    return $catalogue;
}
