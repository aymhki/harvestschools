<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$dbConfig = require '../../../../configs/dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

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
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $JOB_APPLICATION_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $JOB_APPLICATION_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $privateUploadsBasePath = '../../../../files_uploaded_from_harvestschools_webapp/job_applications/';
    $sessionDurationInHours = 12;

    $file_path_from_get = isset($_GET['file']) ? $_GET['file'] : null;

    if (!$file_path_from_get) {
        throw new Exception("Missing required parameters or authentication cookies.", 400);
    }


    $sanitized_path = str_replace('\\', '/', $file_path_from_get);
    $path_parts = explode('/', $sanitized_path);
    $clean_path_parts = [];
    foreach ($path_parts as $part) {
        if ($part === '.' || $part === '') continue;
        if ($part === '..') {
            throw new Exception("Invalid file path (directory traversal detected).", 400);
        }
        $clean_path_parts[] = $part;
    }
    $clean_path = implode('/', $clean_path_parts);

    $base_path_realpath = realpath($privateUploadsBasePath);
    if ($base_path_realpath === false) {
        throw new Exception("Internal Server Configuration Error: The base uploads directory does not exist.", 500);
    }

    $full_file_path = $base_path_realpath . DIRECTORY_SEPARATOR . $clean_path;

    if (!is_file($full_file_path) || strpos(realpath($full_file_path), $base_path_realpath) !== 0) {
        throw new Exception("File not found or access denied.", 404);
    }

    if (!is_readable($full_file_path)) {
        throw new Exception("File is not readable.", 403);
    }

    if (isset($conn) ) {
        $conn->close();
    }

    ob_end_clean();

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

} catch (Exception $e) {
    sendErrorResponse($e->getMessage(), $e->getCode() ?: 500);
}

