<?php

require_once __DIR__ . '/../../headers.php';
require_once __DIR__ . '/../../graduationCeremonyHelpers.php';

const WALLET_PASS_IMAGE_FILES = ['icon.png', 'icon@2x.png', 'icon@3x.png', 'logo.png', 'logo@2x.png', 'logo@3x.png'];
const WALLET_PASS_IMAGE_DIR = 'images/Wallet/pass/';
const WALLET_GOOGLE_SAVE_BASE = 'https://pay.google.com/gp/v/save/';
const WALLET_PASS_FORMAT_VERSION = 1;


function wallet_configs_dir() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $docRoot !== '' ? dirname($docRoot) . DIRECTORY_SEPARATOR . 'configs' . DIRECTORY_SEPARATOR : '';
}


function wallet_assets_dir() {
    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');

    return $docRoot !== '' ? dirname($docRoot) . DIRECTORY_SEPARATOR . 'assets' . DIRECTORY_SEPARATOR : '';
}


function wallet_config($key = null) {
    static $config = null;

    if ($config === null) {
        $config = [];

        $configPath = wallet_configs_dir() . 'walletPassConfig.php';

        if ($configPath !== '' && is_readable($configPath)) {
            require_once $configPath;

            if (function_exists('wallet_pass_config')) {
                $config = wallet_pass_config();
            }
        }
    }

    if ($key === null) { return $config; }

    return $config[$key] ?? null;
}


function wallet_apple_credentials() {
    static $credentials = null;

    if ($credentials === null) {
        $credentials = false;

        $certPath = (string)wallet_config('apple_certificate_path');
        $keyPath = (string)wallet_config('apple_key_path');
        $password = (string)wallet_config('apple_p12_password');

        if ($certPath !== '' && is_readable($certPath) && $keyPath !== '' && is_readable($keyPath)) {
            $credentials = [
                'cert' => (string)file_get_contents($certPath),
                'pkey' => (string)file_get_contents($keyPath),
            ];
        } else {
            $p12Path = (string)wallet_config('apple_p12_path');

            $p12 = $p12Path !== '' && is_readable($p12Path) ? (string)file_get_contents($p12Path) : '';

            $parsed = [];

            if ($p12 !== '' && openssl_pkcs12_read($p12, $parsed, $password)) {
                $credentials = ['cert' => $parsed['cert'], 'pkey' => $parsed['pkey']];
            }
        }
    }

    return $credentials === false ? null : $credentials;
}


function wallet_apple_is_configured() {
    $wwdr = wallet_config('apple_wwdr_path');

    return wallet_config('apple_pass_type_id')
        && wallet_config('apple_team_id')
        && $wwdr && is_readable($wwdr)
        && class_exists('ZipArchive')
        && wallet_apple_credentials() !== null;
}


function wallet_google_is_configured() {
    $serviceAccount = wallet_config('google_service_account');

    return wallet_config('google_issuer_id')
        && wallet_config('google_class_suffix')
        && $serviceAccount && is_readable($serviceAccount);
}


function wallet_is_configured() {
    return wallet_apple_is_configured() || wallet_google_is_configured();
}



function wallet_base64url_encode($value) {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}


function wallet_base64url_decode($value) {
    return base64_decode(strtr($value, '-_', '+/'));
}


function wallet_make_pass_token($bookingId) {
    $payload = json_encode([
        'bid' => (int)$bookingId,
        'exp' => time() + (int)wallet_config('pass_token_ttl_seconds'),
    ]);

    $encodedPayload = wallet_base64url_encode($payload);

    $signature = hash_hmac('sha256', $encodedPayload, (string)wallet_config('pass_token_secret'), true);

    return $encodedPayload . '.' . wallet_base64url_encode($signature);
}


function wallet_verify_pass_token($token) {
    $bookingId = null;

    $parts = explode('.', (string)$token);

    if (count($parts) === 2) {
        $expected = wallet_base64url_encode(
            hash_hmac('sha256', $parts[0], (string)wallet_config('pass_token_secret'), true)
        );

        if (hash_equals($expected, $parts[1])) {
            $payload = json_decode(wallet_base64url_decode($parts[0]), true);

            if (is_array($payload) && isset($payload['bid'], $payload['exp']) && (int)$payload['exp'] > time()) {
                $bookingId = (int)$payload['bid'];
            }
        }
    }

    return $bookingId;
}

