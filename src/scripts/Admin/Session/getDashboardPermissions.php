<?php
require_once '../../headers.php';
set_cors_headers();
$dbConfig = require '../../dbConfig.php';
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

    $conn->set_charset("utf8mb4");
    $sessionId = $data['session_id'];
    $stmt = $conn->prepare("SELECT u.permission_level 
                          FROM admin_sessions s
                          JOIN admin_users u ON s.user_id = u.id
                          WHERE s.id = ?");

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "message" => "Prepare failed: " . $conn->error,
            "code" => 500
        ]);
        exit;
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

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
        1000 => [
            [
                "title" => "Admin Users",
                "image" => "/images/Dashboard/AdminUsers.png",
                "description" => "View & manage admin users",
                "link" => "/admin-users-management",
                "buttonText" => "View Users",
                "titleInArabic" => false
            ]
        ],
        0 => [
            [
                "title" => "Job Applications",
                "image" => '/images/Dashboard/JobApplications.png',
                "description" => "View & manage job applications",
                "link" => '/job-applications',
                "buttonText" => 'View Applications',
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        1 => [
            [
                "title" => "Graduation Bookings",
                "image" => '/images/Dashboard/GraduationBookingManagement.png',
                "description" => "View & manage Graduatuin Bookings",
                "link" => '/graduation-booking-management',
                "buttonText" => 'View Bookings',
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        2 => [
            [
                "title" => "Open Day Signups",
                "image" => "/images/Dashboard/OpenDaySignups.png",
                "description" => "View & manage open day signups",
                "link" => "/open-day-signups-management",
                "buttonText" => "View Signups",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]

        ],
        3 => [
            [
                "title" => "Borrowing  System",
                "image" => "/images/Dashboard/BorrowingSystem.png",
                "description" => "View the borrowing system",
                "link" => "/borrowing-system-management",
                "buttonText" => "View System",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        7 => [
            [
                "title" => "Info System",
                "image" => "/images/Dashboard/InfoSystem.png",
                "description" => "View & manage the school's info system",
                "link" => "/info-system-management",
                "buttonText" => "View System",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        13 => [
            [
                "title" => "Alumni Students",
                "image" => "/images/Dashboard/AlumniStudents.png",
                "description" => "View & manage alumni students' accounts",
                "link" => "/alumni-students-management",
                "buttonText" => "View Students",
                "titleInArabic" => false
            ]
        ]
    ];

    rsort($cleanPermissionLevels);
    
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
    if ($conn) {
        $conn->close();
    }
}
?>