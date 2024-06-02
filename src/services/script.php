<?php
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
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
    foreach ($_POST as $key => $value) {
        if (strpos($key, 'field_') === 0) {
            $fieldId = substr($key, 6); // Remove 'field_' prefix to get the original ID
            $labelKey = 'label_' . $fieldId;
            if (isset($_POST[$labelKey])) {
                $label = $_POST[$labelKey];
                $text .= "$label: $value\n";
            }
        }
    }

    $body .= chunk_split(base64_encode($text));

    if (!empty($_FILES)) {
        foreach ($_FILES as $file) {
            if ($file['error'] == 0) {
                $body .= "--$boundary\r\n";
                $body .= "Content-Type: " . $file['type'] . "; name=\"" . $file['name'] . "\"\r\n";
                $body .= "Content-Disposition: attachment; filename=\"" . $file['name'] . "\"\r\n";
                $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
                $body .= chunk_split(base64_encode(file_get_contents($file['tmp_name']))) . "\r\n";
            }
        }
    }

    $body .= "--$boundary--";

    if (mail($mailTo, $subject, $body, $headers)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
} else {
    echo json_encode(['success' => false]);
}
?>