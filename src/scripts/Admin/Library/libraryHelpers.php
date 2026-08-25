<?php

require_once __DIR__ . '/../../Public/Library/libraryCategories.php';
require_once __DIR__ . '/../../Public/SchoolInfo/publicSchoolInfoHelpers.php';


function library_error($message, $code = 400, $field = null) {
    return ["success" => false, "message" => $message, "code" => $code, "field" => $field];
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
        return library_error("Please choose a library category.", 400, 'category_key');
    }

    $titleEn = library_trim($data['title_en'] ?? '', 255);
    $titleAr = library_trim($data['title_ar'] ?? '', 255);

    if ($titleEn === '' || $titleAr === '') {
        return library_error("The book title is required in both English and Arabic.", 400, 'title_en');
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


function library_insert_book($conn, $book) {
    $stmt = $conn->prepare(
        "INSERT INTO library_books (category_key, sort_order, title_en, title_ar, series_en, series_ar, is_public)
         VALUES (?, 0, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sssssi", $book["category_key"], $book["title_en"], $book["title_ar"], $book["series_en"], $book["series_ar"], $book["is_public"]);
    $stmt->execute();
    $stmt->close();
}


function library_import_descriptor() {
    return [
        'title_en'  => ['required' => true,  'type' => 'text', 'label' => 'Title (EN)',     'example' => "Charlotte's Web"],
        'title_ar'  => ['required' => true,  'type' => 'text', 'label' => 'Title (AR)',     'example' => 'شبكة تشارلوت'],
        'series_en' => ['required' => false, 'type' => 'text', 'label' => 'Series (EN)',    'example' => 'E. B. White'],
        'series_ar' => ['required' => false, 'type' => 'text', 'label' => 'Series (AR)',    'example' => 'إ. ب. وايت'],
        'is_public' => ['required' => false, 'type' => 'enum', 'label' => 'Shown Publicly', 'example' => 'Yes', 'values' => ['Yes', 'No']],
    ];
}


function library_import_authorise($conn) {
    global $LIBRARY_MANAGEMENT;

    return check_admin_user_permission($conn, $LIBRARY_MANAGEMENT);
}


function library_add_books($conn, array $rows, array $context = []) {
    $descriptor = library_import_descriptor();
    $categoryKey = library_trim($context['category_key'] ?? '', 40);
    $failed = [];
    $books = [];

    foreach ($rows as $index => $row) {
        $line = $row['line'] ?? ($index + 2);
        $values = array_key_exists('values', $row) ? $row['values'] : $row;

        if ($categoryKey !== '') {
            $values['category_key'] = $categoryKey;
        }

        $validation = library_validate_book($values);

        if (!$validation['success']) {
            $failed[] = csv_import_row_failure($line, $descriptor, $validation['field'] ?? null, $validation['message']);
            continue;
        }

        $books[] = $validation['book'];
    }

    if ($failed !== []) {
        return ['ok' => 0, 'failed' => $failed];
    }

    $conn->begin_transaction();

    try {
        foreach ($books as $book) {
            library_insert_book($conn, $book);
        }

        $conn->commit();
    } catch (Throwable $insertError) {
        $conn->rollback();

        throw $insertError;
    }

    $categories = [];

    foreach ($books as $book) {
        $categories[$book['category_key']] = true;
    }

    foreach (array_keys($categories) as $key) {
        library_resequence($conn, $key);
    }

    return ['ok' => count($books), 'failed' => []];
}


