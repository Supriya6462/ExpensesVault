<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

include "db_setup.php";
include "SENDMAIL.php"; // For SendEmail() function

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Get POST data
        $name = $_POST["name"] ?? '';
        $email = $_POST["email"] ?? '';
        $password = $_POST["password"] ?? '';

        // Validate input
        if (empty($name) || empty($email) || empty($password)) {
            throw new Exception("All fields are required");
        }

        // Hash password
        $password = password_hash($password, PASSWORD_DEFAULT);
        $is_verified = 0;
        $reset_token = bin2hex(random_bytes(16));

        // Check DB connection
        if ($conn->connect_error) {
            throw new Exception("Database connection failed: " . $conn->connect_error);
        }

        // Insert user
        $stmt = $conn->prepare("INSERT INTO auth (name, email, password, reset_token, is_verified) VALUES (?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $stmt->bind_param("ssssi", $name, $email, $password, $reset_token, $is_verified);

        if (!$stmt->execute()) {
            throw new Exception("Signup failed: " . $stmt->error);
        }

        $user_id = $conn->insert_id;
        
        // Store session info
        $_SESSION['user_id'] = $user_id;
        $_SESSION['name'] = $name;
        $_SESSION['email'] = $email;
        $_SESSION['is_verified'] = $is_verified;
        $_SESSION['reset_token'] = $reset_token;

        // Generate verification link - Fixed URL
        $verification_link = "http://localhost/ExpensesVault/verify.php?token=" . $reset_token;
        error_log("Verification link generated: " . $verification_link);
        
        // Prepare email content
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
        
        // Send verification email
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
                "message" => "Signup successful, but failed to send verification email. Please contact support."
            ]);
        }

    } catch (Exception $e) {
        error_log("Signup error: " . $e->getMessage());
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    } finally {
        if (isset($stmt)) {
            $stmt->close();
        }
        if (isset($conn)) {
            $conn->close();
        }
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request method"
    ]);
}
?>
