<?php
session_start();
header("Content-Type: application/json");
include 'db.php';

// Enable error reporting (for development only)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "unauthorized"]);
    exit;
}

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['type'], $data['amount'], $data['date'])) {
            echo json_encode(["error" => "Missing required fields"]);
            exit;
        }

        $type = trim($data['type']);
        $amount = floatval($data['amount']);
        $date = trim($data['date']);
        $expenseType = isset($data['expenseType']) && $data['expenseType'] !== '' ? trim($data['expenseType']) : '-';

        // Validate amount
        if ($amount <= 0) {
            echo json_encode(["error" => "Amount must be greater than 0"]);
            exit;
        }

        // Validate type
        $validTypes = ['Income', 'Expense', 'Saving', 'Use Saving'];
        if (!in_array($type, $validTypes)) {
            echo json_encode(["error" => "Invalid transaction type"]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO transactions (auth_id, type, expenseType, amount, date) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issds", $userId, $type, $expenseType, $amount, $date);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Transaction added successfully"]);
        } else {
            throw new Exception("Failed to add transaction: " . $stmt->error);
        }

        $stmt->close();

    } elseif ($method === 'GET') {
        $stmt = $conn->prepare("SELECT * FROM transactions WHERE auth_id = ? ORDER BY date DESC");
        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();
        $transactions = [];

        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }

        echo json_encode($transactions);
        $stmt->close();

    } elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['id'])) {
            echo json_encode(["error" => "Missing transaction ID"]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND auth_id = ?");
        $stmt->bind_param("ii", $data['id'], $userId);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Transaction deleted successfully"]);
        } else {
            throw new Exception("Failed to delete transaction: " . $stmt->error);
        }

        $stmt->close();
    } else {
        echo json_encode(["error" => "Unsupported request method"]);
    }

} catch (Exception $e) {
    error_log("Transaction Error: " . $e->getMessage());
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>
