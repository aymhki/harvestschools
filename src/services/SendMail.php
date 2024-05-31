<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use TCPDF;

require 'vendor/autoload.php'; // Make sure you have PHPMailer and TCPDF installed

function sendFormEmail($fields, $mailTo, $sendPdf, $formTitle) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.harvestschools.com'; // Set your SMTP server
        $mail->SMTPAuth = true;
        $mail->Username = 'ayman.ibrahim@harvestschools.com'; // SMTP username
        $mail->Password = 'Hkibrahim@3'; // SMTP password
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;

        // Recipients
        $mail->setFrom('ayman.ibrahim@harvestschools.com', 'Mailer');
        $mail->addAddress($mailTo);

        // Attachments
        $uploadedFiles = [];
        foreach ($_FILES as $file) {
            if ($file['error'] == UPLOAD_ERR_OK) {
                $mail->addAttachment($file['tmp_name'], $file['name']);
                $uploadedFiles[] = $file;
            }
        }

        // Content
        $mail->isHTML(true);
        $mail->Subject = $formTitle;
        $bodyContent = '<h1>' . $formTitle . '</h1>';

        // Add form fields to the email body
        foreach ($fields as $field) {
            if ($field['type'] !== 'file') {
                $value = htmlspecialchars($_POST[$field['httpName']] ?? '');
                $bodyContent .= '<p><strong>' . htmlspecialchars($field['label']) . ':</strong> ' . $value . '</p>';
            }
        }

        $mail->Body = $bodyContent;

        // Generate PDF if required
        if ($sendPdf) {
            $pdf = new TCPDF();
            $pdf->AddPage();
            $pdf->SetFont('helvetica', '', 12);

            $pdfContent = '<h1>' . $formTitle . '</h1>';
            foreach ($fields as $field) {
                if ($field['type'] !== 'file') {
                    $value = htmlspecialchars($_POST[$field['httpName']] ?? '');
                    $pdfContent .= '<p><strong>' . htmlspecialchars($field['label']) . ':</strong> ' . $value . '</p>';
                }
            }

            $pdf->writeHTML($pdfContent, true, false, true, false, '');
            $pdfFile = tempnam(sys_get_temp_dir(), 'pdf');
            $pdf->Output($pdfFile, 'F');

            $mail->addAttachment($pdfFile, 'form_submission.pdf');
        }

        $mail->send();
        echo 'Message has been sent';
    } catch (Exception $e) {
        echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fields = json_decode($_POST['fields'], true); // Assuming fields are passed as a JSON string in a hidden input
    $mailTo = $_POST['mailTo'];
    $sendPdf = filter_var($_POST['sendPdf'], FILTER_VALIDATE_BOOLEAN);
    $formTitle = $_POST['formTitle'];

    sendFormEmail($fields, $mailTo, $sendPdf, $formTitle);
}
?>
