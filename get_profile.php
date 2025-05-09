<?php
session_start();
header('Content-Type: application/json');

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Debug information
$debug = [
    'session_status' => session_status(),
    'session_id' => session_id(),
    'session_data' => $_SESSION
];

if (isset($_SESSION['user_id']) && !empty($_SESSION['user_id'])) {
    $response = [
        'status' => 'success',
        'user' => [
            'name' => $_SESSION['name'] ?? '',
            'email' => $_SESSION['email'] ?? ''
        ],
        'debug' => $debug
    ];
    
    // Log successful response
    error_log('Profile fetch successful: ' . json_encode($response));
    echo json_encode($response);
} else {
    $response = [
        'status' => 'error',
        'message' => 'User not logged in or session expired',
        'debug' => $debug
    ];
    
    // Log error response
    error_log('Profile fetch failed: ' . json_encode($response));
    echo json_encode($response);
}
?>
