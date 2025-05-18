<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode([
            "success" => false,
            "message" => "Method Not Allowed",
            "code" => 405
        ]);
        exit;
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['session_id'])) {
        echo json_encode([
            "success" => false,
            "message" => "Bad Request: Missing session_id",
            "code" => 400
        ]);
        exit;
    }

    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            "success" => false,
            "message" => "Database connection failed",
            "code" => 500
        ]);
        exit;
    }

    $sessionId = $conn->real_escape_string($data['session_id']);
    $sql = "SELECT u.permission_level 
            FROM admin_sessions s
            JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
            WHERE s.id = '$sessionId'";
    $result = $conn->query($sql);

    if ($result->num_rows == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid session",
            "code" => 404
        ]);
        exit;
    }

    $row = $result->fetch_assoc();
    $cleanPermissionLevels = [];

    if ($row['permission_level'] === "0") {
        $cleanPermissionLevels = [0];
    }
    elseif ($row['permission_level'] !== "" && $row['permission_level'] !== null) {
        $permissionLevels = explode(',', $row['permission_level']);
        $cleanPermissionLevels = [];

        foreach ($permissionLevels as $level) {
            $trimmedLevel = trim($level);
            if ($trimmedLevel !== "") {
                $cleanPermissionLevels[] = intval($trimmedLevel);
            }
        }
    }

    $dashboardOptions = [];
    $allDashboardOptions = [
        0 => [
            [
                "title" => "Job Applications",
                "image" => '/assets/images/Dashboard/JobApplications.png',
                "description" => "View and manage job applications",
                "link" => '/admin/job-applications',
                "buttonText" => 'View Applications',
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        1 => [
            [
                "title" => "Event Bookings",
                "image" => '/assets/images/Dashboard/BookingManagement.png',
                "description" => "View & Manage Bookings",
                "link" => '/admin/booking-management',
                "buttonText" => 'View Bookings',
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ]
    ];

    foreach ($cleanPermissionLevels as $level) {
        if (isset($allDashboardOptions[$level])) {
            $dashboardOptions = array_merge($dashboardOptions, $allDashboardOptions[$level]);
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Session is valid",
        "permissionLevels" => $cleanPermissionLevels,
        "dashboardOptions" => $dashboardOptions,
        "code" => 200
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500
    ]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>