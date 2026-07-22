<?php
require_once '../../headers.php';
require_once 'graduationBookingAuthHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

function gb_usernames_for_booking_ids($conn, array $bookingIds) {
    $usernames = [];
    foreach (array_unique($bookingIds) as $bid) {
        $bid = (int)$bid;
        $stmt = $conn->prepare(
            "SELECT ac.username
             FROM graduation_bookings b
             JOIN graduation_booking_auth_credentials ac ON ac.auth_id = b.auth_id
             WHERE b.booking_id = ?"
        );
        $stmt->bind_param("i", $bid);
        $stmt->execute();
        $r = $stmt->get_result();
        $stmt->close();
        while ($row = $r->fetch_assoc()) {
            if (!empty($row['username'])) { $usernames[$row['username']] = true; }
        }
    }
    return array_keys($usernames);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Method Not Allowed", "code" => 405]);
        exit;
    }

    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);
    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Database connection failed", "code" => 500]);
        exit;
    }
    $conn->set_charset("utf8mb4");

    if (!gb_recovery_throttle($conn, 'recover')) {
        echo json_encode(["success" => false, "message" => "Too many attempts. Please wait a while and try again.", "code" => 429]);
        exit;
    }

    $data   = json_decode(file_get_contents('php://input'), true);
    $method = is_array($data) ? (string)($data['method'] ?? '') : '';
    $lang   = (is_array($data) && ($data['lang'] ?? '') === 'ar') ? 'ar' : 'en';

    $notFound = [
        "success"  => true,
        "found"    => false,
        "message"  => $lang === 'ar'
            ? "لم نتمكن من العثور على حجز مطابق. يرجى المحاولة بطريقة أخرى أو التواصل مع المدرسة."
            : "We couldn't find a matching booking. Try another detail or contact the school.",
        "code"     => 200
    ];

    $bookingIds = [];

    if ($method === 'student') {
        $studentId = (int)($data['student_id'] ?? 0);
        if ($studentId <= 0) {
            echo json_encode(["success" => false, "message" => "Please choose your child from the list.", "code" => 400]);
            exit;
        }

        $stmt = $conn->prepare(
            "SELECT sl.booking_id
             FROM graduation_booking_students_linker sl
             WHERE sl.student_id = ?"
        );
        $stmt->bind_param("i", $studentId);
        $stmt->execute();
        $r = $stmt->get_result();
        $stmt->close();
        while ($row = $r->fetch_assoc()) { $bookingIds[] = (int)$row['booking_id']; }

    } elseif ($method === 'email') {
        $value = trim((string)($data['value'] ?? ''));
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(["success" => false, "message" => "Please enter a valid email address.", "code" => 400]);
            exit;
        }
        $target = tm_normalize($value); // lowercased/trimmed, arabic-digit folded

        // Prefilter by local part, then confirm with normalized equality.
        $localLike = '%' . tm_normalize(explode('@', $value)[0]) . '%';
        $stmt = $conn->prepare(
            "SELECT pl.booking_id, p.email
             FROM graduation_booking_parents p
             JOIN graduation_booking_parents_linker pl ON pl.parent_id = p.parent_id
             WHERE p.email <> '' AND LOWER(p.email) LIKE ?
             LIMIT 500"
        );
        $stmt->bind_param("s", $localLike);
        $stmt->execute();
        $r = $stmt->get_result();
        $stmt->close();
        while ($row = $r->fetch_assoc()) {
            if (tm_normalize($row['email']) === $target) { $bookingIds[] = (int)$row['booking_id']; }
        }

    } elseif ($method === 'phone') {
        $value = trim((string)($data['value'] ?? ''));
        if (!tm_phone_looks_valid($value)) {
            echo json_encode(["success" => false, "message" => "Please enter a valid phone number.", "code" => 400]);
            exit;
        }

        // Phone formats vary wildly; scan candidates and match on NSN/tail.
        $stmt = $conn->prepare(
            "SELECT pl.booking_id, p.phone_number
             FROM graduation_booking_parents p
             JOIN graduation_booking_parents_linker pl ON pl.parent_id = p.parent_id
             WHERE p.phone_number <> ''
             LIMIT 5000"
        );
        $stmt->execute();
        $r = $stmt->get_result();
        $stmt->close();
        while ($row = $r->fetch_assoc()) {
            if (tm_phone_match($value, $row['phone_number'])) { $bookingIds[] = (int)$row['booking_id']; }
        }

    } else {
        echo json_encode(["success" => false, "message" => "Unsupported recovery method.", "code" => 400]);
        exit;
    }

    if (empty($bookingIds)) {
        echo json_encode($notFound);
        exit;
    }

    $usernames = gb_usernames_for_booking_ids($conn, $bookingIds);

    if (empty($usernames)) {
        echo json_encode($notFound);
        exit;
    }

    echo json_encode([
        "success"   => true,
        "found"     => true,
        "usernames" => array_values($usernames),
        "code"      => 200
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
