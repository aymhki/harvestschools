<?php
header('Content-Type: application/json');

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
                if ($file['error'] == 0 && is_uploaded_file($file["tmp_name"])) {
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

        $body .= chunk_split(base64_encode($text));
        $body .= "--$boundary--";

        if (mail($mailTo, $subject, $body, $headers)) {
            echo json_encode([
                'success' => true,
                'message' => 'Email sent successfully',
                'code' => 200
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Email sending failed',
                'code' => 500
            ]);
        }
    } catch (Exception $e) {
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