<?php
require_once '../../headers.php';
require_once '../../alumniAuthHelpers.php';
set_cors_headers();

function send_alumni_file_error(string $message, int $code = 500): void {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => $message, 'code' => $code]);
    exit;
}

try {
    $filePathFromGet = isset($_GET['file']) ? (string)$_GET['file'] : '';

    if ($filePathFromGet === '') {
        send_alumni_file_error("Missing required file parameter.", 400);
    }

    $cleanPath = alumni_sanitize_relative_path($filePathFromGet);

    if ($cleanPath === null || $cleanPath === '') {
        send_alumni_file_error("Invalid file path.", 400);
    }

    $extension = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'];

    if (!in_array($extension, $allowedExtensions, true)) {
        send_alumni_file_error("Only image files can be served.", 403);
    }

    $basePathRealpath = realpath(alumni_uploads_base_dir());

    if ($basePathRealpath === false) {
        send_alumni_file_error("Internal Server Configuration Error: The alumni uploads directory does not exist.", 500);
    }

    $fullFilePath = $basePathRealpath . DIRECTORY_SEPARATOR . $cleanPath;

    if (!is_file($fullFilePath) || strpos(realpath($fullFilePath), $basePathRealpath) !== 0) {
        send_alumni_file_error("File not found or access denied.", 404);
    }

    if (!is_readable($fullFilePath)) {
        send_alumni_file_error("File is not readable.", 403);
    }

    if (ob_get_level() > 0) { ob_end_clean(); }

    $filenameForBrowser = basename($fullFilePath);
    $asciiFilename = preg_replace('/[^\x20-\x7E]/', '', $filenameForBrowser);
    $utf8Filename = rawurlencode($filenameForBrowser);
    $mimeType = $extension === 'svg' ? 'image/svg+xml' : mime_content_type($fullFilePath);

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($fullFilePath));
    header('Content-Disposition: inline; filename="' . $asciiFilename . '"; filename*=UTF-8\'\'' . $utf8Filename);
    header('Cache-Control: public, max-age=86400');

    readfile($fullFilePath);
    exit;

} catch (Throwable $e) {
    send_alumni_file_error($e->getMessage(), $e->getCode() ?: 500);
}
