<?php
require_once '../../headers.php';
set_cors_headers();

const WEATHER_SCHOOL_LATITUDE = 30.868058;
const WEATHER_SCHOOL_LONGITUDE = 29.59631;
const WEATHER_SCHOOL_CITY = 'Borg Al-Arab';
const WEATHER_SCHOOL_CITY_ARABIC = 'برج العرب';

const WEATHER_LOCATION_CACHE_SECONDS = 43200;
const WEATHER_TIME_ZONE_CACHE_SECONDS = 2592000;
const WEATHER_CITY_NAME_CACHE_SECONDS = 2592000;
const WEATHER_FORECAST_CACHE_SECONDS = 900;

const WEATHER_COORDINATE_PRECISION = 2;

/* How far a geocoding result may sit from the resolved coordinates and still be
 * considered the same place, in kilometres. */
const WEATHER_CITY_MATCH_RADIUS_KM = 100;

const WEATHER_EARTH_RADIUS_KM = 6371;

const WEATHER_CACHE_DIRECTORY_NAME = 'harvest-schools-weather';

const WEATHER_LOOKUP_CONNECT_TIMEOUT = 2;
const WEATHER_LOOKUP_TIMEOUT = 4;

const WEATHER_SOURCE_DEVICE_ZONE = 'device-zone';
const WEATHER_SOURCE_IP = 'ip';
const WEATHER_SOURCE_SCHOOL = 'school';

const WEATHER_CLIENT_IP_HEADERS = [
    'HTTP_CF_CONNECTING_IP',
    'HTTP_TRUE_CLIENT_IP',
    'HTTP_X_REAL_IP',
    'HTTP_X_FORWARDED_FOR',
    'REMOTE_ADDR',
];