function wallet_booking_summary(mysqli $conn, $bookingId) {
    $summary = null;

    $sql = "SELECT b.booking_id, b.status, b.booking_date, b.booking_time, ac.username, ac.password_hash
            FROM graduation_bookings b
            JOIN graduation_booking_auth_credentials ac ON b.auth_id = ac.auth_id
            WHERE b.booking_id = ?";

    $stmt = $conn->prepare($sql);

    if ($stmt) {
        $stmt->bind_param("i", $bookingId);
        $stmt->execute();
        $bookingRow = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($bookingRow) {
            $students = [];

            $studentsSql = "SELECT s.name, s.grade, s.school_division
                            FROM graduation_booking_students s
                            JOIN graduation_booking_students_linker sl ON s.student_id = sl.student_id
                            WHERE sl.booking_id = ?";

            $stmt = $conn->prepare($studentsSql);

            if ($stmt) {
                $stmt->bind_param("i", $bookingId);
                $stmt->execute();
                $studentsResult = $stmt->get_result();

                while ($student = $studentsResult->fetch_assoc()) {
                    $students[] = $student;
                }

                $stmt->close();
            }

            $parentCount = 0;

            $parentsSql = "SELECT COUNT(*) AS parent_count
                           FROM graduation_booking_parents_linker
                           WHERE booking_id = ?";

            $stmt = $conn->prepare($parentsSql);

            if ($stmt) {
                $stmt->bind_param("i", $bookingId);
                $stmt->execute();
                $parentRow = $stmt->get_result()->fetch_assoc();
                $stmt->close();

                $parentCount = $parentRow ? (int)$parentRow['parent_count'] : 0;
            }

            $extras = null;

            $extrasSql = "SELECT extra_id, cd_count, additional_attendees, payment_status
                          FROM graduation_booking_extras WHERE booking_id = ?";

            $stmt = $conn->prepare($extrasSql);

            if ($stmt) {
                $stmt->bind_param("i", $bookingId);
                $stmt->execute();
                $extras = $stmt->get_result()->fetch_assoc() ?: null;
                $stmt->close();
            }

            $summary = [
                'ceremony'     => graduation_ceremony_details($conn),
                'booking_id'   => (int)$bookingRow['booking_id'],
                'status'       => (string)$bookingRow['status'],
                'username'     => (string)$bookingRow['username'],
                'auth_id'      => (string)$bookingRow['password_hash'],
                'students'     => $students,
                'extras'       => $extras,
                'seat_count'   => max($parentCount, 1) + ($extras ? (int)$extras['additional_attendees'] : 0),
            ];
        }
    }

    return $summary;
}


function wallet_student_names(array $summary) {
    $names = array_map(static function ($student) { return trim((string)$student['name']); }, $summary['students']);

    $names = array_values(array_filter($names, static function ($name) { return $name !== ''; }));

    return $names === [] ? [$summary['username']] : $names;
}


function wallet_confirmation_url(array $summary) {
    return rtrim((string)wallet_config('confirmation_base_url'), '/')
        . '/events/graduation-booking-confirmation/?bookingId=' . rawurlencode((string)$summary['booking_id'])
        . '&extrasId=' . rawurlencode((string)($summary['extras']['extra_id'] ?? ''))
        . '&authId=' . rawurlencode($summary['auth_id'])
        . '&username=' . rawurlencode($summary['username']);
}


function wallet_wwdr_pem_path() {
    $path = (string)wallet_config('apple_wwdr_path');

    $contents = is_readable($path) ? (string)file_get_contents($path) : '';

    $pemPath = null;

    if ($contents !== '') {
        if (strpos($contents, '-----BEGIN') !== false) {
            $pemPath = $path;
        } else {
            $pemPath = tempnam(sys_get_temp_dir(), 'wwdr') . '.pem';

            file_put_contents(
                $pemPath,
                "-----BEGIN CERTIFICATE-----\n" . chunk_split(base64_encode($contents), 64, "\n") . "-----END CERTIFICATE-----\n"
            );
        }
    }

    return $pemPath;
}


