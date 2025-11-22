<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $conn = new mysqli($servername, $username, $password, $dbname);
        if ($conn->connect_error) {
            echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $conn->connect_error, 'code' => 500]);
            exit;
        }

        $conn->begin_transaction();

        $mailTo = isset($_POST['mailTo']) ? $_POST['mailTo'] : 'info@harvestschools.com';
        $subject = isset($_POST['formTitle']) ? $_POST['formTitle'] : 'Job Application Submission';
        $emailText = "New Job Application Received:\n\n";
        $attachmentLinks = [];

        $fileLabels = [
            'Personal Photo', 'CV', 'Cover Letter',
            'Other Documents: First', 'Other Documents: Second', 'Other Documents: Third'
        ];

        $formData = [];
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = substr($key, 6);
                $labelKey = 'label_' . $fieldId;
                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;

                    if (!in_array($label, $fileLabels)) {
                        $emailText .= "$label: $value\n";
                    }
                }
            }
        }

        $fileLabels = [
            'Personal Photo', 'CV', 'Cover Letter',
            'Other Documents: First', 'Other Documents: Second', 'Other Documents: Third'
        ];

        $uploadedFileLabels = [];

        if (!empty($_FILES)) {
            foreach ($_FILES as $fileKey => $file) {
                if ($file['error'] == 0 && is_uploaded_file($file["tmp_name"])) {

                    $labelKey = 'label_' . $fileKey;
                    if (strpos($fileKey, 'field_') === 0) {
                        $fileId = substr($fileKey, 6);
                        $labelKey = 'label_' . $fileId;
                    }
                    $label = isset($_POST[$labelKey]) ? $_POST[$labelKey] : null;


                    $uniqueFileNameKey = strpos($fileKey, 'field_') === 0 ? 'uniqueFileName_' . substr($fileKey, 6) : 'uniqueFileName_' . $fileKey;
                    $postedFileName = isset($_POST[$uniqueFileNameKey]) ? $_POST[$uniqueFileNameKey] : $file["name"];

                    if (!$label || $label === 'File') {
                        foreach ($fileLabels as $fLabel) {
                            if (isset($formData[$fLabel]) && ($formData[$fLabel] === $postedFileName || $formData[$fLabel] === $file['name'])) {
                                $label = $fLabel;
                                break;
                            }
                        }
                    }

                    if (!$label) $label = 'File';

                    $subFolder = 'others/';
                    switch ($label) {
                        case 'Personal Photo': $subFolder = 'personal_photos/'; break;
                        case 'CV': $subFolder = 'resumes/'; break;
                        case 'Cover Letter': $subFolder = 'cover_letters/'; break;
                        case 'Other Documents: First':
                        case 'Other Documents: Second':
                        case 'Other Documents: Third':
                            $subFolder = 'others/'; break;
                    }

                    $baseDir = "../../files_uploaded_from_harvestschools_webapp/job_applications/";
                    $targetDir = $baseDir . $subFolder;

                    if (!file_exists($targetDir)) {
                        if (!mkdir($targetDir, 0755, true)) {
                            $conn->rollback();
                            echo json_encode(['success' => false, 'message' => 'Failed to create upload subdirectory.', 'code' => 500]);
                            exit;
                        }
                    }

                    $finalFileName = $postedFileName;
                    $finalFileName = preg_replace('/[^a-zA-Z0-9_.-]/', '', $finalFileName);
                    $targetFile = $targetDir . $finalFileName;

                    if (move_uploaded_file($file["tmp_name"], $targetFile)) {
                        $relativePath = $subFolder . $finalFileName;

                        $formData[$label] = $relativePath;
                        $uploadedFileLabels[] = $label;

                        $fullLink = "https://www.harvestschools.com/admin/view-job-application-file?file=" . $relativePath;
                        $attachmentLinks[] = "$label: $fullLink";
                    } else {
                        $conn->rollback();
                        echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.', 'code' => 500]);
                        exit;
                    }
                }
            }
        }

        foreach ($fileLabels as $fLabel) {
            if (!in_array($fLabel, $uploadedFileLabels)) {
                $formData[$fLabel] = '';
            }
        }

        $fields = [
            'First Name' => $formData['First Name'] ?? '',
            'Last Name' => $formData['Last Name'] ?? '',
            'Date of Birth' => $formData['Date of Birth'] ?? '',
            'Email' => $formData['Email'] ?? '',
            'Phone Number' => $formData['Phone Number'] ?? '',
            'Gender' => $formData['Gender'] ?? '',
            'Address Street' => $formData['Address Street'] ?? '',
            'Address District' => $formData['Address District'] ?? '',
            'Address District: Other' => $formData['Address District: Other'] ?? '',
            'Position Applying For' => $formData['Position Applying For'] ?? '',
            'Position Applying For: Other' => $formData['Position Applying For: Other'] ?? '',
            'Subject to Teach' => $formData['Subject to Teach'] ?? '',
            'High School Name' => $formData['High School Name'] ?? '',
            'High School System' => $formData['High School System'] ?? '',
            'High School System: Other' => $formData['High School System: Other'] ?? '',
            'High School Graduation Date' => $formData['High School Graduation Date'] ?? '',
            'Institution/University Name' => $formData['Institution/University Name'] ?? '',
            'Institution/University Major' => $formData['Institution/University Major'] ?? '',
            'Institution/University Graduation Date' => $formData['Institution/University Graduation Date'] ?? '',
            'Years of Experience' => $formData['Years of Experience'] ?? '',
            'Experience Details' => $formData['Experience Details'] ?? '',
            'Skills or Hobbies' => $formData['Skills or Hobbies'] ?? '',
            'Other Details' => $formData['Other Details'] ?? '',
            'Reference Name' => $formData['Reference Name'] ?? '',
            'Reference Position' => $formData['Reference Position'] ?? '',
            'Reference Email' => $formData['Reference Email'] ?? '',
            'Reference Phone Number' => $formData['Reference Phone Number'] ?? '',
            'Personal Photo' => $formData['Personal Photo'] ?? '',
            'CV' => $formData['CV'] ?? '',
            'Cover Letter' => $formData['Cover Letter'] ?? '',
            'Other Documents: First' => $formData['Other Documents: First'] ?? '',
            'Other Documents: Second' => $formData['Other Documents: Second'] ?? '',
            'Other Documents: Third' => $formData['Other Documents: Third'] ?? ''
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
            echo json_encode(['success' => false, 'message' => 'DB prepare failed: ' . $conn->error, 'code' => 500]);
            exit;
        }

        $stmt->bind_param("sssssssssssssssssssssssssssssssss",
            $fields['First Name'], $fields['Last Name'], $fields['Date of Birth'], $fields['Email'],
            $fields['Phone Number'], $fields['Gender'], $fields['Address Street'], $fields['Address District'],
            $fields['Address District: Other'], $fields['Position Applying For'], $fields['Position Applying For: Other'],
            $fields['Subject to Teach'], $fields['High School Name'], $fields['High School System'],
            $fields['High School System: Other'], $fields['High School Graduation Date'],
            $fields['Institution/University Name'], $fields['Institution/University Major'],
            $fields['Institution/University Graduation Date'], $fields['Years of Experience'],
            $fields['Experience Details'], $fields['Skills or Hobbies'], $fields['Other Details'],
            $fields['Reference Name'], $fields['Reference Position'], $fields['Reference Email'],
            $fields['Reference Phone Number'], $fields['Personal Photo'], $fields['CV'],
            $fields['Cover Letter'], $fields['Other Documents: First'], $fields['Other Documents: Second'],
            $fields['Other Documents: Third']
        );

        if ($stmt->execute()) {
            $conn->commit();

            if (!empty($attachmentLinks)) {
                $emailText .= "\n--- Attachments (Links) ---\n";
                foreach ($attachmentLinks as $linkLine) {
                    $emailText .= $linkLine . "\n\n";
                }
            }

            $boundary = md5(time());
            $headers = "From: no-reply@harvestschools.com\r\n";
            $headers .= "Reply-To: no-reply@harvestschools.com\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";

            $body = "--$boundary\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= chunk_split(base64_encode($emailText));
            $body .= "--$boundary--";

            if (mail($mailTo, $subject, $body, $headers)) {
                echo json_encode(['success' => true, 'message' => 'Job application submitted successfully.', 'code' => 200]);
            } else {
                echo json_encode(['success' => true, 'message' => 'Application saved, but email notification could not be sent.', 'code' => 200]);
            }

        } else {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'DB execute failed: ' . $stmt->error, 'code' => 500]);
        }

        $stmt->close();
        $conn->close();

    } catch (Exception $e) {
        if (isset($conn) ) { $conn->rollback(); $conn->close(); }
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage(), 'code' => 500]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.', 'code' => 405]);
}
?>