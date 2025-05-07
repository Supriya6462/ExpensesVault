<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require 'db_setup.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify Email - Xpense Vault</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center font-['Inter']">

<div class="bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center max-w-md mx-auto">
    <img src="images/logo.png" alt="Xpense Vault Logo" class="w-24 h-24 object-cover rounded-2xl mx-auto mb-6 transition-transform hover:scale-110 hover:rotate-2">
    <?php
    if (isset($_GET['token'])) {
        $token = mysqli_real_escape_string($conn, $_GET['token']);

        $query = "SELECT * FROM auth WHERE reset_token='$token' LIMIT 1";
        $result = mysqli_query($conn, $query);

        if ($result && mysqli_num_rows($result) > 0) {
            $user = mysqli_fetch_assoc($result);

            $update = "UPDATE auth SET is_verified=1, reset_token=NULL WHERE id=" . $user['id'];
            if (mysqli_query($conn, $update)) {
                echo "<h2 class='text-2xl font-bold text-green-600 mb-4'>✅ Email Verified Successfully!</h2>";
                echo "<p class='text-gray-700 mb-6'>You can now log in to your account.</p>";
                echo "<a href='l.html' class='inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition'>Go to Login</a>";
            } else {
                echo "<h2 class='text-2xl font-bold text-red-600 mb-4'>❌ Verification Failed!</h2>";
                echo "<p class='text-gray-700 mb-6'>Something went wrong while updating your verification status. Please try again later.</p>";
            }
        } else {
            echo "<h2 class='text-2xl font-bold text-red-600 mb-4'>❌ Invalid or Expired Link!</h2>";
            echo "<p class='text-gray-700 mb-6'>The verification link is invalid or has already been used.</p>";
        }
    } else {
        echo "<h2 class='text-2xl font-bold text-red-600 mb-4'>❌ No Token Provided!</h2>";
        echo "<p class='text-gray-700 mb-6'>Please check your email for the correct verification link.</p>";
    }
    ?>
</div>

</body>
</html>

