<?php
require_once '../../headers.php';
require_once '../authHelpers.php';
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
    $sessionCheck = validate_admin_session($conn);

    if (!$sessionCheck['success']) {
        echo json_encode($sessionCheck);
        exit;
    }

    $sessionId = get_bearer_token_hash();
    $stmt = $conn->prepare("SELECT  p.permission_level_id FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id JOIN admin_users_permissions_linker p ON u.id = p.admin_user_id WHERE s.id = ?");

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

    $row = array_column($result->fetch_all(MYSQLI_ASSOC), 'permission_level_id');
    $cleanPermissionLevels = array_map(fn($n) => (string)$n, $row);

    global $ADMIN_USER_MANAGEMENT;
    global $JOB_APPLICATION_MANAGEMENT;
    global $GRADUATION_BOOKING_MANAGEMENT;
    global $OPEN_DAY_SIGNUP_MANAGEMENT;
    global $BORROWING_SYSTEM_MANAGEMENT;
    global $INFO_SYSTEM_MANAGEMENT;
    global $ALUMNI_STUDENTS_MANAGEMENT;
    global $STAFF_DIRECTORY_MANAGEMENT;
    global $ACADEMIC_CALENDARS_MANAGEMENT;
    global $NATIONAL_CALENDAR_MANAGEMENT;
    global $BRITISH_CALENDAR_MANAGEMENT;
    global $AMERICAN_CALENDAR_MANAGEMENT;
    global $NATIONAL_KG_CALENDAR_MANAGEMENT;
    global $BRITISH_KG_CALENDAR_MANAGEMENT;
    global $AMERICAN_KG_CALENDAR_MANAGEMENT;
    global $LIBRARY_MANAGEMENT;
    global $GALLERY_MANAGEMENT;
    global $PAGE_GATES_MANAGEMENT;
    global $JACK_OF_ALL_TRADES;


    $academicCalendarsTile = [
        [
            "title" => "Academic Calendars",
            "image" => "/images/Dashboard/AcademicCalendars.svg",
            "description" => "View & manage the department academic calendars",
            "link" => "/academic-calendars-management",
            "buttonText" => "View Calendars",
            "titleInArabic" => false,
            "descriptionInArabic" => false
        ]
    ];

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
        ],
        $STAFF_DIRECTORY_MANAGEMENT => [
            [
                "title" => "Staff Directory",
                "image" => "/images/Dashboard/StaffDirectory.svg",
                "description" => "View & manage employees and the public staff pages",
                "link" => "/staff-directory-management",
                "buttonText" => "View Employees",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        $ACADEMIC_CALENDARS_MANAGEMENT    => $academicCalendarsTile,
        $NATIONAL_CALENDAR_MANAGEMENT     => $academicCalendarsTile,
        $BRITISH_CALENDAR_MANAGEMENT      => $academicCalendarsTile,
        $AMERICAN_CALENDAR_MANAGEMENT     => $academicCalendarsTile,
        $NATIONAL_KG_CALENDAR_MANAGEMENT  => $academicCalendarsTile,
        $BRITISH_KG_CALENDAR_MANAGEMENT   => $academicCalendarsTile,
        $AMERICAN_KG_CALENDAR_MANAGEMENT  => $academicCalendarsTile,
        $LIBRARY_MANAGEMENT => [
            [
                "title" => "Library",
                "image" => "/images/Dashboard/Library.svg",
                "description" => "View & manage the books on the library pages",
                "link" => "/library-management",
                "buttonText" => "View Books",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        $GALLERY_MANAGEMENT => [
            [
                "title" => "Gallery",
                "image" => "/images/Dashboard/Gallery.svg",
                "description" => "View & manage the photo collages and videos on the gallery pages",
                "link" => "/gallery-management",
                "buttonText" => "View Gallery",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ],
        $PAGE_GATES_MANAGEMENT => [
            [
                "title" => "Page Visibility",
                "image" => "/images/Dashboard/PageGates.svg",
                "description" => "Switch public pages on or off and set the message shown while a page is off",
                "link" => "/page-gates-management",
                "buttonText" => "View Pages",
                "titleInArabic" => false,
                "descriptionInArabic" => false
            ]
        ]
    ];

    rsort($cleanPermissionLevels);
    $master_of_none = in_array($JACK_OF_ALL_TRADES, $cleanPermissionLevels, true);

    if (!$master_of_none) {
        $filteredOptions = array_intersect_key($allDashboardOptions, array_flip($cleanPermissionLevels));
        $dashboardOptions = array_merge([], ...array_values($filteredOptions));
    } else {
        $dashboardOptions = array_merge([], ...array_values($allDashboardOptions));
    }


    $seenLinks = [];
    $dashboardOptions = array_values(array_filter($dashboardOptions, function ($option) use (&$seenLinks) {
        if (in_array($option['link'], $seenLinks, true)) {
            return false;
        }

        $seenLinks[] = $option['link'];

        return true;
    }));

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