<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once '../../Alumni/alumniAuthHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

function sendErrorResponse(string $message, int $code = 500): void {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'message' => $message,
        'code' => $code
    ]);
    exit;
}

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $ALUMNI_STUDENTS_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $ALUMNI_STUDENTS_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $file_path_from_get = isset($_GET['file']) ? $_GET['file'] : null;

    if (!$file_path_from_get) {
        throw new Exception("Missing required parameters.", 400);
    }

    $clean_path = alumni_sanitize_relative_path($file_path_from_get);

    if ($clean_path === null || $clean_path === '') {
        throw new Exception("Invalid file path (directory traversal detected).", 400);
    }

    $base_path_realpath = realpath(alumni_uploads_base_dir());
    if ($base_path_realpath === false) {
        throw new Exception("Internal Server Configuration Error: The alumni uploads directory does not exist.", 500);
    }

    $full_file_path = $base_path_realpath . DIRECTORY_SEPARATOR . $clean_path;

    if (!is_file($full_file_path) || strpos(realpath($full_file_path), $base_path_realpath) !== 0) {
        throw new Exception("File not found or access denied.", 404);
    }

    if (!is_readable($full_file_path)) {
        throw new Exception("File is not readable.", 403);
    }

    if (isset($conn)) {
        $conn->close();
    }

    if (ob_get_level() > 0) { ob_end_clean(); }

    $filenameForBrowser = basename($full_file_path);
    $ascii_filename = preg_replace('/[^\x20-\x7E]/', '', $filenameForBrowser);
    $utf8_filename = rawurlencode($filenameForBrowser);

    header('Content-Type: ' . mime_content_type($full_file_path));
    header('Content-Length: ' . filesize($full_file_path));
    header('Content-Disposition: inline; filename="' . $ascii_filename . '"; filename*=UTF-8\'\'' . $utf8_filename);
    header('Content-Title: ' . $ascii_filename);
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');

    readfile($full_file_path);
    exit;

} catch (Throwable $e) {
    sendErrorResponse($e->getMessage(), $e->getCode() ?: 500);
}
