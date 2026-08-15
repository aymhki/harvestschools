<?php
require_once '../../headers.php';
require_once '../../turnstileHelpers.php';
require_once __DIR__ . '/../../emailRecipients.php';
set_cors_headers();

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $turnstileCheck = verify_turnstile_token_if_present();

    if (!$turnstileCheck['ok']) {
        echo json_encode([
            'success' => false,
            'message' => 'Human verification failed. Please refresh the page and try again.',
            'code' => 403
        ]);
        exit;
    }

    try {
        $mailTo = configured_email(trim(isset($_POST['formKey']) ? (string)$_POST['formKey'] : ''));

        if ($mailTo === null) {
            echo json_encode([
                'success' => false,
                'message' => 'This form has no configured recipient. Add it under Info System then Form Emails.',
                'code' => 403
            ]);
            exit;
        }

        $rawSubject = isset($_POST['formTitle']) ? (string)$_POST['formTitle'] : 'Form Submission';
        $subject = trim(str_replace(["\r", "\n", "\0"], ' ', $rawSubject));

        if ($subject === '') {
            $subject = 'Form Submission';
        }
        $boundary = md5(time());
        $senderAddress = configured_email('system-sender');

        if ($senderAddress === null) {
            echo json_encode([
                'success' => false,
                'message' => 'No system sender address is configured. Add it under Info System then Form Emails.',
                'code' => 500
            ]);
            exit;
        }

        $headers = "From: " . $senderAddress . "\r\n";
        $headers .= "Reply-To: " . $senderAddress . "\r\n";
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