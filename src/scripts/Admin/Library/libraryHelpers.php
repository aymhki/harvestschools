<?php

require_once __DIR__ . '/../../Public/Library/libraryCategories.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicSchoolInfoHelpers.php';


function library_error($message, $code = 400) {
    return ["success" => false, "message" => $message, "code" => $code];
}

function library_trim($value, $limit) {
    return mb_substr(trim((string)($value ?? '')), 0, $limit);
}

function library_yes_no_to_int($value) {
    return in_array(strtolower(trim((string)$value)), ['yes', '1', 'true'], true) ? 1 : 0;
}

function library_int_to_yes_no($value) {
    return ((int)$value) === 1 ? 'Yes' : 'No';
}


function library_resequence($conn, $categoryKey) {
    $stmt = $conn->prepare(
        "SELECT id FROM library_books WHERE category_key = ? ORDER BY title_en ASC, id ASC"
    );
    $stmt->bind_param("s", $categoryKey);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $ids = [];

    while ($row = $result->fetch_assoc()) {
        $ids[] = (int)$row['id'];
    }

    $stmt = $conn->prepare("UPDATE library_books SET sort_order = ? WHERE id = ?");

    foreach ($ids as $position => $bookId) {
        $sortOrder = $position + 1;
        $stmt->bind_param("ii", $sortOrder, $bookId);
        $stmt->execute();
    }

    $stmt->close();
}

function library_category_for_book($conn, $bookId) {
    $stmt = $conn->prepare("SELECT category_key FROM library_books WHERE id = ?");
    $stmt->bind_param("i", $bookId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ? (string)$row['category_key'] : '';
}

function library_validate_book($data) {
    $categoryKey = library_trim($data['category_key'] ?? '', 40);

    if (!library_category_exists($categoryKey)) {
        return library_error("Please choose a library category.");
    }

    $titleEn = library_trim($data['title_en'] ?? '', 255);
    $titleAr = library_trim($data['title_ar'] ?? '', 255);

    if ($titleEn === '' || $titleAr === '') {
        return library_error("The book title is required in both English and Arabic.");
    }

    return [
        "success" => true,
        "book"    => [
            'category_key' => $categoryKey,
            'title_en'     => $titleEn,
            'title_ar'     => $titleAr,
            'series_en'    => library_trim($data['series_en'] ?? '', 255),
            'series_ar'    => library_trim($data['series_ar'] ?? '', 255),
            'is_public'    => library_yes_no_to_int($data['is_public'] ?? 'Yes'),
        ]
    ];
}


function library_refresh_assistant_knowledge($conn, $docRoot) {
    try {
        public_school_write_artifacts($conn, $docRoot);

        return null;
    } catch (Throwable $e) {
        return ' The library pages are updated, but the Siri and Gemini knowledge files could not be '
            . 'refreshed: ' . $e->getMessage();
    }
}
