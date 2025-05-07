<?php
session_start();


include "db_setup.php";
include "SENDMAIL.php"; // For SendEmail() function

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST["name"];
    $email = $_POST["email"];
    $password = password_hash($_POST["password"], PASSWORD_DEFAULT); // Hash password
    $is_verified = 0; // New users are unverified
    $reset_token = bin2hex(random_bytes(16)); // Secure random token

    // Check DB connection
    if ($conn->connect_error) {
        echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
        exit();
    }

    // Insert user
    $stmt = $conn->prepare("INSERT INTO auth (name, email, password, reset_token, is_verified) VALUES (?, ?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit();
    }

    $stmt->bind_param("ssssi", $name, $email, $password, $reset_token, $is_verified);

    if ($stmt->execute()) {
        $user_id = $conn->insert_id;
        
        // Store basic session info (optional during signup)
        $_SESSION['user_id'] = $user_id;
        $_SESSION['name'] = $name;
        $_SESSION['email'] = $email;
        $_SESSION['is_verified'] = $is_verified;
        $_SESSION['reset_token'] = $reset_token;

        $verification_link = "  http://localhost/coll/Xpense-vault/verify.php?token=" . $reset_token;
            error_log("Verification link generated: " . $verification_link);
            
            // Prepare the email subject and HTML bodys
          
            $subject = "Verify your Email - Xpense Vault";
            $body = "
                <html>
                <body>
                    <h2>Verify Your Email</h2>
                    <p>Hi $name,</p>
                    <p>Thank you for signing up for Xpense Vault.</p>
                    <p>Please click the link below to verify your email address and activate your account:</p>
                    <p><a href='$verification_link'>Verify Email</a></p>
                    <p>If you did not sign up, please ignore this email.</p>
                    <p>This verification link will expire after some time for security purposes.</p>
                </body>
                </html>
            ";
            
            if (SendEmail($email, $subject, $body)) {
                error_log("Verification email sent successfully to: " . $email);
                echo json_encode([
                    "status" => "success",
                    "message" => "Signup successful! Please check your email to verify your account."
                ]);
            } else {
                error_log("Failed to send verification email to: " . $email);
                echo json_encode([
                    "status" => "error",
                    "message" => "Signup successful, but failed to send verification email."
                ]);
            }
    } else {
        echo json_encode(["status" => "error", "message" => "Signup failed: " . $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}

$conn->close();
?>
