<?php
$dbConfig = require 'dbConfig.php';
$privateUploadsBasePath = '../../files_uploaded_from_harvestschools_webapp/job_applications/';
$requiredPermissionLevel = 0;
$sessionDurationInHours = 12;

$file_path_from_get = isset($_GET['file']) ? $_GET['file'] : null;
$sessionId = isset($_COOKIE['harvest_schools_admin_session_id']) ? $_COOKIE['harvest_schools_admin_session_id'] : null;
$sessionTime = isset($_COOKIE['harvest_schools_admin_session_time']) ? (int)$_COOKIE['harvest_schools_admin_session_time'] : null;

if (!$file_path_from_get || !$sessionId || !$sessionTime) {
    http_response_code(400);
    echo "Error: Missing required parameters or authentication cookies.";
    exit;
}

$sessionDurationInSeconds = $sessionDurationInHours * 60 * 60;
$sessionStartTimeSeconds = $sessionTime / 1000;
if (time() > ($sessionStartTimeSeconds + $sessionDurationInSeconds)) {
    http_response_code(401);
    echo "Error: Your session has expired. Please log in again.";
    exit;
}

$sanitized_path = str_replace('\\', '/', $file_path_from_get);
$path_parts = explode('/', $sanitized_path);
$clean_path_parts = [];
foreach ($path_parts as $part) {
    if ($part === '.' || $part === '') continue;
    if ($part === '..') {
        http_response_code(400);
        echo "Error: Invalid file path (directory traversal detected).";
        exit;
    }
    $clean_path_parts[] = $part;
}
$clean_path = implode('/', $clean_path_parts);
$full_file_path = realpath($privateUploadsBasePath . $clean_path);

if (!$full_file_path || strpos($full_file_path, realpath($privateUploadsBasePath)) !== 0) {
    http_response_code(404);
    echo "Error: File not found or access denied.";
    exit;
}

$conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
if ($conn->connect_error) {
    http_response_code(500); exit;
}
try {
    $stmt = $conn->prepare("SELECT u.permission_level FROM admin_sessions s JOIN admin_users u ON LOWER(s.username) = LOWER(u.username) WHERE s.id = ?");
    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo "Error: Invalid session.";
        exit;
    }
    $user = $result->fetch_assoc();
    $permissionLevels = array_map('intval', explode(',', $user['permission_level']));
    if (!in_array($requiredPermissionLevel, $permissionLevels, true)) {
        http_response_code(403);
        echo "Error: You do not have permission to access this file.";
        exit;
    }
} catch (Exception $e) {
    http_response_code(500); exit;
} finally {
    $stmt->close();
    $conn->close();
}

if (file_exists($full_file_path)) {
    $filenameForBrowser = basename($full_file_path);
    $ascii_filename = preg_replace('/[^\x20-\x7E]/', '', $filenameForBrowser);
    $utf8_filename = rawurlencode($filenameForBrowser);

    ob_clean();
    flush();

    header('Content-Type: ' . mime_content_type($full_file_path));
    header('Content-Length: ' . filesize($full_file_path));
    header('Content-Disposition: inline; filename="' . $ascii_filename . '"; filename*=UTF-8\'\'' . $utf8_filename);
    header('Content-Title: ' . $ascii_filename);

    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');

    readfile($full_file_path);
    exit;
} else {
    http_response_code(404);
    echo "Error: The requested file could not be found on the server.";
    exit;
}
?>