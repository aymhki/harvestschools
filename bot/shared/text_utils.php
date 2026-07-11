<?php

function splitTitleAndDescription($text, $titleLimit = 24, $descLimit = 72) {
    $text = trim(preg_replace('/\s+/u', ' ', (string) $text));

    if ($text === '') {
        return ['title' => '', 'description' => ''];
    }

    if (mb_strlen($text, 'UTF-8') <= $titleLimit) {
        return ['title' => $text, 'description' => ''];
    }

    $window  = mb_substr($text, 0, $titleLimit, 'UTF-8');
    $breakAt = mb_strrpos($window, ' ', 0, 'UTF-8');

    if ($breakAt === false) {
        $title = mb_substr($text, 0, $titleLimit, 'UTF-8');
        $rest  = mb_substr($text, $titleLimit, null, 'UTF-8');
    } else {
        $title = mb_substr($text, 0, $breakAt, 'UTF-8');
        $rest  = mb_substr($text, $breakAt + 1, null, 'UTF-8');
    }

    $connectors = ['&', '-', '–', '/', 'and', 'or', 'AND', 'OR', 'And', 'Or'];
    $words = explode(' ', $title);
    while (count($words) > 1 && in_array(end($words), $connectors, true)) {
        $rest  = array_pop($words) . ' ' . $rest;
        $title = implode(' ', $words);
    }

    $title = rtrim($title, " \t\n\r\0\x0B-–—,;:&/");
    $rest  = trim($rest);

    if ($descLimit !== null && mb_strlen($rest, 'UTF-8') > $descLimit) {
        $rest = smartTruncate($rest, $descLimit);
    }

    return ['title' => $title, 'description' => $rest];
}

function smartTruncate($text, $limit) {
    $text = trim((string) $text);

    if ($text === '' || mb_strlen($text, 'UTF-8') <= $limit) {
        return $text;
    }

    $ellipsis = '…';
    $budget   = max(1, $limit - mb_strlen($ellipsis, 'UTF-8'));
    $window   = mb_substr($text, 0, $budget, 'UTF-8');
    $breakAt  = mb_strrpos($window, ' ', 0, 'UTF-8');

    if ($breakAt !== false && $breakAt > 0) {
        $window = mb_substr($window, 0, $breakAt, 'UTF-8');
    }

    return rtrim($window) . $ellipsis;
}
