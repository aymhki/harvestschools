<?php
require_once '../../headers.php';
require_once '../../permissionLevels.php';
require_once '../../authHelpers.php';
$dbConfig = require '../../dbConfig.php';
set_cors_headers();
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        echo json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error, "code" => 500]);
        exit;
    }

    global $JOB_APPLICATION_MANAGEMENT;
    $conn->set_charset("utf8mb4");
    $authStatus = check_admin_user_permission($conn, $JOB_APPLICATION_MANAGEMENT);

    if (!$authStatus['success']) {
        echo json_encode($authStatus);
        exit;
    }

    $sql = "SELECT id, application_time, first_name, last_name, date_of_birth, email, phone_number, gender, address_street,
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

    $fileLinkColumns = [
        "Personal Photo Link", "CV Link", "Cover Letter Link", "Other Documents Link First",
        "Other Documents Link Second", "Other Documents Link Third"
    ];

    $fileLinkIndices = array_keys(array_intersect($headers, $fileLinkColumns));


    $dataRows = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $rowData = array_values($row);
            foreach($fileLinkIndices as $index) {
                if (!empty($rowData[$index])) {
                    $rowData[$index] = urlencode($rowData[$index]);
                }
            }
            $dataRows[] = $rowData;
        }
    }

    $output = [
        "success" => true,
        "message" => "Data retrieved successfully",
        "code" => 200,
        "data" => array_merge([$headers], $dataRows)
    ];

    $json = json_encode($output);

    if ($json === false) {
        echo json_encode([
            "success" => false,
            "message" => "JSON Encode Error: " . json_last_error_msg(),
            "code" => 500
        ]);
    } else {
        echo $json;
    }

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage(), "code" => $e->getCode() ?: 500]);
} finally {
    if (isset($conn) ) {
        $conn->close();
    }
}
?>