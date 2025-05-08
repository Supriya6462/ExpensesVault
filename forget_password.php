<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include "db_setup.php";  // Ensures DB & table exist
include 'SENDMAIL.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        if (!isset($_POST["email"]) || empty($_POST["email"])) {
            throw new Exception("Email is required");
        }

        $email = trim($_POST["email"]);
        error_log("Processing reset request for email: " . $email);

        // Check if the email exists
        $stmt = $conn->prepare("SELECT email FROM auth WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Generate a unique token for password reset
            $token = bin2hex(random_bytes(16));
            $tokenExpiry = date("Y-m-d H:i:s", strtotime('+1 hour')); // Token expires in 1 hour
            $stmt->close();

            error_log("Generated reset token for email: " . $email);

            // Store the reset token and expiry in the database
            $stmt = $conn->prepare("UPDATE auth SET reset_token = ?, reset_token_expiry = ? WHERE email = ?");
            $stmt->bind_param("sss", $token, $tokenExpiry, $email);
            
            if (!$stmt->execute()) {
                throw new Exception("Failed to update reset token: " . $stmt->error);
            }
            $stmt->close();

            // Create the reset link
            $resetLink = "http://localhost/ExpensesVault/reset.html?token=" . $token;
            error_log("Reset link generated: " . $resetLink);

            // Send the reset email using the sendEmail function
            $subject = "Password Reset Request";
            $body = "
                <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>You have requested to reset your password for your Xpense Vault account.</p>
                    <p>Please click on the following link to reset your password:</p>
                    <p><a href='$resetLink'>Reset Password</a></p>
                    <p>If you did not request this password reset, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                </body>
                </html>
            ";

            if (SendEmail($email, $subject, $body)) {
                error_log("Reset email sent successfully to: " . $email);
                echo json_encode([
                    "status" => "success",
                    "message" => "Password reset link has been sent to your email."
                ]);
            } else {
                throw new Exception("Failed to send email. Please check the server logs for more details.");
            }
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "No user found with that email address."
            ]);
        }
    } catch (Exception $e) {
        error_log("Password Reset Error: " . $e->getMessage());
        echo json_encode([
            "status" => "error",
            "message" => "An error occurred: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method"
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>
