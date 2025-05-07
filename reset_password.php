<?php
include "db_setup.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $token = $_POST["token"];
    $newPassword = password_hash($_POST["password"], PASSWORD_DEFAULT);

    // Check if token exists and is not expired
    $stmt = $conn->prepare("SELECT reset_token, reset_token_expiry FROM auth WHERE reset_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($dbToken, $dbExpiry);
        $stmt->fetch();

        // Check if the token has expired
        if (strtotime($dbExpiry) > time()) {
            // Token is valid, update password
            $stmt->close();
            $stmt = $conn->prepare("UPDATE auth SET password=?, reset_token=NULL, reset_token_expiry=NULL WHERE reset_token=?");
            $stmt->bind_param("ss", $newPassword, $token);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Password reset successful!"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Error resetting password."]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "The reset token has expired. Please request a new one."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid token or expired link"]);
    }
}

$conn->close();
?>