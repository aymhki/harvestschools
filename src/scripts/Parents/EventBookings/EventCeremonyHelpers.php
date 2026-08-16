<?php

const CEREMONY_FALLBACK_TIME_ZONE = 'Africa/Cairo';


function ceremony_configs_dir() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $docRoot !== '' ? dirname($docRoot) . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR : '';
}


function event_meta_details(mysqli $conn) {
    $details = [
        'ceremonyDate'      => null,
        'ceremonyTime'      => null,
        'timeZone'          => null,
        'locationName'      => null,
        'locationAddress'   => null,
        'locationPlaceId'   => null,
        'locationLatitude'  => null,
        'locationLongitude' => null,
        'updatedAt'         => null,
    ];

    $result = $conn->query(
        "SELECT ceremony_date, ceremony_time, time_zone, location_name, location_address,
                location_place_id, location_latitude, location_longitude, updated_at
         FROM event_meta_details WHERE id = 1"
    );

    $row = $result ? $result->fetch_assoc() : null;

    if ($row) {
        $details = [
            'ceremonyDate'      => $row['ceremony_date'],
            'ceremonyTime'      => $row['ceremony_time'],
            'timeZone'          => $row['time_zone'],
            'locationName'      => $row['location_name'],
            'locationAddress'   => $row['location_address'],
            'locationPlaceId'   => $row['location_place_id'],
            'locationLatitude'  => $row['location_latitude'] !== null ? (float)$row['location_latitude'] : null,
            'locationLongitude' => $row['location_longitude'] !== null ? (float)$row['location_longitude'] : null,
            'updatedAt'         => $row['updated_at'],
        ];
    }

    return $details;
}


function event_meta_is_valid_time_zone($timeZone) {
    return is_string($timeZone) && $timeZone !== ''
        && in_array($timeZone, DateTimeZone::listIdentifiers(), true);
}


function event_meta_iso_datetime(array $details) {
    $isoDateTime = null;

    if (!empty($details['ceremonyDate'])) {
        $time = !empty($details['ceremonyTime']) ? $details['ceremonyTime'] : '00:00:00';

        $timeZone = event_meta_is_valid_time_zone($details['timeZone'] ?? null)
            ? $details['timeZone']
            : CEREMONY_FALLBACK_TIME_ZONE;

        try {
            $localDateTime = new DateTimeImmutable(
                $details['ceremonyDate'] . ' ' . $time,
                new DateTimeZone($timeZone)
            );

            $isoDateTime = $localDateTime->format('c');
        } catch (Exception $dateError) {
            $isoDateTime = null;
        }
    }

    return $isoDateTime;
}


function event_meta_location_label(array $details) {
    $parts = array_filter([$details['locationName'], $details['locationAddress']]);

    return $parts === [] ? null : implode(' — ', $parts);
}