function wallet_pass_json(array $summary) {
    $names = wallet_student_names($summary);

    $ceremony = $summary['ceremony'];

    $eventStart = (string)graduation_ceremony_iso_datetime($ceremony);

    $dateValue = $eventStart !== '' ? $eventStart : 'To be announced';

    $venueName = $ceremony['locationName'] ?: 'To be announced';

    $venueAddress = $ceremony['locationAddress'] ?: '';

    $pass = [
        'formatVersion'        => WALLET_PASS_FORMAT_VERSION,
        'passTypeIdentifier'   => (string)wallet_config('apple_pass_type_id'),
        'teamIdentifier'       => (string)wallet_config('apple_team_id'),
        'serialNumber'         => 'graduation-' . $summary['booking_id'],
        'organizationName'     => (string)wallet_config('organization_name'),
        'description'          => (string)wallet_config('pass_description'),
        'backgroundColor'      => (string)wallet_config('background_color'),
        'foregroundColor'      => (string)wallet_config('foreground_color'),
        'labelColor'           => (string)wallet_config('label_color'),
        'sharingProhibited'    => true,
        'barcodes'             => [[
            'format'          => 'PKBarcodeFormatQR',
            'message'         => wallet_confirmation_url($summary),
            'messageEncoding' => 'iso-8859-1',
            'altText'         => 'Booking ' . $summary['booking_id'],
        ]],
        'eventTicket'          => [
            'headerFields'    => [[
                'key'   => 'seats',
                'label' => 'SEATS',
                'value' => (string)$summary['seat_count'],
            ]],
            'primaryFields'   => [[
                'key'   => 'student',
                'label' => count($names) > 1 ? 'STUDENTS' : 'STUDENT',
                'value' => implode(', ', $names),
            ]],
            'secondaryFields' => [
                [
                    'key'   => 'event',
                    'label' => 'EVENT',
                    'value' => (string)wallet_config('event_name'),
                ],
                [
                    'key'   => 'date',
                    'label' => 'DATE',
                    'value' => $dateValue,
                ],
            ],
            'auxiliaryFields' => [
                [
                    'key'   => 'venue',
                    'label' => 'VENUE',
                    'value' => $venueName,
                ],
                [
                    'key'   => 'status',
                    'label' => 'STATUS',
                    'value' => $summary['status'],
                ],
            ],
            'backFields'      => [
                [
                    'key'   => 'booking',
                    'label' => 'Booking ID',
                    'value' => (string)$summary['booking_id'],
                ],
                [
                    'key'   => 'username',
                    'label' => 'Booking Username',
                    'value' => $summary['username'],
                ],
                [
                    'key'   => 'address',
                    'label' => 'Address',
                    'value' => $venueAddress,
                ],
                [
                    'key'   => 'confirmation',
                    'label' => 'Booking details',
                    'value' => wallet_confirmation_url($summary),
                ],
            ],
        ],
    ];

    if ($eventStart !== '') {
        $pass['relevantDate'] = $eventStart;
        $pass['eventTicket']['secondaryFields'][1]['dateStyle'] = 'PKDateStyleMedium';
        $pass['eventTicket']['secondaryFields'][1]['timeStyle'] = 'PKDateStyleShort';
        if ($ceremony['locationLatitude'] !== null && $ceremony['locationLongitude'] !== null) {
            $pass['locations'] = [[
                'latitude'     => (float)$ceremony['locationLatitude'],
                'longitude'    => (float)$ceremony['locationLongitude'],
                'relevantText' => (string)wallet_config('event_name'),
            ]];
        }
    }

    return $pass;
}


function wallet_sign_manifest($manifestContents) {
    $signature = null;

    $credentials = wallet_apple_credentials();

    if ($credentials !== null) {
        $wwdrPath = wallet_wwdr_pem_path();

        $manifestPath = tempnam(sys_get_temp_dir(), 'manifest');
        $signaturePath = tempnam(sys_get_temp_dir(), 'signature');

        file_put_contents($manifestPath, $manifestContents);

        $signed = openssl_pkcs7_sign(
            $manifestPath,
            $signaturePath,
            $credentials['cert'],
            [$credentials['pkey'], (string)wallet_config('apple_p12_password')],
            [],
            PKCS7_BINARY | PKCS7_DETACHED,
            $wwdrPath
        );

        if ($signed) {
            $smime = (string)file_get_contents($signaturePath);

            $matched = preg_match(
                '/Content-Transfer-Encoding:\s*base64\r?\n(?:[^\r\n]+\r?\n)*\r?\n(.*?)\r?\n--/s',
                $smime,
                $matches
            );

            if ($matched === 1) {
                $decoded = base64_decode(preg_replace('/[^A-Za-z0-9+\/=]/', '', $matches[1]), true);

                $signature = $decoded === false ? null : $decoded;
            }
        }

        unlink($manifestPath);
        unlink($signaturePath);
    }

    return $signature;
}


