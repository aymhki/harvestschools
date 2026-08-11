<?php

const PUBLIC_MEDIA_ROOTS = [
    'assets'  => 'assets',
    'gallery' => 'files_uploaded_from_harvestschools_webapp/gallery',
];

const PUBLIC_MEDIA_DEFAULT_ROOT = 'assets';


function public_media_home() {
    $documentRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $documentRoot === '' ? null : dirname($documentRoot);
}


function public_media_root_exists($rootKey) {
    return is_string($rootKey) && array_key_exists($rootKey, PUBLIC_MEDIA_ROOTS);
}

function public_media_root($rootKey) {
    $home = public_media_home();

    if ($home === null || !public_media_root_exists($rootKey)) {
        return null;
    }

    $relative = str_replace('/', DIRECTORY_SEPARATOR, PUBLIC_MEDIA_ROOTS[$rootKey]);
    $directory = $home . DIRECTORY_SEPARATOR . $relative . DIRECTORY_SEPARATOR;

    return is_dir($directory) ? $directory : null;
}


function public_media_cache_base() {
    $home = public_media_home();

    return $home === null ? null : $home . DIRECTORY_SEPARATOR . 'assets-cache' . DIRECTORY_SEPARATOR;
}
