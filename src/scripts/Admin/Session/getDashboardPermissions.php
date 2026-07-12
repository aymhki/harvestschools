<?php
require_once '../../headers.php';
require_once '../../authHelpers.php';
require_once '../../permissionLevels.php';
$doc_root = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\');
$dbConfig = require dirname($doc_root) . '/configs/dbConfig.php';
set_cors_headers();
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
    $sessionId = get_bearer_token();
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

    global $ADMIN_USER_MANAGEMENT;
    global $JOB_APPLICATION_MANAGEMENT;
    global $GRADUATION_BOOKING_MANAGEMENT;
    global $OPEN_DAY_SIGNUP_MANAGEMENT;
    global $BORROWING_SYSTEM_MANAGEMENT;
    global $INFO_SYSTEM_MANAGEMENT;
    global $ALUMNI_STUDENTS_MANAGEMENT;

    $dashboardOptions = [];
    $allDashboardOptions = [
        $ADMIN_USER_MANAGEMENT => [
            [
                "title" => "Admin Users",
                "image" => "/images/Dashboard/AdminUsers.png",
                "description" => "View & manage admin users",
                "link" => "/admin-users-management",
                "buttonText" => "View Users",
                "titleInArabic" => false
            ]
        ],
        $JOB_APPLICATION_MANAGEMENT => [
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
        $GRADUATION_BOOKING_MANAGEMENT => [
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
        $OPEN_DAY_SIGNUP_MANAGEMENT => [
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
        $BORROWING_SYSTEM_MANAGEMENT => [
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
        $INFO_SYSTEM_MANAGEMENT => [
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
        $ALUMNI_STUDENTS_MANAGEMENT => [
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