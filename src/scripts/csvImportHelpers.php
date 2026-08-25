<?php

const CSV_IMPORT_MAX_ROWS = 500;
const CSV_IMPORT_MAX_BYTES = 2097152;


function csv_import_failure($message) {
    return ["success" => false, "message" => $message, "code" => 400];
}


function csv_import_labels($descriptor) {
    $labels = [];

    foreach ($descriptor as $spec) {
        $labels[] = $spec['label'];
    }

    return $labels;
}


function csv_import_example_row($descriptor) {
    $values = [];

    foreach ($descriptor as $spec) {
        $values[] = (string)($spec['example'] ?? '');
    }

    return $values;
}


function csv_import_normalise_header($value) {
    return strtolower(preg_replace('/\s+/u', ' ', trim((string)$value)));
}


function csv_import_rows($rawCsv) {
    $stream = fopen('php://memory', 'r+');

    if ($stream === false) {
        return null;
    }

    fwrite($stream, preg_replace('/^\xEF\xBB\xBF/', '', (string)$rawCsv));
    rewind($stream);

    $rows = [];

    while (($row = fgetcsv($stream, 0, ',', '"', '\\')) !== false) {
        if ($row === [null] || (count($row) === 1 && trim((string)$row[0]) === '')) {
            continue;
        }

        $rows[] = $row;
    }

    fclose($stream);

    return $rows;
}


function csv_import_value_problem($spec, $value) {
    if ($value === '') {
        return empty($spec['required']) ? null : 'this column is required but was left empty';
    }

    $type = $spec['type'] ?? 'text';

    if ($type === 'enum') {
        $allowed = $spec['values'] ?? [];

        foreach ($allowed as $option) {
            if (strcasecmp($option, $value) === 0) {
                return null;
            }
        }

        return 'must be one of: ' . implode(' / ', $allowed);
    }

    if ($type === 'number' && !is_numeric($value)) {
        return 'must be a number';
    }

    if ($type === 'date') {
        $parsed = DateTime::createFromFormat('Y-m-d', $value);

        if (!$parsed || $parsed->format('Y-m-d') !== $value) {
            return 'must be a date written as YYYY-MM-DD';
        }
    }

    return null;
}


function csv_import_read($rawCsv, $descriptor) {
    if (strlen((string)$rawCsv) > CSV_IMPORT_MAX_BYTES) {
        return csv_import_failure('That file is larger than ' . round(CSV_IMPORT_MAX_BYTES / 1048576, 1) . 'MB. Please split it into smaller files.');
    }

    $rows = csv_import_rows($rawCsv);

    if ($rows === null || count($rows) < 2) {
        return csv_import_failure('The file needs a header line naming the columns, and at least one row of data below it.');
    }

    $headerRow = array_shift($rows);
    $given = array_map('csv_import_normalise_header', $headerRow);

    $positions = [];
    $missing = [];

    foreach ($descriptor as $key => $spec) {
        $position = array_search(csv_import_normalise_header($spec['label']), $given, true);

        if ($position === false) {
            if (!empty($spec['required'])) {
                $missing[] = $spec['label'];
            }

            continue;
        }

        $positions[$key] = $position;
    }

    if ($missing !== []) {
        return csv_import_failure(
            'The file is missing these required columns: ' . implode(', ', $missing)
            . '. Download the template to get a file with the right headers.'
        );
    }

    $known = [];

    foreach ($descriptor as $spec) {
        $known[] = csv_import_normalise_header($spec['label']);
    }

    $warnings = [];

    foreach ($headerRow as $index => $label) {
        $normalised = $given[$index] ?? '';

        if ($normalised !== '' && !in_array($normalised, $known, true)) {
            $warnings[] = 'The column "' . trim((string)$label) . '" is not used by this import and was ignored.';
        }
    }

    if (count($rows) > CSV_IMPORT_MAX_ROWS) {
        return csv_import_failure('The file has ' . count($rows) . ' rows. Please split it into files of at most ' . CSV_IMPORT_MAX_ROWS . ' rows.');
    }

    $parsed = [];
    $failed = [];

    foreach ($rows as $rowIndex => $row) {
        $line = $rowIndex + 2;
        $values = [];

        foreach ($descriptor as $key => $spec) {
            $position = $positions[$key] ?? null;
            $value = $position === null ? '' : trim((string)($row[$position] ?? ''));
            $problem = csv_import_value_problem($spec, $value);

            if ($problem !== null) {
                $failed[] = [
                    'row'     => $line,
                    'column'  => $spec['label'],
                    'message' => $problem,
                    'example' => (string)($spec['example'] ?? ''),
                ];

                continue;
            }

            $values[$key] = $value;
        }

        $parsed[] = ['line' => $line, 'values' => $values];
    }

    return [
        'success'  => true,
        'rows'     => $parsed,
        'failed'   => $failed,
        'warnings' => $warnings,
    ];
}


function csv_import_row_failure($line, $descriptor, $fieldKey, $message) {
    $spec = $fieldKey !== null && isset($descriptor[$fieldKey]) ? $descriptor[$fieldKey] : null;

    return [
        'row'     => $line,
        'column'  => $spec === null ? '' : $spec['label'],
        'message' => $message,
        'example' => $spec === null ? '' : (string)($spec['example'] ?? ''),
    ];
}


function csv_import_uploaded_file($fieldName = 'file') {
    if (!isset($_FILES[$fieldName]) || !is_array($_FILES[$fieldName])) {
        return ['ok' => false, 'message' => 'No file was uploaded.'];
    }

    $file = $_FILES[$fieldName];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'message' => 'The file did not upload correctly. Please try again.'];
    }

    if ((int)($file['size'] ?? 0) > CSV_IMPORT_MAX_BYTES) {
        return ['ok' => false, 'message' => 'That file is larger than ' . round(CSV_IMPORT_MAX_BYTES / 1048576, 1) . 'MB.'];
    }

    if (!is_uploaded_file($file['tmp_name'] ?? '')) {
        return ['ok' => false, 'message' => 'The upload could not be read.'];
    }

    $contents = file_get_contents($file['tmp_name']);

    if ($contents === false) {
        return ['ok' => false, 'message' => 'The upload could not be read.'];
    }

    return ['ok' => true, 'contents' => $contents];
}
