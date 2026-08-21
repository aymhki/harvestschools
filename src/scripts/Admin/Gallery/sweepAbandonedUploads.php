<?php

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('This script only runs from the command line.');
}

$documentRoot = rtrim($argv[1] ?? '', '/\\');

if ($documentRoot === '' || !is_dir($documentRoot)) {
    fwrite(STDERR, "Pass the document root, for example: php " . basename(__FILE__) . " /home/USER/public_html\n");
    exit(1);
}

$_SERVER['DOCUMENT_ROOT'] = $documentRoot;

require_once $documentRoot . '/scripts/Admin/Gallery/galleryHelpers.php';

$config = require dirname($documentRoot) . '/configs/dbConfig.php';
$connection = new mysqli($config['db_host'], $config['db_username'], $config['db_password'], $config['db_name']);

if ($connection->connect_error) {
    fwrite(STDERR, 'Database connection failed: ' . $connection->connect_error . PHP_EOL);
    exit(1);
}

$connection->set_charset('utf8mb4');

$removed = gallery_sweep_abandoned_uploads($connection);

$connection->close();

printf("%d abandoned upload%s removed, %d orphaned file%s deleted.\n",
    $removed['rows'], $removed['rows'] === 1 ? '' : 's',
    $removed['files'], $removed['files'] === 1 ? '' : 's');
