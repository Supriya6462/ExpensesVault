<?php
session_start();
header('Content-Type: application/json');
include "db_setup.php"; // Ensures DB & table exist

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Retrieve user with is_verified field
    $stmt = $conn->prepare("SELECT id, name, email, password, is_verified FROM auth WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        if (password_verify($password, $user['password'])) {
            
            if ($user['is_verified'] == 1) {
                // User is verified, allow login
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['name'] = $user['name'];
                $_SESSION['email'] = $user['email'];

                echo json_encode([
                    "status" => "success",
                    "message" => "Login successful",
                    "user" => [
                        "name" => $user['name'],
                        "email" => $user['email']
                    ]
                ]);
            } else {
                // User exists but is not verified
                echo json_encode([
                    "status" => "error",
                    "message" => "Please verify your email before logging in."
                ]);
            }

        } else {
            // Password mismatch
            echo json_encode([
                "status" => "error",
                "message" => "Invalid credentials."
            ]);
        }

    } else {
        echo json_encode([
            "status" => "error",
            "message" => "User not found."
        ]);
    }

    $stmt->close();
}
$conn->close();
?>
