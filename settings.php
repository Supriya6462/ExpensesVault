<?php
session_start();
include "db_setup.php";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    
    exit();
}

$user_id = $_SESSION['user_id'];

// Handle different actions
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_user_data':
        // Fetch current user data
        $stmt = $conn->prepare("SELECT name, email FROM auth WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'user' => $user]);
        break;

    case 'update_profile':
        // Handle profile update
        $name = trim($_POST["name"]);
        $email = trim($_POST["email"]);
        $current_password = $_POST["current_password"] ?? '';
        $new_password = $_POST["new_password"] ?? '';
        $confirm_password = $_POST["confirm_password"] ?? '';
        
        $response = ['success' => false, 'message' => ''];
        
        // Validate current password if trying to change password
        if (!empty($new_password)) {
            $stmt = $conn->prepare("SELECT password FROM auth WHERE id = ?");
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user_data = $result->fetch_assoc();
            
            // Debug information
            error_log("Current password provided: " . $current_password);
            error_log("Stored hash: " . $user_data['password']);
            
            if (empty($current_password)) {
                $response['message'] = "Current password is required to change password";
            } else {
                // Verify the current password against the hashed password in database
                $is_valid = password_verify($current_password, $user_data['password']);
                error_log("Password verification result: " . ($is_valid ? "true" : "false"));
                
                if (!$is_valid) {
                    $response['message'] = "Current password is incorrect";
                } elseif ($new_password !== $confirm_password) {
                    $response['message'] = "New passwords do not match";
                } elseif (strlen($new_password) < 6) {
                    $response['message'] = "New password must be at least 6 characters long";
                } else {
                    // Update with new password
                    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                    $stmt = $conn->prepare("UPDATE auth SET name = ?, email = ?, password = ? WHERE id = ?");
                    $stmt->bind_param("sssi", $name, $email, $hashed_password, $user_id);
                }
            }
        } else {
            // Update without changing password
            $stmt = $conn->prepare("UPDATE auth SET name = ?, email = ? WHERE id = ?");
            $stmt->bind_param("ssi", $name, $email, $user_id);
        }
        
        if (empty($response['message'])) {
            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = "Profile updated successfully";
            } else {
                $response['message'] = "Error updating profile";
            }
        }
        
        header('Content-Type: application/json');
        echo json_encode($response);
        break;

    default:
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}
?> 