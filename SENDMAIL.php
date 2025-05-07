<?php
// Include the PHPMailer files
require 'PHPMailer-6.9.3/src/PHPMailer.php';
require 'PHPMailer-6.9.3/src/SMTP.php';
require 'PHPMailer-6.9.3/src/Exception.php';

// Function to send email
function SendEmail($recipientEmail, $subject, $body) {
    // Create a new PHPMailer instance
    $mail = new PHPMailer\PHPMailer\PHPMailer();

    try {
        // Set mailer to use SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';  // Specify the SMTP server
        $mail->SMTPAuth = true;
        $mail->Username = 'expencetrackernoreply@gmail.com';  // Your Gmail address
        $mail->Password = 'xkqk kdyk wqbe cncx';  // App password
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;  // TCP port for SMTP

        // Set the sender and recipient
        $mail->setFrom('expencetrackernoreply@gmail.com', 'Expense Tracker');
        $mail->addAddress($recipientEmail);  // Add recipient dynamically

        // Content of the email
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body);  // Plain text version for email clients that don't support HTML

        // Send the email
        if ($mail->send()) {
            return true;
        } else {
            return false;
        }
    } catch (Exception $e) {
        return false;
    }
}

?>