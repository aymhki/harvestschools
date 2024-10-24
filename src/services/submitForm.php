<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    try {

        $mailTo = isset($_POST['mailTo']) ? $_POST['mailTo'] : 'info@harvestschools.com';
        $subject = isset($_POST['formTitle']) ? $_POST['formTitle'] : 'Form Submission';

        $boundary = md5(time());
        $headers = "From: no-reply@harvestschools.com\r\n";
        $headers .= "Reply-To: no-reply@harvestschools.com\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

        $body = "--$boundary\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";

        $text = "";
        $formData = [];

        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6); // Remove 'field_' prefix to get the original ID
                $labelKey = 'label_' . $fieldId;
                if (isset($_POST[$labelKey]) ) {
                    $label = $_POST[$labelKey];
                    $text .= "$label: $value\n";
                    $formData[$label] = $value;
                }
            }
        }

        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if ($file['error'] == 0) {
                    $targetDir = "../fileUploads/";
                    $uniqueFileName = isset($_POST['uniqueFileName_' . $fileKey]) ? $_POST['uniqueFileName_' . $fileKey] : basename($file["name"]);

                    $targetFile = $targetDir . $uniqueFileName;

                    // Create the uploads directory if it doesn't exist
                    if (!file_exists($targetDir)) {
                        mkdir($targetDir, 0777, true);
                    }

                    if (move_uploaded_file($file["tmp_name"], $targetFile)) {
                        $fileUrl = $uniqueFileName;
                        $label = isset($_POST['label_' . $fileKey]) ? $_POST['label_' . $fileKey] : 'File URL';
                        $text .= "$label: $fileUrl\n";
                        $formData[$label] = $fileUrl;
                    }
                }
            }
        }

        $body .= chunk_split(base64_encode($text));
        $body .= "--$boundary--";

        if (mail($mailTo, $subject, $body, $headers)) {
            if ($subject === 'Job Application Submission') {
                $servername = "localhost";
                $username = "harvest_admin";
                $password = "Hkibrahim@3";
                $dbname = "harvest_schools";
                $conn = new mysqli($servername, $username, $password, $dbname);

                if ($conn->connect_error) {
                    die("Connection failed: " . $conn->connect_error);
                    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
                } else {
                    $formData['First Name'] = $formData['First Name'] ? $formData['First Name'] : '';
                    $formData['Last Name'] = $formData['Last Name'] ? $formData['Last Name'] : '';
                    $formData['Date of Birth'] = $formData['Date of Birth'] ? $formData['Date of Birth'] : '';
                    $formData['Email'] = $formData['Email'] ? $formData['Email'] : '';
                    $formData['Phone Number'] = $formData['Phone Number'] ? $formData['Phone Number'] : '';
                    $formData['Gender'] = $formData['Gender'] ? $formData['Gender'] : '';
                    $formData['Address Street'] = $formData['Address Street'] ? $formData['Address Street'] : '';
                    $formData['Address District'] = $formData['Address District'] ? $formData['Address District'] : '';
                    $formData['Position Applying For'] = $formData['Position Applying For'] ? $formData['Position Applying For'] : '';
                    $formData['High School Name'] = $formData['High School Name'] ? $formData['High School Name'] : '';
                    $formData['High School System'] = $formData['High School System'] ? $formData['High School System'] : '';
                    $formData['High School Graduation Date'] = $formData['High School Graduation Date'] ? $formData['High School Graduation Date'] : '';
                    $formData['Institution/University Name'] = $formData['Institution/University Name'] ? $formData['Institution/University Name'] : '';
                    $formData['Institution/University Major'] = $formData['Institution/University Major'] ? $formData['Institution/University Major'] : '';
                    $formData['Institution/University Graduation Date'] = $formData['Institution/University Graduation Date'] ? $formData['Institution/University Graduation Date'] : '';
                    $formData['Years of Experience'] = $formData['Years of Experience'] ? $formData['Years of Experience'] : '';
                    $formData['Experience Details'] = $formData['Experience Details'] ? $formData['Experience Details'] : '';
                    $formData['Skills or Hobbies'] = $formData['Skills or Hobbies'] ? $formData['Skills or Hobbies'] : '';
                    $formData['Other Details'] = $formData['Other Details'] ? $formData['Other Details'] : '';
                    $formData['Reference Name'] = $formData['Reference Name'] ? $formData['Reference Name'] : '';
                    $formData['Reference Position'] = $formData['Reference Position'] ? $formData['Reference Position'] : '';
                    $formData['Reference Email'] = $formData['Reference Email'] ? $formData['Reference Email'] : '';
                    $formData['Reference Phone Number'] = $formData['Reference Phone Number'] ? $formData['Reference Phone Number'] : '';
                    $formData['CV'] = $formData['CV'] ? $formData['CV'] : '';
                    $formData['Cover Letter'] = $formData['Cover Letter'] ? $formData['Cover Letter'] : '';
                    $formData['Other Documents: First'] = $formData['Other Documents: First'] ? $formData['Other Documents: First'] : '';
                    $formData['Other Documents: Second'] = $formData['Other Documents: Second'] ? $formData['Other Documents: Second'] : '';
                    $formData['Other Documents: Third'] = $formData['Other Documents: Third'] ? $formData['Other Documents: Third'] : '';
                    $formData['Address District: Other'] = $formData['Address District: Other'] ? $formData['Address District: Other'] : '';
                    $formData['Position Applying For: Other'] = $formData['Position Applying For: Other'] ? $formData['Position Applying For: Other'] : '';
                    $formData['Subject to Teach'] = $formData['Subject to Teach'] ? $formData['Subject to Teach'] : '';
                    $formData['High School System: Other'] = $formData['High School System: Other'] ? $formData['High School System: Other'] : '';
                    $formData['Personal Photo'] = $formData['Personal Photo'] ? $formData['Personal Photo'] : (isset($formData['File URL']) ? $formData['File URL'] : '');
                    $formData['Other Documents: First'] = $formData['Other Documents: First'] ? $formData['Other Documents: First'] : '';
                    $formData['Other Documents: Second'] = $formData['Other Documents: Second'] ? $formData['Other Documents: Second'] : '';
                    $formData['Other Documents: Third'] = $formData['Other Documents: Third'] ? $formData['Other Documents: Third'] : '';

                    $formData = array_map(function($value) {
                        return "'" . addslashes($value) . "'";
                    }, $formData);

                    $stmt = "INSERT INTO job_applications (
                        first_name, last_name, date_of_birth, email, phone_number, gender, address_street,
                        address_district, address_district_other, position_applying_for, position_applying_for_other,
                        position_applying_for_specialty, high_school_name, high_school_system, high_school_system_other,
                        high_school_graduation_date, instituion_name, institution_major, institution_graduation_date,
                        years_of_experience, experience_details, skills_or_hobbies, other_details, refrence_name,
                        refrence_position, reference_email, reference_phone_number, personal_photo_link, cv_link,
                        cover_letter_link, other_documents_link_first, other_documents_link_second, other_documents_link_third
                    ) VALUES (
                        {$formData['First Name']}, {$formData['Last Name']}, {$formData['Date of Birth']}, {$formData['Email']}, {$formData['Phone Number']},
                        {$formData['Gender']}, {$formData['Address Street']}, {$formData['Address District']}, {$formData['Address District: Other']},
                        {$formData['Position Applying For']}, {$formData['Position Applying For: Other']}, {$formData['Subject to Teach']},
                        {$formData['High School Name']}, {$formData['High School System']}, {$formData['High School System: Other']},
                        {$formData['High School Graduation Date']}, {$formData['Institution/University Name']}, {$formData['Institution/University Major']},
                        {$formData['Institution/University Graduation Date']}, {$formData['Years of Experience']}, {$formData['Experience Details']},
                        {$formData['Skills or Hobbies']}, {$formData['Other Details']}, {$formData['Reference Name']}, {$formData['Reference Position']},
                        {$formData['Reference Email']}, {$formData['Reference Phone Number']}, {$formData['Personal Photo']}, {$formData['CV']},
                        {$formData['Cover Letter']}, {$formData['Other Documents: First']}, {$formData['Other Documents: Second']},
                        {$formData['Other Documents: Third']}
                    )";

                    if ($conn->query($stmt) === TRUE) {
                        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Error: ' . $stmt . '<br>' . $conn->error]);
                    }

                    $stmt->close();
                    $conn->close();
                }

            } else {
                echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
            }

         } else {
            echo json_encode(['success' => false, 'message' => 'Email sending failed']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);

}
?>