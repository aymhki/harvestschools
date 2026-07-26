<?php
require_once '../../headers.php';
set_cors_headers();

const WEATHER_SCHOOL_LATITUDE = 30.868058;
const WEATHER_SCHOOL_LONGITUDE = 29.59631;
const WEATHER_SCHOOL_LABEL = 'Harvest International School';

const WEATHER_LOCATION_CACHE_SECONDS = 43200;
const WEATHER_FORECAST_CACHE_SECONDS = 900;

const WEATHER_COORDINATE_PRECISION = 2;

const WEATHER_CACHE_DIRECTORY_NAME = 'harvest-schools-weather';

const WEATHER_LOOKUP_CONNECT_TIMEOUT = 2;
const WEATHER_LOOKUP_TIMEOUT = 4;

function weather_client_ip()
{
    $forwarded = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));

    $candidates = [];

    if ($forwarded !== '') {
        $candidates[] = trim(explode(',', $forwarded)[0]);
    }

    $candidates[] = (string)($_SERVER['REMOTE_ADDR'] ?? '');

    $publicIps = array_filter($candidates, function ($candidate) {
        return filter_var(
            $candidate,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    });

    return count($publicIps) > 0 ? reset($publicIps) : null;
}

function weather_cache_path($key)
{
    $directory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . WEATHER_CACHE_DIRECTORY_NAME;

    if (!is_dir($directory)) {
        @mkdir($directory, 0700, true);
    }

    return $directory . DIRECTORY_SEPARATOR . sha1($key) . '.json';
}

function weather_cache_read($key, $maxAgeSeconds)
{
    $path = weather_cache_path($key);

    $cached = null;

    if (is_file($path) && (time() - (int)filemtime($path)) < $maxAgeSeconds) {
        $decoded = json_decode((string)@file_get_contents($path), true);

        if (is_array($decoded)) {
            $cached = $decoded;
        }
    }

    return $cached;
}

function weather_cache_write($key, $payload)
{
    @file_put_contents(weather_cache_path($key), json_encode($payload), LOCK_EX);
}

function weather_fetch_json($url)
{
    $curl = curl_init($url);

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => WEATHER_LOOKUP_CONNECT_TIMEOUT,
        CURLOPT_TIMEOUT        => WEATHER_LOOKUP_TIMEOUT,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'HarvestSchoolsApp/1.0',
    ]);

    $body = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

    $decoded = ($body !== false && $status === 200) ? json_decode((string)$body, true) : null;

    return is_array($decoded) ? $decoded : null;
}

function weather_locate_caller()
{
    $ip = weather_client_ip();

    $location = null;

    if ($ip !== null) {
        $cacheKey = 'location:' . $ip;

        $location = weather_cache_read($cacheKey, WEATHER_LOCATION_CACHE_SECONDS);

        if ($location === null) {
            $lookup = weather_fetch_json(
                'https://ipwho.is/' . rawurlencode($ip) . '?fields=success,latitude,longitude,city'
            );

            if (is_array($lookup) && !empty($lookup['success'])
                && is_numeric($lookup['latitude'] ?? null) && is_numeric($lookup['longitude'] ?? null)) {
                $location = [
                    'latitude'  => (float)$lookup['latitude'],
                    'longitude' => (float)$lookup['longitude'],
                    'city'      => substr(trim((string)($lookup['city'] ?? '')), 0, 100),
                    'isNearby'  => true,
                ];

                weather_cache_write($cacheKey, $location);
            }
        }
    }

    if ($location === null) {
        $location = [
            'latitude'  => WEATHER_SCHOOL_LATITUDE,
            'longitude' => WEATHER_SCHOOL_LONGITUDE,
            'city'      => WEATHER_SCHOOL_LABEL,
            'isNearby'  => false,
        ];
    }

    return $location;
}

function weather_current_conditions($latitude, $longitude)
{
    $roundedLatitude = round($latitude, WEATHER_COORDINATE_PRECISION);
    $roundedLongitude = round($longitude, WEATHER_COORDINATE_PRECISION);

    $cacheKey = 'forecast:' . $roundedLatitude . ':' . $roundedLongitude;

    $conditions = weather_cache_read($cacheKey, WEATHER_FORECAST_CACHE_SECONDS);

    if ($conditions === null) {
        $forecast = weather_fetch_json(
            'https://api.open-meteo.com/v1/forecast'
            . '?latitude=' . $roundedLatitude
            . '&longitude=' . $roundedLongitude
            . '&current=temperature_2m,weather_code,is_day'
            . '&timezone=auto'
        );

        $current = is_array($forecast) ? ($forecast['current'] ?? null) : null;

        if (is_array($current) && is_numeric($current['temperature_2m'] ?? null)) {
            $conditions = [
                'temperature' => round((float)$current['temperature_2m']),
                'weatherCode' => (int)($current['weather_code'] ?? 0),
                'isDay'       => (int)($current['is_day'] ?? 1) === 1,
            ];

            weather_cache_write($cacheKey, $conditions);
        }
    }

    return $conditions;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Only GET is supported', 'code' => 405]);
    exit;
}

try {
    $location = weather_locate_caller();

    $conditions = weather_current_conditions($location['latitude'], $location['longitude']);

    if ($conditions === null) {
        echo json_encode([
            'success' => false,
            'message' => 'The weather could not be read right now',
            'code' => 503
        ]);
        exit;
    }

    echo json_encode([
        'success'     => true,
        'temperature' => $conditions['temperature'],
        'weatherCode' => $conditions['weatherCode'],
        'isDay'       => $conditions['isDay'],
        'isNearby'    => $location['isNearby'],
        'city'        => $location['city'],
    ]);
} catch (Throwable $weatherError) {
    echo json_encode([
        'success' => false,
        'message' => 'The weather could not be read right now',
        'code' => 500
    ]);
}
