<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Pragma: no-cache');
header('Expires: 0');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
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

    $sessionId = $data['session_id'];


    $startTime = microtime(true);
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode([
            "success" => false,
            "message" => "Connection failed: " . $conn->connect_error,
            "code" => 500
        ]);
        exit;
    }

    $permissionSql = "SELECT u.permission_level 
                     FROM admin_sessions s
                     JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                     WHERE s.id = ?";

    $stmt = $conn->prepare($permissionSql);

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
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows == 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid session",
            "code" => 401
        ]);
        exit;
    }

    $permissionRow = $permissionResult->fetch_assoc();
    $permissionLevels = explode(',', $permissionRow['permission_level']);
    $cleanPermissionLevels = array_map(function($level) {return intval(trim($level));}, $permissionLevels);
    $hasPermission = in_array(0, $cleanPermissionLevels);

    if (!$hasPermission) {
        echo json_encode([
            "success" => false,
            "message" => "Permission denied",
            "code" => 403
        ]);
        exit;
    }

    $sql = "SELECT
                id, application_time, first_name, last_name, date_of_birth, email, phone_number, gender, address_street,
                address_district, address_district_other, position_applying_for, position_applying_for_other,
                position_applying_for_specialty, high_school_name, high_school_system, high_school_system_other,
                high_school_graduation_date, instituion_name, institution_major, institution_graduation_date,
                years_of_experience, experience_details, skills_or_hobbies, other_details, refrence_name,
                refrence_position, reference_email, reference_phone_number, personal_photo_link, cv_link,
                cover_letter_link, other_documents_link_first, other_documents_link_second, other_documents_link_third
            FROM job_applications";

    $result = $conn->query($sql);

    $headers = [
        "ID", "Application Time", "First Name", "Last Name", "Date of Birth", "Email", "Phone Number", "Gender", "Address Street",
        "Address District", "Address District Other", "Position Applying For", "Position Applying For Other",
        "Position Applying For Specialty", "High School Name", "High School System", "High School System Other",
        "High School Graduation Date", "Institution Name", "Institution Major", "Institution Graduation Date",
        "Years of Experience", "Experience Details", "Skills or Hobbies", "Other Details", "Reference Name",
        "Reference Position", "Reference Email", "Reference Phone Number", "Personal Photo Link", "CV Link",
        "Cover Letter Link", "Other Documents Link First", "Other Documents Link Second", "Other Documents Link Third"
    ];

    $data = [];
    $data[] = $headers;

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $data[] = [
                $row['id'], $row['application_time'], $row['first_name'], $row['last_name'], $row['date_of_birth'], $row['email'], $row['phone_number'],
                $row['gender'], $row['address_street'], $row['address_district'], $row['address_district_other'],
                $row['position_applying_for'], $row['position_applying_for_other'], $row['position_applying_for_specialty'],
                $row['high_school_name'], $row['high_school_system'], $row['high_school_system_other'],
                $row['high_school_graduation_date'], $row['instituion_name'], $row['institution_major'],
                $row['institution_graduation_date'], $row['years_of_experience'], $row['experience_details'],
                $row['skills_or_hobbies'], $row['other_details'], $row['refrence_name'], $row['refrence_position'],
                $row['reference_email'], $row['reference_phone_number'], $row['personal_photo_link'], $row['cv_link'],
                $row['cover_letter_link'], $row['other_documents_link_first'], $row['other_documents_link_second'],
                $row['other_documents_link_third']
            ];
        }
    }

    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    echo json_encode([
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "execution_time" => $executionTime . ' ms',
        "data" => $data
    ]);


} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage(),
        "code" => $e->getCode() ?: 500
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>