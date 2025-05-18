<?php
header('Content-Type: application/json');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $conn->connect_error,
                'code' => 500
            ]);
            exit;
        }

        $conn->begin_transaction();
        $mailTo = isset($_POST['mailTo']) ? $_POST['mailTo'] : 'info@harvestschools.com';
        $subject = isset($_POST['formTitle']) ? $_POST['formTitle'] : 'Job Application Submission';
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
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;
                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $text .= "$label: $value\n";
                    $formData[$label] = $value;
                }
            }
        }

        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if ($file['error'] == 0 && is_uploaded_file($file["tmp_name"])) { // Verify it's a valid uploaded file
                    $targetDir = "../fileUploads/";
                    $uniqueFileName = isset($_POST['uniqueFileName_' . $fileKey]) ? $_POST['uniqueFileName_' . $fileKey] : basename($file["name"]);
                    $targetFile = $targetDir . $uniqueFileName;

                    if (!file_exists($targetDir)) {
                        mkdir($targetDir, 0777, true);
                    }

                    if (move_uploaded_file($file["tmp_name"], $targetFile)) {
                        $fileUrl = $uniqueFileName;
                        $label = isset($_POST['label_' . $fileKey]) ? $_POST['label_' . $fileKey] : 'File URL';
                        $text .= "$label: $fileUrl\n";
                        $formData[$label] = $fileUrl;
                    } else {
                        $conn->rollback();
                        echo json_encode([
                            'success' => false,
                            'message' => 'Failed to move uploaded file',
                            'code' => 500
                        ]);
                        exit;
                    }
                }
            }
        }

        $fields = [
            'First Name' => isset($formData['First Name']) ? $formData['First Name'] : '',
            'Last Name' => isset($formData['Last Name']) ? $formData['Last Name'] : '',
            'Date of Birth' => isset($formData['Date of Birth']) ? $formData['Date of Birth'] : '',
            'Email' => isset($formData['Email']) ? $formData['Email'] : '',
            'Phone Number' => isset($formData['Phone Number']) ? $formData['Phone Number'] : '',
            'Gender' => isset($formData['Gender']) ? $formData['Gender'] : '',
            'Address Street' => isset($formData['Address Street']) ? $formData['Address Street'] : '',
            'Address District' => isset($formData['Address District']) ? $formData['Address District'] : '',
            'Address District: Other' => isset($formData['Address District: Other']) ? $formData['Address District: Other'] : '',
            'Position Applying For' => isset($formData['Position Applying For']) ? $formData['Position Applying For'] : '',
            'Position Applying For: Other' => isset($formData['Position Applying For: Other']) ? $formData['Position Applying For: Other'] : '',
            'Subject to Teach' => isset($formData['Subject to Teach']) ? $formData['Subject to Teach'] : '',
            'High School Name' => isset($formData['High School Name']) ? $formData['High School Name'] : '',
            'High School System' => isset($formData['High School System']) ? $formData['High School System'] : '',
            'High School System: Other' => isset($formData['High School System: Other']) ? $formData['High School System: Other'] : '',
            'High School Graduation Date' => isset($formData['High School Graduation Date']) ? $formData['High School Graduation Date'] : '',
            'Institution/University Name' => isset($formData['Institution/University Name']) ? $formData['Institution/University Name'] : '',
            'Institution/University Major' => isset($formData['Institution/University Major']) ? $formData['Institution/University Major'] : '',
            'Institution/University Graduation Date' => isset($formData['Institution/University Graduation Date']) ? $formData['Institution/University Graduation Date'] : '',
            'Years of Experience' => isset($formData['Years of Experience']) ? $formData['Years of Experience'] : '',
            'Experience Details' => isset($formData['Experience Details']) ? $formData['Experience Details'] : '',
            'Skills or Hobbies' => isset($formData['Skills or Hobbies']) ? $formData['Skills or Hobbies'] : '',
            'Other Details' => isset($formData['Other Details']) ? $formData['Other Details'] : '',
            'Reference Name' => isset($formData['Reference Name']) ? $formData['Reference Name'] : '',
            'Reference Position' => isset($formData['Reference Position']) ? $formData['Reference Position'] : '',
            'Reference Email' => isset($formData['Reference Email']) ? $formData['Reference Email'] : '',
            'Reference Phone Number' => isset($formData['Reference Phone Number']) ? $formData['Reference Phone Number'] : '',
            'Personal Photo' => isset($formData['Personal Photo']) ? $formData['Personal Photo'] : (isset($formData['File URL']) ? $formData['File URL'] : ''),
            'CV' => isset($formData['CV']) ? $formData['CV'] : '',
            'Cover Letter' => isset($formData['Cover Letter']) ? $formData['Cover Letter'] : '',
            'Other Documents: First' => isset($formData['Other Documents: First']) ? $formData['Other Documents: First'] : '',
            'Other Documents: Second' => isset($formData['Other Documents: Second']) ? $formData['Other Documents: Second'] : '',
            'Other Documents: Third' => isset($formData['Other Documents: Third']) ? $formData['Other Documents: Third'] : ''
        ];

        $stmt = $conn->prepare("INSERT INTO job_applications (
            first_name, last_name, date_of_birth, email, phone_number, gender, address_street,
            address_district, address_district_other, position_applying_for, position_applying_for_other,
            position_applying_for_specialty, high_school_name, high_school_system, high_school_system_other,
            high_school_graduation_date, instituion_name, institution_major, institution_graduation_date,
            years_of_experience, experience_details, skills_or_hobbies, other_details, refrence_name,
            refrence_position, reference_email, reference_phone_number, personal_photo_link, cv_link,
            cover_letter_link, other_documents_link_first, other_documents_link_second, other_documents_link_third
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) {
            $conn->rollback();
            echo json_encode([
                'success' => false,
                'message' => 'Failed to prepare database statement: ' . $conn->error,
                'code' => 500
            ]);
            exit;
        }

        $stmt->bind_param("sssssssssssssssssssssssssssssssss",
            $fields['First Name'],
            $fields['Last Name'],
            $fields['Date of Birth'],
            $fields['Email'],
            $fields['Phone Number'],
            $fields['Gender'],
            $fields['Address Street'],
            $fields['Address District'],
            $fields['Address District: Other'],
            $fields['Position Applying For'],
            $fields['Position Applying For: Other'],
            $fields['Subject to Teach'],
            $fields['High School Name'],
            $fields['High School System'],
            $fields['High School System: Other'],
            $fields['High School Graduation Date'],
            $fields['Institution/University Name'],
            $fields['Institution/University Major'],
            $fields['Institution/University Graduation Date'],
            $fields['Years of Experience'],
            $fields['Experience Details'],
            $fields['Skills or Hobbies'],
            $fields['Other Details'],
            $fields['Reference Name'],
            $fields['Reference Position'],
            $fields['Reference Email'],
            $fields['Reference Phone Number'],
            $fields['Personal Photo'],
            $fields['CV'],
            $fields['Cover Letter'],
            $fields['Other Documents: First'],
            $fields['Other Documents: Second'],
            $fields['Other Documents: Third']
        );

        if ($stmt->execute()) {
            $applicationId = $conn->insert_id;

            $body .= chunk_split(base64_encode($text));
            $body .= "--$boundary--";

            if (mail($mailTo, $subject, $body, $headers)) {
                $conn->commit();
                echo json_encode([
                    'success' => true,
                    'message' => 'Job application submitted successfully',
                    'code' => 200
                ]);
            } else {
                $deleteStmt = $conn->prepare("DELETE FROM job_applications WHERE id = ?");
                $deleteStmt->bind_param("i", $applicationId);
                $deleteStmt->execute();
                $deleteStmt->close();

                $conn->rollback();
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to send email notification. Application not submitted.',
                    'code' => 500
                ]);
            }
        } else {
            $conn->rollback();
            echo json_encode([
                'success' => false,
                'message' => 'Failed to save job application in database: ' . $stmt->error,
                'code' => 500
            ]);
        }

        $stmt->close();
        $conn->close();

    } catch (Exception $e) {
        if (isset($conn)) {
            $conn->rollback();
            $conn->close();
        }
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage(),
            'code' => 500
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method',
        'code' => 405
    ]);
}
?>