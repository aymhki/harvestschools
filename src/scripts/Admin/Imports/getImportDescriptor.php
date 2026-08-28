<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/importRegistry.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $domain = import_domain((string)($_GET['domain'] ?? ''));

    if ($domain === null) {
        echo json_encode(["success" => false, "message" => "Unknown import domain.", "code" => 400]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $context = import_context_from_request($domain, $_GET);
    $authStatus = call_user_func($domain['authorise'], $conn, $context);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $describeColumns = function ($descriptor) {
        $columns = [];

        foreach ($descriptor as $key => $spec) {
            $columns[] = [
                'key'      => $key,
                'label'    => $spec['label'],
                'required' => !empty($spec['required']),
                'type'     => $spec['type'] ?? 'text',
                'example'  => (string)($spec['example'] ?? ''),
                'values'   => $spec['values'] ?? null,
            ];
        }

        return $columns;
    };

    $variants = [];

    if (isset($domain['variants'])) {
        foreach (call_user_func($domain['variants']) as $variant) {
            $variants[] = [
                'key'     => $variant['key'],
                'label'   => $variant['label'],
                'columns' => $describeColumns($variant['columns']),
            ];
        }
    }

    $columns = $variants === []
        ? $describeColumns(call_user_func($domain['descriptor']))
        : $variants[0]['columns'];

    echo json_encode([
        "success" => true,
        "message" => "Descriptor retrieved successfully",
        "code"    => 200,
        "data"    => ["label" => $domain['label'], "columns" => $columns, "variants" => $variants]
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
