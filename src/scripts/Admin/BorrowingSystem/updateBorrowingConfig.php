<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
require_once '../../permissionLevels.php';
require_once __DIR__ . '/borrowingHelpers.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

function config_yes_no($value) {
    return in_array(strtolower(trim((string)$value)), ['yes', '1', 'true'], true) ? 1 : 0;
}

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

    $denied = borrowing_require($authorisation, 'edit_policy');

    if ($denied !== null) {
        echo json_encode($denied);
        exit;
    }

    $section = borrowing_trim($data['section'] ?? '', 20);
    $userId  = $authorisation['user_id'];

    if ($section === 'setting') {
        $key      = borrowing_trim($data['setting_key'] ?? '', 64);
        $value    = borrowing_trim($data['setting_value'] ?? '', 255);
        $settings = borrowing_settings($conn, true);

        if (!isset($settings[$key])) {
            echo json_encode(borrowing_error("Unknown setting.", 404));
            exit;
        }

        $setting  = $settings[$key];
        $oldValue = (string)$setting['setting_value'];

        if ($setting['value_kind'] === 'option') {
            $allowed = array_map('trim', explode(',', (string)$setting['options']));

            if (!in_array($value, $allowed, true)) {
                echo json_encode(borrowing_error("Choose one of: " . implode(', ', $allowed) . "."));
                exit;
            }
        } elseif ($setting['value_kind'] === 'month') {
            if (!is_numeric($value) || (int)$value < 1 || (int)$value > 12) {
                echo json_encode(borrowing_error("The month must be a number from 1 to 12."));
                exit;
            }
        } elseif ($setting['value_kind'] === 'number') {
            if (!is_numeric($value) || (int)$value < 0) {
                echo json_encode(borrowing_error("That setting must be a whole number of zero or more."));
                exit;
            }

            $value = (string)(int)$value;
        } elseif ($setting['value_kind'] === 'decimal') {
            if (!is_numeric($value) || (float)$value < 0) {
                echo json_encode(borrowing_error("That setting must be a number of zero or more."));
                exit;
            }

            $value = (string)borrowing_money($value);
        }

        if ($key === 'max_installments' && (int)$value > BORROWING_HARD_MAX_INSTALLMENTS) {
            echo json_encode(borrowing_error("A repayment plan may not run longer than " . BORROWING_HARD_MAX_INSTALLMENTS . " months."));
            exit;
        }

        if ($oldValue === $value) {
            echo json_encode(borrowing_error("That setting already has this value."));
            exit;
        }

        $applyTo = borrowing_trim($data['apply_to'] ?? '', 20);

        if (!in_array($applyTo, ['new_only', 'all_loans'], true)) {
            $configured = borrowing_setting($conn, 'settings_apply_to', 'ask');
            $applyTo    = $configured === 'all_loans' ? 'all_loans' : 'new_only';
        }

        $stmt = $conn->prepare("UPDATE borrowing_settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?");
        $stmt->bind_param("sis", $value, $userId, $key);
        $stmt->execute();
        $stmt->close();

        borrowing_settings($conn, true);

        $rebuilt = [];

        if ($applyTo === 'all_loans') {
            $touchesSchedule = in_array($key, ['max_installments', 'installment_rounding'], true);
            $result = $conn->query(
                "SELECT id FROM borrowing_applications WHERE status = 'approved' AND settled_at IS NULL"
            );
            $running = [];

            while ($row = $result->fetch_assoc()) {
                $running[] = (int)$row['id'];
            }

            foreach ($running as $applicationId) {
                borrowing_stamp_effective_settings($conn, $applicationId);

                if (!$touchesSchedule || borrowing_rebuild_schedule($conn, $applicationId)) {
                    $rebuilt[] = $applicationId;
                }
            }
        }

        $stmt = $conn->prepare(
            "INSERT INTO borrowing_settings_audit
                (setting_key, old_value, new_value, applied_to, rebuilt_count, rebuilt_ids, changed_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $count = count($rebuilt);
        $ids   = borrowing_trim(implode(',', $rebuilt), 65535);
        $stmt->bind_param("ssssisi", $key, $oldValue, $value, $applyTo, $count, $ids, $userId);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "code"    => 200,
            "message" => $count > 0
                ? "Saved. " . $count . " running contract" . ($count === 1 ? '' : 's') . " rebuilt against the new setting."
                : "Saved. Contracts already running were left on their original terms.",
            "rebuilt" => $count,
        ]);
        exit;
    }

    if ($section === 'matrix') {
        $scoreMin = (int)($data['score_min'] ?? -1);
        $grade    = borrowing_trim($data['grade_label'] ?? '', 40);

        if ($grade === '') {
            echo json_encode(borrowing_error("The grade needs a name."));
            exit;
        }

        $multipliers = [];
        $flats       = [];

        for ($bracket = 0; $bracket < 5; $bracket++) {
            $multiplier = $data['m' . $bracket] ?? 0;
            $flat       = $data['f' . $bracket] ?? 0;

            if (!is_numeric($multiplier) || (float)$multiplier < 0 || (float)$multiplier > 999) {
                echo json_encode(borrowing_error("Every multiplier must be a number between 0 and 999."));
                exit;
            }

            if (!is_numeric($flat) || (float)$flat < 0) {
                echo json_encode(borrowing_error("Every flat amount must be a number of zero or more."));
                exit;
            }

            $multipliers[] = round((float)$multiplier, 2);
            $flats[]       = borrowing_money($flat);
        }

        $stmt = $conn->prepare(
            "UPDATE borrowing_limit_matrix
             SET grade_label = ?, m0 = ?, m1 = ?, m2 = ?, m3 = ?, m4 = ?,
                 f0 = ?, f1 = ?, f2 = ?, f3 = ?, f4 = ?
             WHERE score_min = ?"
        );
        $stmt->bind_param(
            "sddddddddddi",
            $grade,
            $multipliers[0], $multipliers[1], $multipliers[2], $multipliers[3], $multipliers[4],
            $flats[0], $flats[1], $flats[2], $flats[3], $flats[4],
            $scoreMin
        );
        $stmt->execute();
        $changed = $stmt->affected_rows;
        $stmt->close();

        if ($changed === 0) {
            echo json_encode(borrowing_error("That score band is not in the matrix.", 404));
            exit;
        }

        echo json_encode(["success" => true, "code" => 200, "message" => "Matrix row saved."]);
        exit;
    }

    if ($section === 'band') {
        $factor    = borrowing_trim($data['factor'] ?? '', 20);
        $bandIndex = (int)($data['band_index'] ?? -1);
        $label     = borrowing_trim($data['label'] ?? '', 80);
        $score     = (int)($data['score'] ?? 0);
        $rawLimit  = trim((string)($data['threshold'] ?? ''));
        $threshold = ($rawLimit === '' || strtolower($rawLimit) === 'and above') ? null : (int)$rawLimit;

        if (!in_array($factor, ['attendance', 'commitment', 'years_bonus', 'years_bracket'], true)) {
            echo json_encode(borrowing_error("Unknown score band group."));
            exit;
        }

        if ($label === '') {
            echo json_encode(borrowing_error("The band needs a label. It is what the person filling the form reads."));
            exit;
        }

        if ($score < 0 || $score > 100) {
            echo json_encode(borrowing_error("A band score must be between 0 and 100."));
            exit;
        }

        if ($threshold !== null) {
            $stmt = $conn->prepare(
                "UPDATE borrowing_score_bands SET threshold = ?, score = ?, label = ?
                 WHERE factor = ? AND band_index = ?"
            );
            $stmt->bind_param("iissi", $threshold, $score, $label, $factor, $bandIndex);
        } else {
            $stmt = $conn->prepare(
                "UPDATE borrowing_score_bands SET threshold = NULL, score = ?, label = ?
                 WHERE factor = ? AND band_index = ?"
            );
            $stmt->bind_param("issi", $score, $label, $factor, $bandIndex);
        }

        $stmt->execute();
        $changed = $stmt->affected_rows;
        $stmt->close();

        if ($changed === 0) {
            echo json_encode(borrowing_error("That band is not configured.", 404));
            exit;
        }

        echo json_encode(["success" => true, "code" => 200, "message" => "Band saved."]);
        exit;
    }

    if ($section === 'capability') {
        $capability = borrowing_trim($data['capability_key'] ?? '', 40);

        if (!in_array($capability, BORROWING_CAPABILITIES, true)) {
            echo json_encode(borrowing_error("Unknown capability.", 404));
            exit;
        }

        if (config_yes_no($data['board'] ?? 'Yes') !== 1) {
            echo json_encode(borrowing_error(
                "The board keeps every capability, including " . str_replace('_', ' ', $capability)
                . ". A role that can switch off its own access can lock everyone out."
            ));
            exit;
        }

        $stmt = $conn->prepare(
            "UPDATE borrowing_role_capabilities SET is_enabled = ?, updated_by = ?
             WHERE role_key = ? AND capability_key = ?"
        );

        foreach (['hr', 'accounting'] as $roleKey) {
            $enabled = config_yes_no($data[$roleKey] ?? 'No');
            $stmt->bind_param("iiss", $enabled, $userId, $roleKey, $capability);
            $stmt->execute();
        }

        $enabled   = 1;
        $boardRole = 'board';
        $stmt->bind_param("iiss", $enabled, $userId, $boardRole, $capability);
        $stmt->execute();
        $stmt->close();

        echo json_encode(["success" => true, "code" => 200, "message" => "Capability saved."]);
        exit;
    }

    if ($section === 'email') {
        $event = borrowing_trim($data['event_key'] ?? '', 40);

        if (!in_array($event, BORROWING_EMAIL_EVENTS, true)) {
            echo json_encode(borrowing_error("Unknown notification.", 404));
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO borrowing_email_rules (event_key, recipient_key, is_enabled, updated_by)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), updated_by = VALUES(updated_by)"
        );

        foreach (BORROWING_EMAIL_RECIPIENTS as $recipientKey) {
            $enabled = config_yes_no($data[$recipientKey] ?? 'No');
            $stmt->bind_param("ssii", $event, $recipientKey, $enabled, $userId);
            $stmt->execute();
        }

        $stmt->close();

        echo json_encode(["success" => true, "code" => 200, "message" => "Notification saved."]);
        exit;
    }

    echo json_encode(borrowing_error("Unknown settings section."));
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
