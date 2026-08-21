<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/borrowingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

try {
    $data = json_decode((string)file_get_contents('php://input'), true) ?? [];
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    $conn->set_charset("utf8mb4");
    $authorisation = borrowing_authorise($conn);

    if (!$authorisation['success']) {
        echo json_encode($authorisation);
        exit;
    }

    if (!borrowing_can($authorisation, 'submit_application')
        && !borrowing_can($authorisation, 'review_application')) {
        echo json_encode(borrowing_error("Permission denied", 403));
        exit;
    }

    $employeeCode = borrowing_trim($data['employee_code'] ?? '', 32);
    $employee     = borrowing_employee($conn, $employeeCode);

    if ($employee === null) {
        echo json_encode(borrowing_error("That employee is not in the staff directory.", 404));
        exit;
    }

    $mode         = borrowing_setting($conn, 'attendance_input_mode', 'bands');
    $contractYear = borrowing_contract_year($conn);
    $band         = -1;
    $days         = -1;
    $recorded     = [];

    // Basic salary, when the eligibility check is allowed to ask for it.
    $salaryRaw = $data['basic_salary'] ?? '';

    if ($salaryRaw !== '' && $salaryRaw !== null) {
        if (!borrowing_setting_is($conn, 'salary_capture', 'eligibility_form')) {
            echo json_encode(borrowing_error(
                "The basic salary is read from the staff record under the current settings, "
                . "so it cannot be typed here."
            ));
            exit;
        }

        if (!is_numeric($salaryRaw) || borrowing_money($salaryRaw) <= 0) {
            echo json_encode(borrowing_error("Enter the basic salary as a number greater than zero."));
            exit;
        }

        $salary = borrowing_money($salaryRaw);
        $stmt   = $conn->prepare("UPDATE staff_employees SET basic_salary = ? WHERE employee_code = ?");
        $stmt->bind_param("ds", $salary, $employeeCode);
        $stmt->execute();
        $stmt->close();
        $recorded[] = 'basic salary';
    }

    // Hire date, when the eligibility check is allowed to ask for it.
    $hireRaw = borrowing_trim($data['hire_date'] ?? '', 32);

    if ($hireRaw !== '') {
        if (!borrowing_setting_is($conn, 'hire_date_capture', 'eligibility_form')) {
            echo json_encode(borrowing_error(
                "The hire date is read from the staff record under the current settings, "
                . "so it cannot be typed here."
            ));
            exit;
        }

        $hire = borrowing_valid_date($hireRaw);

        if ($hire === null || strtotime($hire) > time()) {
            echo json_encode(borrowing_error("Enter a hire date that is a real date in the past."));
            exit;
        }

        $stmt = $conn->prepare("UPDATE staff_employees SET hire_date = ? WHERE employee_code = ?");
        $stmt->bind_param("ss", $hire, $employeeCode);
        $stmt->execute();
        $stmt->close();
        $recorded[] = 'hire date';
    }

    $attendanceGiven = ($data['attendance_band'] ?? '') !== '' || ($data['attendance_days'] ?? '') !== '';

    if (!$attendanceGiven) {
        if ($recorded === []) {
            echo json_encode(borrowing_error("Nothing was given to record."));
            exit;
        }

        echo json_encode(["success" => true, "code" => 200,
                          "message" => ucfirst(borrowing_join_words($recorded)) . " recorded."]);
        exit;
    }

    if ($mode === 'not_scored') {
        echo json_encode(borrowing_error("Attendance is not scored under the current settings."));
        exit;
    }

    if (!borrowing_setting_is($conn, 'attendance_capture', 'eligibility_form')) {
        echo json_encode(borrowing_error(
            "Attendance is read from the staff record under the current settings, so it cannot be typed here."
        ));
        exit;
    }

    if ($mode === 'exact_days') {
        $raw = $data['attendance_days'] ?? '';

        if (!is_numeric($raw) || (int)$raw < 0 || (int)$raw > 400) {
            echo json_encode(borrowing_error("Enter the number of days absent, between 0 and 400."));
            exit;
        }

        $days    = (int)$raw;
        $matched = borrowing_attendance_band_for_days($conn, $days);
        $band    = $matched === null ? 0 : $matched['score'];
    } else {
        $label = borrowing_trim($data['attendance_band'] ?? '', 80);
        $score = borrowing_band_score_for_label($conn, 'attendance', $label);

        if ($score === null) {
            echo json_encode(borrowing_error("Choose one of the attendance bands."));
            exit;
        }

        $band = $score;
    }

    // Bands mode carries no day count, so the stored one is preserved rather than wiped.
    if ($days >= 0) {
        $stmt = $conn->prepare(
            "UPDATE staff_employees
             SET attendance_band = ?, attendance_days = ?, attendance_year = ?
             WHERE employee_code = ?"
        );
        $stmt->bind_param("iiis", $band, $days, $contractYear, $employeeCode);
    } else {
        $stmt = $conn->prepare(
            "UPDATE staff_employees
             SET attendance_band = ?, attendance_year = ?
             WHERE employee_code = ?"
        );
        $stmt->bind_param("iis", $band, $contractYear, $employeeCode);
    }

    $stmt->execute();
    $stmt->close();

    $recorded[] = 'attendance for the ' . $contractYear . '/' . ($contractYear + 1) . ' contract year';

    echo json_encode([
        "success" => true,
        "message" => ucfirst(borrowing_join_words($recorded)) . " recorded.",
        "code"    => 200,
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
