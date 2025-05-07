<?php
$host = "localhost";
$user = "root";
$pass = "";
$dbname = "expense_tracker";

// Connect to MySQL
$conn = new mysqli($host, $user, $pass);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create Database if not exists
$sql = "CREATE DATABASE IF NOT EXISTS $dbname";
$conn->query($sql);

// Select the database
$conn->select_db($dbname);

// Create auth table if not exists (add reset token columns)
$sql = "CREATE TABLE IF NOT EXISTS auth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expiry DATETIME DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0
)";

$conn->query($sql);

// Create transactions table if not exists
$sql = "CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auth_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    expenseType VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    FOREIGN KEY (auth_id) REFERENCES auth(id)
)";
$conn->query($sql);

// Add reset token columns if they don't exist
$result = $conn->query("SHOW COLUMNS FROM auth LIKE 'reset_token'");
if ($result->num_rows === 0) {
    $conn->query("ALTER TABLE auth ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL");
    $conn->query("ALTER TABLE auth ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL");
}
?>
