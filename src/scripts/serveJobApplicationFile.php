<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


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
    $dbConfig = require 'dbConfig.php';
    $privateUploadsBasePath = '../../files_uploaded_from_harvestschools_webapp/job_applications/';
    $requiredPermissionLevel = 0;
    $sessionDurationInHours = 12;

    $file_path_from_get = isset($_GET['file']) ? $_GET['file'] : null;
    $sessionId = isset($_COOKIE['harvest_schools_admin_session_id']) ? $_COOKIE['harvest_schools_admin_session_id'] : null;
    $sessionTime = isset($_COOKIE['harvest_schools_admin_session_time']) ? (int)$_COOKIE['harvest_schools_admin_session_time'] : null;

    if (!$file_path_from_get || !$sessionId || !$sessionTime) {
        throw new Exception("Missing required parameters or authentication cookies.", 400);
    }

    $sessionDurationInSeconds = $sessionDurationInHours * 60 * 60;
    $sessionStartTimeSeconds = $sessionTime / 1000;
    if (time() > ($sessionStartTimeSeconds + $sessionDurationInSeconds)) {
        throw new Exception("Your session has expired. Please log in again.", 401);
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

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error, 500);
    }

    $stmt = $conn->prepare("SELECT u.permission_level FROM admin_sessions s JOIN admin_users u ON LOWER(s.username) = LOWER(u.username) WHERE s.id = ?");
    if (!$stmt) {
        throw new Exception("Database statement preparation failed.", 500);
    }

    try {
        $stmt->bind_param("s", $sessionId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("Invalid session.", 401);
        }
        $user = $result->fetch_assoc();
        $permissionLevels = array_map('intval', explode(',', $user['permission_level']));
        if (!in_array($requiredPermissionLevel, $permissionLevels, true)) {
            throw new Exception("You do not have permission to access this file.", 403);
        }
    } finally {
        $stmt->close();
        $conn->close();
    }

    ob_clean();
    flush();

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
?>