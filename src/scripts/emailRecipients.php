<?php

function configured_email_recipients() {
    static $cache = null;

    if ($cache !== null) {
        return $cache;
    }

    $cache = [];

    $documentRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $configPath = $documentRoot !== '' ? dirname($documentRoot) . '/configs/dbConfig.php' : '';

    if ($configPath === '' || !is_file($configPath)) {
        return $cache;
    }

    $dbConfig = require $configPath;
    $connection = @new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($connection->connect_error) {
        return $cache;
    }

    $tableCheck = $connection->query("SHOW TABLES LIKE 'info_system_form_emails'");

    if ($tableCheck && $tableCheck->num_rows > 0) {
        $result = $connection->query("SELECT form_key, recipient_email FROM info_system_form_emails WHERE is_active = 1");

        while ($row = $result->fetch_assoc()) {
            $candidate = strtolower(trim((string)$row['recipient_email']));

            if (filter_var($candidate, FILTER_VALIDATE_EMAIL) !== false) {
                $cache[$row['form_key']] = $candidate;
            }
        }
    }

    $connection->close();

    return $cache;
}


function configured_email($key) {
    $recipients = configured_email_recipients();

    return isset($recipients[$key]) ? $recipients[$key] : null;
}
