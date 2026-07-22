<?php

require_once __DIR__ . '/mfaConfig.php';

function admin_client_ip() {
    if (mfa_config('trust_forwarded_ip')) {
        $forwarded = trim((string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));

        if ($forwarded !== '') {
            $first = trim(explode(',', $forwarded)[0]);

            if (filter_var($first, FILTER_VALIDATE_IP)) {
                return $first;
            }
        }
    }

    $remote = (string)($_SERVER['REMOTE_ADDR'] ?? '');

    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : null;
}

function admin_ip_is_public($ip) {
    if (!is_string($ip) || $ip === '') { return false; }

    return filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) !== false;
}

function admin_ip_geolocate($conn, $ip) {
    if (!admin_ip_is_public($ip)) { return null; }

    $ttlDays = max(1, (int)mfa_config('ip_geo_ttl_days'));

    $stmt = $conn->prepare(
        "SELECT ip, country, country_code, region, city,
                (looked_up_at < (NOW() - INTERVAL ? DAY)) AS expired
         FROM admin_ip_geolocations WHERE ip = ?"
    );
    $stmt->bind_param("is", $ttlDays, $ip);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row && (int)$row['expired'] === 0) {
        unset($row['expired']);
        return $row;
    }

    $fresh = admin_ip_geo_fetch($ip);

    if ($fresh === null) {
        if ($row) {
            unset($row['expired']);
            return $row;
        }

        return null;
    }

    $stmt = $conn->prepare(
        "INSERT INTO admin_ip_geolocations (ip, country, country_code, region, city, looked_up_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            country = VALUES(country), country_code = VALUES(country_code),
            region = VALUES(region), city = VALUES(city), looked_up_at = NOW()"
    );
    $stmt->bind_param(
        "sssss",
        $ip,
        $fresh['country'],
        $fresh['country_code'],
        $fresh['region'],
        $fresh['city']
    );
    $stmt->execute();
    $stmt->close();

    return ['ip' => $ip] + $fresh;
}

function admin_ip_geo_fetch($ip) {
    if (!mfa_config('ip_geo_lookup_enabled')) { return null; }

    $url = 'https://ipwho.is/' . rawurlencode($ip) . '?fields=success,country,country_code,region,city';

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT        => 3,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT      => 'HarvestSchoolsAdmin/1.0',
    ]);

    $body = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if ($body === false || $status !== 200) { return null; }

    $data = json_decode($body, true);

    if (!is_array($data) || empty($data['success'])) { return null; }

    $clean = fn($v) => substr(trim((string)($v ?? '')), 0, 100);

    $geo = [
        'country'      => $clean($data['country'] ?? ''),
        'country_code' => strtoupper(substr($clean($data['country_code'] ?? ''), 0, 2)),
        'region'       => $clean($data['region'] ?? ''),
        'city'         => $clean($data['city'] ?? ''),
    ];

    if ($geo['country'] === '' && $geo['country_code'] === '') { return null; }

    return $geo;
}

function admin_ip_location_label($geo) {
    if (!is_array($geo)) { return null; }

    $parts = array_values(array_filter([
        $geo['city'] ?? '',
        $geo['region'] ?? '',
        $geo['country'] ?? '',
    ], fn($p) => trim((string)$p) !== ''));

    return empty($parts) ? null : implode(', ', $parts);
}

function admin_ip_region_key($geo) {
    if (!is_array($geo)) { return null; }

    $countryCode = trim((string)($geo['country_code'] ?? ''));
    $region      = trim((string)($geo['region'] ?? ''));

    if ($countryCode === '') { return null; }

    return strtolower($countryCode . '|' . $region);
}

function admin_ip_trust_level($conn, $userId, $currentIp) {
    if (!admin_ip_is_public($currentIp)) { return 'none'; }

    $windowDays = max(1, (int)mfa_config('ip_known_window_days'));

    $stmt = $conn->prepare(
        "SELECT 1 FROM admin_login_events
         WHERE user_id = ? AND ip_address = ?
           AND event IN ('login_success','mfa_pass')
           AND created_at > (NOW() - INTERVAL ? DAY)
         LIMIT 1"
    );
    $stmt->bind_param("isi", $userId, $currentIp, $windowDays);
    $stmt->execute();
    $exact = $stmt->get_result()->num_rows > 0;
    $stmt->close();

    if ($exact) { return 'exact_ip'; }

    $currentGeo = admin_ip_geolocate($conn, $currentIp);
    $currentKey = admin_ip_region_key($currentGeo);

    if ($currentKey === null) { return 'none'; }

    $stmt = $conn->prepare(
        "SELECT DISTINCT e.ip_address, g.country_code, g.region
         FROM admin_login_events e
         JOIN admin_ip_geolocations g ON g.ip = e.ip_address
         WHERE e.user_id = ? AND e.ip_address IS NOT NULL
           AND e.event IN ('login_success','mfa_pass')
           AND e.created_at > (NOW() - INTERVAL ? DAY)
         LIMIT 100"
    );
    $stmt->bind_param("ii", $userId, $windowDays);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    while ($row = $result->fetch_assoc()) {
        if (admin_ip_region_key($row) === $currentKey) {
            return 'same_region';
        }
    }

    return 'none';
}
