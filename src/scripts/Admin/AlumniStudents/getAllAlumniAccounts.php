<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();

$conn = null;

try {
    $conn = new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $ALUMNI_STUDENTS_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $ALUMNI_STUDENTS_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $accountsHeaders = ["ID", "Username", "Name", "Email", "Position", "Graduation Date", "Status", "Pending Update", "Profile Picture", "Signed Up", "Last Login"];
    $accountsRows = [];
    $accountRecordsById = [];

    $accountsSql =
        "SELECT a.id, a.username, a.name, a.email, a.position,
                DATE_FORMAT(a.graduation_date, '%Y-%m-%d') AS graduation_date,
                a.bio, a.profile_picture_link, a.account_status, a.admin_note,
                DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i') AS created_label,
                DATE_FORMAT(a.last_login_at, '%Y-%m-%d %H:%i') AS last_login_label,
                (SELECT COUNT(*) FROM alumni_profile_updates u WHERE u.alumni_id = a.id AND u.status = 'pending') AS pending_updates
         FROM alumni_students a
         ORDER BY a.created_at DESC";

    $result = $conn->query($accountsSql);

    if (!$result) {
        echo json_encode(["success" => false, "message" => "Query failed: " . $conn->error, "code" => 500]);
        exit;
    }

    while ($row = $result->fetch_assoc()) {
        $accountId = (int)$row['id'];

        $accountsRows[] = [
            (string)$accountId,
            (string)$row['username'],
            (string)$row['name'],
            (string)$row['email'],
            (string)$row['position'],
            (string)($row['graduation_date'] ?? ''),
            ucfirst((string)$row['account_status']),
            ((int)$row['pending_updates'] > 0) ? 'Yes' : 'No',
            (string)$row['profile_picture_link'],
            (string)$row['created_label'],
            (string)($row['last_login_label'] ?? ''),
        ];

        $accountRecordsById[(string)$accountId] = [
            "id"                 => $accountId,
            "username"           => $row['username'],
            "name"               => $row['name'],
            "email"              => $row['email'],
            "position"           => $row['position'],
            "graduationDate"     => $row['graduation_date'],
            "bio"                => $row['bio'],
            "profilePictureLink" => $row['profile_picture_link'],
            "accountStatus"      => $row['account_status'],
            "adminNote"          => $row['admin_note'],
            "signedUpAt"         => $row['created_label'],
            "lastLoginAt"        => $row['last_login_label'],
            "hasPendingUpdate"   => (int)$row['pending_updates'] > 0,
        ];
    }

    $updatesHeaders = ["ID", "Username", "Name", "Status", "Changed Fields", "Submitted", "Reviewed"];
    $updatesRows = [];
    $updateRecordsById = [];

    $updatesSql =
        "SELECT u.id, u.alumni_id, u.new_username, u.new_name, u.new_email, u.new_position,
                DATE_FORMAT(u.new_graduation_date, '%Y-%m-%d') AS new_graduation_date,
                u.new_bio, u.new_profile_picture_link, u.status, u.admin_note,
                DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i') AS created_label,
                DATE_FORMAT(u.reviewed_at, '%Y-%m-%d %H:%i') AS reviewed_label,
                a.username AS current_username, a.name AS current_name, a.email AS current_email,
                a.position AS current_position,
                DATE_FORMAT(a.graduation_date, '%Y-%m-%d') AS current_graduation_date,
                a.bio AS current_bio, a.profile_picture_link AS current_profile_picture_link
         FROM alumni_profile_updates u
         JOIN alumni_students a ON a.id = u.alumni_id
         ORDER BY (u.status = 'pending') DESC, u.created_at DESC";

    $result = $conn->query($updatesSql);

    if (!$result) {
        echo json_encode(["success" => false, "message" => "Query failed: " . $conn->error, "code" => 500]);
        exit;
    }

    while ($row = $result->fetch_assoc()) {
        $updateId = (int)$row['id'];
        $changedFields = [];

        if ($row['new_username'] !== null) { $changedFields[] = 'Username'; }
        if ($row['new_name'] !== null) { $changedFields[] = 'Name'; }
        if ($row['new_email'] !== null) { $changedFields[] = 'Email'; }
        if ($row['new_position'] !== null) { $changedFields[] = 'Position'; }
        if ($row['new_graduation_date'] !== null) { $changedFields[] = 'Graduation Date'; }
        if ($row['new_bio'] !== null) { $changedFields[] = 'Bio'; }
        if ($row['new_profile_picture_link'] !== null) { $changedFields[] = 'Profile Picture'; }

        $updatesRows[] = [
            (string)$updateId,
            (string)$row['current_username'],
            (string)$row['current_name'],
            ucfirst((string)$row['status']),
            implode(', ', $changedFields),
            (string)$row['created_label'],
            (string)($row['reviewed_label'] ?? ''),
        ];

        $updateRecordsById[(string)$updateId] = [
            "id"        => $updateId,
            "alumniId"  => (int)$row['alumni_id'],
            "status"    => $row['status'],
            "adminNote" => $row['admin_note'],
            "submittedAt" => $row['created_label'],
            "reviewedAt"  => $row['reviewed_label'],
            "current" => [
                "username"           => $row['current_username'],
                "name"               => $row['current_name'],
                "email"              => $row['current_email'],
                "position"           => $row['current_position'],
                "graduationDate"     => $row['current_graduation_date'],
                "bio"                => $row['current_bio'],
                "profilePictureLink" => $row['current_profile_picture_link'],
            ],
            "requested" => [
                "username"           => $row['new_username'],
                "name"               => $row['new_name'],
                "email"              => $row['new_email'],
                "position"           => $row['new_position'],
                "graduationDate"     => $row['new_graduation_date'],
                "bio"                => $row['new_bio'],
                "profilePictureLink" => $row['new_profile_picture_link'],
            ],
        ];
    }

    echo json_encode([
        "success"            => true,
        "message"            => "Data retrieved successfully",
        "code"               => 200,
        "accountsData"       => array_merge([$accountsHeaders], $accountsRows),
        "accountRecordsById" => $accountRecordsById,
        "updatesData"        => array_merge([$updatesHeaders], $updatesRows),
        "updateRecordsById"  => $updateRecordsById,
    ]);

} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}
