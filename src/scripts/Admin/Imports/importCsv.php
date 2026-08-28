<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/importRegistry.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $domain = import_domain((string)($_POST['domain'] ?? ''));

    if ($domain === null) {
        echo json_encode(["success" => false, "message" => "Unknown import domain.", "code" => 400]);
        exit;
    }

    $upload = csv_import_uploaded_file('file');

    if (!$upload['ok']) {
        echo json_encode(["success" => false, "message" => $upload['message'], "code" => 400]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $context = import_context_from_request($domain, $_POST);
    $authStatus = call_user_func($domain['authorise'], $conn, $context);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $variant = isset($domain['variants']) ? csv_import_pick_variant($upload['contents'], call_user_func($domain['variants'])) : null;

    $descriptor = $variant === null ? call_user_func($domain['descriptor']) : $variant['columns'];
    $context['import_descriptor'] = $descriptor;
    $context['import_variant'] = $variant === null ? '' : $variant['key'];

    $read = csv_import_read($upload['contents'], $descriptor);

    if (!$read['success']) {
        echo json_encode(["success" => false, "message" => $read['message'], "code" => 400]);
        exit;
    }

    if ($read['failed'] !== []) {
        echo json_encode([
            "success"  => false,
            "message"  => "Nothing was imported. Please correct the rows listed below and upload the file again.",
            "code"     => 400,
            "failed"   => $read['failed'],
            "warnings" => $read['warnings']
        ]);
        exit;
    }

    $result = call_user_func($domain['add'], $conn, $read['rows'], $context);

    if (isset($result['message'])) {
        echo json_encode(["success" => false, "message" => $result['message'], "code" => 400]);
        exit;
    }

    if ($result['failed'] !== []) {
        echo json_encode([
            "success"  => false,
            "message"  => "Nothing was imported. Please correct the rows listed below and upload the file again.",
            "code"     => 400,
            "failed"   => $result['failed'],
            "warnings" => $read['warnings']
        ]);
        exit;
    }

    echo json_encode([
        "success"  => true,
        "message"  => $result['ok'] . ' ' . ($result['ok'] === 1 ? $domain['label'] : $domain['plural']) . ' imported.',
        "code"     => 200,
        "imported" => $result['ok'],
        "failed"   => [],
        "warnings" => $read['warnings']
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