function weather_client_ip()
{
    $candidates = [];

    foreach (WEATHER_CLIENT_IP_HEADERS as $header) {
        $value = trim((string)($_SERVER[$header] ?? ''));

        if ($value !== '') {
            $candidates[] = trim(explode(',', $value)[0]);
        }
    }

    $publicIps = array_filter($candidates, function ($candidate) {
        return filter_var(
            $candidate,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    });

    return count($publicIps) > 0 ? reset($publicIps) : null;
}


function weather_requested_time_zone()
{
    $requested = trim((string)($_GET['timeZone'] ?? ''));

    $isKnown = $requested !== '' && in_array($requested, DateTimeZone::listIdentifiers(), true);

    return $isKnown ? $requested : null;
}


function weather_city_of_time_zone($timeZone)
{
    $segments = explode('/', $timeZone);

    return str_replace('_', ' ', end($segments));
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


function weather_distance_in_km($fromLatitude, $fromLongitude, $toLatitude, $toLongitude)
{
    $latitudeDelta = deg2rad($toLatitude - $fromLatitude);

    $longitudeDelta = deg2rad($toLongitude - $fromLongitude);

    $haversine = sin($latitudeDelta / 2) ** 2
        + cos(deg2rad($fromLatitude)) * cos(deg2rad($toLatitude)) * sin($longitudeDelta / 2) ** 2;

    return WEATHER_EARTH_RADIUS_KM * 2 * atan2(sqrt($haversine), sqrt(1 - $haversine));
}

function weather_arabic_city($city, $latitude, $longitude)
{
    $arabicCity = $city;

    if ($city !== '') {
        $cacheKey = 'city-ar:' . $city . ':' . round($latitude, WEATHER_COORDINATE_PRECISION)
            . ':' . round($longitude, WEATHER_COORDINATE_PRECISION);

        $cached = weather_cache_read($cacheKey, WEATHER_CITY_NAME_CACHE_SECONDS);

        if (is_array($cached)) {
            $arabicCity = (string)($cached['city'] ?? $city);
        } else {
            $search = weather_fetch_json(
                'https://geocoding-api.open-meteo.com/v1/search'
                . '?name=' . rawurlencode($city)
                . '&count=10&language=ar&format=json'
            );

            $results = is_array($search) ? ($search['results'] ?? []) : [];

            $closestDistance = WEATHER_CITY_MATCH_RADIUS_KM;

            foreach (is_array($results) ? $results : [] as $result) {
                if (!is_numeric($result['latitude'] ?? null) || !is_numeric($result['longitude'] ?? null)) {
                    continue;
                }

                $distance = weather_distance_in_km(
                    $latitude,
                    $longitude,
                    (float)$result['latitude'],
                    (float)$result['longitude']
                );

                if ($distance <= $closestDistance) {
                    $closestDistance = $distance;

                    $arabicCity = substr(trim((string)($result['name'] ?? $city)), 0, 100);
                }
            }

            weather_cache_write($cacheKey, ['city' => $arabicCity]);
        }
    }

    return $arabicCity;
}


function weather_locate_by_ip()
{
    $ip = weather_client_ip();

    $location = null;

    if ($ip !== null) {
        $cacheKey = 'location:' . $ip;

        $location = weather_cache_read($cacheKey, WEATHER_LOCATION_CACHE_SECONDS);

        if ($location === null) {
            $lookup = weather_fetch_json(
                'https://ipwho.is/' . rawurlencode($ip) . '?fields=success,latitude,longitude,city,country_code,timezone'
            );

            if (is_array($lookup) && !empty($lookup['success'])
                && is_numeric($lookup['latitude'] ?? null) && is_numeric($lookup['longitude'] ?? null)) {
                $zone = $lookup['timezone'] ?? null;

                $location = [
                    'latitude'    => (float)$lookup['latitude'],
                    'longitude'   => (float)$lookup['longitude'],
                    'city'        => substr(trim((string)($lookup['city'] ?? '')), 0, 100),
                    'countryCode' => strtoupper(substr(trim((string)($lookup['country_code'] ?? '')), 0, 2)),
                    'timeZone'    => is_array($zone) ? (string)($zone['id'] ?? '') : (string)$zone,
                    'source'      => WEATHER_SOURCE_IP,
                ];

                weather_cache_write($cacheKey, $location);
            }
        }
    }

    return $location;
}


function weather_locate_by_time_zone($timeZone, $countryCode)
{
    $cacheKey = 'zone:' . $timeZone . ':' . $countryCode;

    $location = weather_cache_read($cacheKey, WEATHER_TIME_ZONE_CACHE_SECONDS);

    if ($location === null) {
        $search = weather_fetch_json(
            'https://geocoding-api.open-meteo.com/v1/search'
            . '?name=' . rawurlencode(weather_city_of_time_zone($timeZone))
            . '&count=10&language=en&format=json'
        );

        $results = is_array($search) ? ($search['results'] ?? []) : [];

        $matches = array_filter(is_array($results) ? $results : [], function ($result) use ($timeZone, $countryCode) {
            $sameZone = ($result['timezone'] ?? '') === $timeZone;

            $sameCountry = $countryCode === '' || strtoupper((string)($result['country_code'] ?? '')) === $countryCode;

            return $sameZone && $sameCountry;
        });

        $best = count($matches) > 0 ? reset($matches) : (count($results) > 0 ? reset($results) : null);

        if (is_array($best) && is_numeric($best['latitude'] ?? null) && is_numeric($best['longitude'] ?? null)) {
            $location = [
                'latitude'    => (float)$best['latitude'],
                'longitude'   => (float)$best['longitude'],
                'city'        => substr(trim((string)($best['name'] ?? '')), 0, 100),
                'countryCode' => strtoupper((string)($best['country_code'] ?? '')),
                'timeZone'    => (string)($best['timezone'] ?? $timeZone),
                'source'      => WEATHER_SOURCE_DEVICE_ZONE,
            ];

            weather_cache_write($cacheKey, $location);
        }
    }

    return $location;
}


function weather_locate_caller()
{
    $deviceTimeZone = weather_requested_time_zone();

    $ipLocation = weather_locate_by_ip();

    $location = $ipLocation;

    $ipLooksWrong = $deviceTimeZone !== null
        && ($ipLocation === null || ($ipLocation['timeZone'] ?? '') !== $deviceTimeZone);

    if ($ipLooksWrong) {
        $zoneLocation = weather_locate_by_time_zone($deviceTimeZone, $ipLocation['countryCode'] ?? '');

        $location = $zoneLocation !== null ? $zoneLocation : $ipLocation;
    }

    if ($location === null) {
        $location = [
            'latitude'    => WEATHER_SCHOOL_LATITUDE,
            'longitude'   => WEATHER_SCHOOL_LONGITUDE,
            'city'        => WEATHER_SCHOOL_CITY,
            'cityArabic'  => WEATHER_SCHOOL_CITY_ARABIC,
            'countryCode' => 'EG',
            'timeZone'    => 'Africa/Cairo',
            'source'      => WEATHER_SOURCE_SCHOOL,
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

    $city = (string)($location['city'] ?? '');

    $arabicCity = $location['cityArabic']
        ?? weather_arabic_city($city, $location['latitude'], $location['longitude']);

    echo json_encode([
        'success'     => true,
        'temperature' => $conditions['temperature'],
        'weatherCode' => $conditions['weatherCode'],
        'isDay'       => $conditions['isDay'],
        'isNearby'    => $location['source'] !== WEATHER_SOURCE_SCHOOL,
        'city'        => $city,
        'cityArabic'  => $arabicCity,
        'source'      => $location['source'],
    ]);
} catch (Throwable $weatherError) {
    echo json_encode([
        'success' => false,
        'message' => 'The weather could not be read right now',
        'code' => 500
    ]);
}
