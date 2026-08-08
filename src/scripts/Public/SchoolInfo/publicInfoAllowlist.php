<?php


const PUBLIC_INFO_SETTING_ALLOWLIST = [];
const PUBLIC_INFO_RULE_SETTING_KEYS = ['SHOW_UNOFFERED_STAGES'];
const PUBLIC_INFO_SCHEMA_VERSION = 1;

const PUBLIC_INFO_SUPPORTED_LANGUAGES = ['en', 'ar'];

function public_info_normalise_language($requested) {
    $language = is_string($requested) ? strtolower(trim($requested)) : '';

    return in_array($language, PUBLIC_INFO_SUPPORTED_LANGUAGES, true) ? $language : 'en';
}

function public_info_read_rule_settings($conn) {
    $rules = [];
    $placeholders = implode(', ', array_fill(0, count(PUBLIC_INFO_RULE_SETTING_KEYS), '?'));
    $types = str_repeat('s', count(PUBLIC_INFO_RULE_SETTING_KEYS));
    $keys = PUBLIC_INFO_RULE_SETTING_KEYS;

    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM info_system_global_settings WHERE is_encrypted = 0 AND setting_key IN ($placeholders)");
    $stmt->bind_param($types, ...$keys);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $rules[$row['setting_key']] = $row['setting_value'];
    }

    $stmt->close();

    return $rules;
}
