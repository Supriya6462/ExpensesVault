<?php
// Include the PHPMailer files
require 'PHPMailer-6.9.3/src/PHPMailer.php';
require 'PHPMailer-6.9.3/src/SMTP.php';
require 'PHPMailer-6.9.3/src/Exception.php';

// Function to send email
function SendEmail($recipientEmail, $subject, $body) {
    // Create a new PHPMailer instance
    $mail = new PHPMailer\PHPMailer\PHPMailer(true); // Enable exceptions

    try {
        // Server settings
        $mail->SMTPDebug = 0; // Disable verbose debug output
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'expencetrackernoreply@gmail.com';
        $mail->Password = 'xkqk kdyk wqbe cncx';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Additional SMTP options for better reliability
        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

        // Timeout settings
        $mail->Timeout = 60;
        $mail->SMTPKeepAlive = true;

        // Sender and recipient
        $mail->setFrom('expencetrackernoreply@gmail.com', 'Xpense Vault');
        $mail->addAddress($recipientEmail);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->AltBody = strip_tags($body);

        // Send the email
        if ($mail->send()) {
            error_log("Email sent successfully to: " . $recipientEmail);
            return true;
        } else {
            error_log("Failed to send email to: " . $recipientEmail);
            return false;
        }
    } catch (Exception $e) {
        error_log("Email sending error: " . $e->getMessage());
        return false;
    }
}

?>