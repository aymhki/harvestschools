<?php
require_once '../../headers.php';
require_once 'graduationBookingAuthHelpers.php';
set_cors_headers();

$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';

$conn = null;

function gb_curriculum_group($normalizedDivision) {
    $group = ['international', 'american', 'british', 'national'];
    return in_array($normalizedDivision, $group, true);
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

    if (!gb_recovery_throttle($conn, 'search')) {
        echo json_encode(["success" => false, "message" => "Too many searches. Please slow down and try again shortly.", "code" => 429]);
        exit;
    }

    $data       = json_decode(file_get_contents('php://input'), true);
    $query      = is_array($data) ? trim((string)($data['query'] ?? '')) : '';
    $gradeIn    = is_array($data) ? trim((string)($data['grade'] ?? '')) : '';
    $divisionIn = is_array($data) ? trim((string)($data['department'] ?? '')) : '';
    $returnAll  = is_array($data) ? !empty($data['all']) : false;

    if ($returnAll) {
        $all = [];
        $res = $conn->query(
            "SELECT DISTINCT s.student_id, s.name, s.grade, s.school_division
             FROM graduation_booking_students s
             JOIN graduation_booking_students_linker sl ON sl.student_id = s.student_id
             ORDER BY s.name ASC
             LIMIT 5000"
        );
        if ($res) {
            while ($r = $res->fetch_assoc()) {
                $label = trim($r['name'])
                    . ' · ' . trim((string)$r['grade'])
                    . ' · ' . trim((string)$r['school_division']);
                $all[] = [
                    'student_id' => (int)$r['student_id'],
                    'label'      => $label,
                    'name'       => $r['name'],
                    'grade'      => $r['grade'],
                    'division'   => $r['school_division'],
                ];
            }
        }
        echo json_encode(["success" => true, "results" => $all, "code" => 200]);
        exit;
    }

    $minLen = (int)gb_config('search_min_query_length');
    $maxOut = (int)gb_config('search_max_results');

    if (mb_strlen($query) < $minLen) {
        echo json_encode(["success" => true, "results" => [], "code" => 200]);
        exit;
    }

    $qNorm      = tm_normalize($query);
    $gradeNorm  = tm_normalize($gradeIn);
    $divNorm    = tm_normalize($divisionIn);
    $qLatin  = tm_latin_key($query);
    $likeRaw = '%' . $qNorm . '%';
    $qLatinFirst = trim(explode(' ', $qLatin)[0] ?? '');
    $likeLatin = '%' . ($qLatinFirst !== '' ? $qLatinFirst : $qLatin) . '%';
    $candidates = [];

    $sql = "
        SELECT s.student_id, s.name, s.grade, s.school_division
        FROM graduation_booking_students s
        LEFT JOIN graduation_booking_students_search_index i ON i.student_id = s.student_id
        WHERE LOWER(s.name) LIKE ?
           OR i.name_normalized LIKE ?
           OR i.name_latin LIKE ?
        LIMIT 400";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $likeRaw, $likeRaw, $likeLatin);
    $stmt->execute();
    $res = $stmt->get_result();
    $stmt->close();
    while ($r = $res->fetch_assoc()) { $candidates[$r['student_id']] = $r; }

    if (count($candidates) < $maxOut) {
        $stmt = $conn->prepare("SELECT student_id, name, grade, school_division FROM graduation_booking_students LIMIT 2000");
        $stmt->execute();
        $res = $stmt->get_result();
        $stmt->close();
        while ($r = $res->fetch_assoc()) {
            if (!isset($candidates[$r['student_id']])) { $candidates[$r['student_id']] = $r; }
        }
    }

    $scored = [];
    foreach ($candidates as $c) {
        $nameScore = tm_name_score($query, $c['name']);
        if ($nameScore < 0.45) { continue; }

        if ($gradeNorm !== '') {
            $cGrade = tm_normalize($c['grade']);
            if ($cGrade === $gradeNorm) { $nameScore += 0.15; }
            else { $nameScore -= 0.10; }
        }

        if ($divNorm !== '') {
            $cDiv = tm_normalize($c['school_division']);
            if ($cDiv === $divNorm) {
                $nameScore += 0.15;
            } elseif (gb_curriculum_group($cDiv) && gb_curriculum_group($divNorm)) {
                $nameScore += 0.02;
            } else {
                $nameScore -= 0.05;
            }
        }

        gb_upsert_student_search_index($conn, (int)$c['student_id'], $c['name'], $c['grade'], $c['school_division']);

        $label = trim($c['name'])
            . ' · ' . trim((string)$c['grade'])
            . ' · ' . trim((string)$c['school_division']);

        $scored[] = [
            'student_id' => (int)$c['student_id'],
            'label'      => $label,
            'name'       => $c['name'],
            'grade'      => $c['grade'],
            'division'   => $c['school_division'],
            '_score'     => $nameScore,
        ];
    }

    usort($scored, function ($a, $b) {
        return $b['_score'] <=> $a['_score'];
    });

    $results = array_slice(array_map(function ($s) {
        unset($s['_score']);
        return $s;
    }, $scored), 0, $maxOut);

    echo json_encode(["success" => true, "results" => $results, "code" => 200]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) { $conn->close(); }
}
