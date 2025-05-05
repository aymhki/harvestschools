<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Method Not Allowed", 405);
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!isset($data['session_id'])) {
        throw new Exception("Bad Request: Missing session_id", 400);
    }

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    $sessionId = $conn->real_escape_string($data['session_id']);

    $sql = "SELECT u.permission_level 
            FROM sessions s
            JOIN users u ON LOWER(s.username) = LOWER(u.username)
            WHERE s.id = '$sessionId'";

    $result = $conn->query($sql);

    if ($result->num_rows == 0) {
        throw new Exception("Invalid session", 404);
    }

    $row = $result->fetch_assoc();
    $permissionLevels = explode(',', $row['permission_level']);

    $cleanPermissionLevels = array_map(function($level) {
        return intval(trim($level));
    }, $permissionLevels);

    $dashboardOptions = [];

    $allDashboardOptions = [
        0 => [
            [
                "title" => "Job Applications",
                "image" => '/assets/images/Dashboard/JobApplications.png',
                "description" => "View and manage job applications",
                "link" => '/job-applications',
                "buttonText" => 'View Applications',
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        1 => [
            [
                "title" => "Event Booking",
                "image" => '/assets/images/Dashboard/BookingManagement.png',
                "description" => "View Bookings",
                "link" => '/booking-management',
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
        "permissionLevels" => $cleanPermissionLevels,
        "dashboardOptions" => $dashboardOptions
    ]);

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode(["error" => $e->getMessage()]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>