function wallet_build_pkpass(array $summary) {
    $package = null;

    $passJson = json_encode(wallet_pass_json($summary), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $files = ['pass.json' => $passJson];

    $imageDir = wallet_assets_dir() . WALLET_PASS_IMAGE_DIR;

    foreach (WALLET_PASS_IMAGE_FILES as $imageName) {
        $imagePath = $imageDir . $imageName;

        if (is_readable($imagePath)) {
            $files[$imageName] = (string)file_get_contents($imagePath);
        }
    }

    $manifest = [];

    foreach ($files as $name => $contents) {
        $manifest[$name] = sha1($contents);
    }

    $manifestContents = json_encode($manifest, JSON_UNESCAPED_SLASHES);

    $signature = wallet_sign_manifest($manifestContents);

    if ($signature !== null && isset($files['icon.png'])) {
        $files['manifest.json'] = $manifestContents;
        $files['signature'] = $signature;

        $archivePath = tempnam(sys_get_temp_dir(), 'pkpass');

        $archive = new ZipArchive();

        if ($archive->open($archivePath, ZipArchive::OVERWRITE) === true) {
            foreach ($files as $name => $contents) {
                $archive->addFromString($name, $contents);
            }

            $archive->close();

            $package = (string)file_get_contents($archivePath);
        }

        unlink($archivePath);
    }

    return $package;
}


function wallet_google_class_id() {
    $issuerId = (string)wallet_config('google_issuer_id');
    $suffix = (string)wallet_config('google_class_suffix');

    return strpos($suffix, $issuerId . '.') === 0 ? $suffix : $issuerId . '.' . $suffix;
}


function wallet_google_object_id(array $summary) {
    return wallet_google_class_id() . '.booking-' . $summary['booking_id'];
}


function wallet_google_event_ticket_class(array $ceremony) {
    $class = [
        'id'                 => wallet_google_class_id(),
        'issuerName'         => (string)wallet_config('organization_name'),
        'eventName'          => ['defaultValue' => ['language' => 'en-US', 'value' => (string)wallet_config('event_name')]],
        'venue'              => [
            'name'    => ['defaultValue' => ['language' => 'en-US', 'value' => (string)($ceremony['locationName'] ?: wallet_config('organization_name'))]],
            'address' => ['defaultValue' => ['language' => 'en-US', 'value' => (string)($ceremony['locationAddress'] ?: '')]],
        ],
        'reviewStatus'       => 'UNDER_REVIEW',
        'hexBackgroundColor' => '#1f2152',
    ];

    $eventStart = (string)graduation_ceremony_iso_datetime($ceremony);

    if ($eventStart !== '') {
        $class['dateTime'] = ['start' => $eventStart];
    }

    return $class;
}


function wallet_google_event_ticket_object(array $summary) {
    $names = wallet_student_names($summary);

    return [
        'id'            => wallet_google_object_id($summary),
        'classId'       => wallet_google_class_id(),
        'state'         => 'ACTIVE',
        'ticketHolderName' => implode(', ', $names),
        'ticketNumber'  => (string)$summary['booking_id'],
        'barcode'       => [
            'type'         => 'QR_CODE',
            'value'        => wallet_confirmation_url($summary),
            'alternateText' => 'Booking ' . $summary['booking_id'],
        ],
        'seatInfo'      => [
            'seat' => ['defaultValue' => ['language' => 'en-US', 'value' => (string)$summary['seat_count']]],
        ],
        'textModulesData' => [
            [
                'id'     => 'status',
                'header' => 'Booking status',
                'body'   => $summary['status'],
            ],
            [
                'id'     => 'username',
                'header' => 'Booking username',
                'body'   => $summary['username'],
            ],
        ],
    ];
}


function wallet_google_save_url(array $summary) {
    $saveUrl = null;

    $serviceAccountPath = (string)wallet_config('google_service_account');

    $serviceAccount = is_readable($serviceAccountPath)
        ? json_decode((string)file_get_contents($serviceAccountPath), true)
        : null;

    if (is_array($serviceAccount) && isset($serviceAccount['client_email'], $serviceAccount['private_key'])) {
        $claims = [
            'iss'     => $serviceAccount['client_email'],
            'aud'     => 'google',
            'typ'     => 'savetowallet',
            'iat'     => time(),
            'origins' => (array)wallet_config('google_origins'),
            'payload' => [
                'eventTicketClasses'  => [wallet_google_event_ticket_class($summary['ceremony'])],
                'eventTicketObjects'  => [wallet_google_event_ticket_object($summary)],
            ],
        ];

        $signingInput = wallet_base64url_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']))
            . '.' . wallet_base64url_encode(json_encode($claims, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

        $signature = '';

        if (openssl_sign($signingInput, $signature, $serviceAccount['private_key'], OPENSSL_ALGO_SHA256)) {
            $saveUrl = WALLET_GOOGLE_SAVE_BASE . $signingInput . '.' . wallet_base64url_encode($signature);
        }
    }

    return $saveUrl;
}
