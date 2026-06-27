<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
set_cors_headers();
$dbConfig = require '../../dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];
$dbEncryptionKeyPhrase = $dbConfig['encryption_key_phrase'];


function prependIncrementingId(array $data): array {
    $data[0] = array_merge(["ID"], $data[0]);
    for ($i = 1; $i < count($data); $i++) {
        $data[$i] = array_merge([$i], $data[$i]);
    }
    return $data;
}


function moveColumnFirst(array $data, string $columnHeader): array {
    $headerRow = $data[0];
    $colIndex = array_search($columnHeader, $headerRow);
    if ($colIndex === false) {
        return $data;
    }
    foreach ($data as &$row) {
        $value = array_splice($row, $colIndex, 1);
        array_unshift($row, $value[0]);
    }
    unset($row);
    return $data;
}

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }
    $conn->set_charset("utf8mb4");
    $authStatus = check_user_permission($conn, 7);
    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $settingsHeaders = ["Setting Key", "Value", "Is Encrypted", "Description"];
    $settingsRows = [];
    $stmt = $conn->prepare("SELECT setting_key, IF(is_encrypted, CAST(AES_DECRYPT(UNHEX(setting_value), ?) AS CHAR), setting_value) AS val, is_encrypted, description FROM info_system_global_settings");
    $stmt->bind_param("s", $dbEncryptionKeyPhrase);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        if ($row['val'] === '0' || $row['val'] === '1') {
            $row['val'] = $row['val'] === '1' ? 'Yes' : 'No';
        }
        $row['is_encrypted'] = $row['is_encrypted'] == 1 ? 'Yes' : 'No';
        $settingsRows[] = array_values($row);
    }
    $stmt->close();
    $settingsData = prependIncrementingId(array_merge([$settingsHeaders], $settingsRows));

    $deptHeaders = ["Department Key", "Name (EN)", "Name (AR)", "Contact Number", "Is Academic"];
    $deptRows = [];
    $res = $conn->query("SELECT dept_key, name_en, name_ar, contact_number, is_academic FROM info_system_departments");
    while ($row = $res->fetch_assoc()) {
        $row['is_academic'] = $row['is_academic'] == 1 ? 'Yes' : 'No';
        $deptRows[] = array_values($row);
    }
    $deptData = prependIncrementingId(array_merge([$deptHeaders], $deptRows));

    $stageHeaders = [
        "Stage Key", "Department Key", "Section Key", "Section Title (EN)",
        "Section Title (AR)", "Name (EN)", "Name (AR)", "Is Offered",
        "Age (EN)", "Age (AR)", "Tuition Fees", "ID"
    ];
    $stageRows = [];
    $res = $conn->query("SELECT stage_key, dept_key, section_key, section_title_en, section_title_ar, name_en, name_ar, is_offered, age_en, age_ar, tuition_fees, sort_order FROM info_system_stages ORDER BY dept_key, sort_order ASC");
    while ($row = $res->fetch_assoc()) {
        $row['is_offered'] = $row['is_offered'] == 1 ? 'Yes' : 'No';
        $stageRows[] = array_values($row);
    }
    $stageData = moveColumnFirst(array_merge([$stageHeaders], $stageRows), "ID");

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "data" => [
            "settings" => $settingsData,
            "departments" => $deptData,
            "stages" => $stageData
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>