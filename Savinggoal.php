<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success'=>false,'message'=>'Unauthorized']); exit;
}
$user_id = (int)$_SESSION['user_id'];
$action = $_GET['action'] ?? '';
switch($action) {
  // 1) Add a new goal
  case 'add':
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['goal_name']) || empty($data['target_amount']) || empty($data['deadline'])) {
      echo json_encode(['success'=>false,'message'=>'Invalid input']); exit;
    }
    $g = $conn->real_escape_string($data['goal_name']);
    $t = (float)$data['target_amount'];
    $d = $conn->real_escape_string($data['deadline']);
    $sql = "INSERT INTO saving_goals (user_id,goal_name,target_amount,deadline) VALUES ($user_id,'$g',$t,'$d')";
    echo $conn->query($sql)
      ? json_encode(['success'=>true])
      : json_encode(['success'=>false,'message'=>$conn->error]);
    break;

  // 2) Add a manual saving contribution
  case 'add_saving':
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['goal_id']) || !isset($data['amount'])) {
      echo json_encode(['success'=>false,'message'=>'Invalid input']); exit;
    }
    $goal_id = (int)$data['goal_id'];
    $amt = (float)$data['amount'];
    $sql = "INSERT INTO contributions (goal_id, amount) VALUES ($goal_id, $amt)";
    echo $conn->query($sql)
      ? json_encode(['success'=>true])
      : json_encode(['success'=>false,'message'=>$conn->error]);
    break;

  // 3) Fetch goals with summed savings
  case 'get':
    $sql = "SELECT g.id, g.goal_name, g.target_amount, g.deadline,
               IFNULL(SUM(c.amount),0) AS saved
            FROM saving_goals g
            LEFT JOIN contributions c
              ON c.goal_id=g.id AND c.saved_at <= g.deadline
            WHERE g.user_id=$user_id
            GROUP BY g.id
            ORDER BY g.deadline ASC";
    $res = $conn->query($sql);
    $goals = [];
    while ($row = $res->fetch_assoc()) $goals[] = $row;
    echo json_encode(['success'=>true,'goals'=>$goals]);
    break;

  // 4) Fetch total across all goals
  case 'get_saving_total':
    $sql = "SELECT IFNULL(SUM(sub.saved),0) AS total_saving FROM (
              SELECT IFNULL(SUM(c.amount),0) AS saved
              FROM saving_goals g
              LEFT JOIN contributions c
                ON c.goal_id=g.id AND c.saved_at <= g.deadline
              WHERE g.user_id=$user_id
              GROUP BY g.id
            ) sub";
    $r = $conn->query($sql)->fetch_assoc();
    echo json_encode(['success'=>true,'total_saving'=>$r['total_saving']]);
    break;

  // 6) Get saving transactions
  case 'get_saving_transactions':
    $sql = "SELECT 
              c.id,
              g.goal_name as expenseType,
              c.amount,
              c.saved_at as date,
              'Saving' as type
            FROM contributions c
            JOIN saving_goals g ON c.goal_id = g.id
            WHERE g.user_id = $user_id
            ORDER BY c.saved_at DESC";
    $res = $conn->query($sql);
    $transactions = [];
    while ($row = $res->fetch_assoc()) $transactions[] = $row;
    echo json_encode(['success'=>true,'transactions'=>$transactions]);
    break;

  // 5) Delete a goal
  case 'delete':
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) { echo json_encode(['success'=>false,'message'=>'Invalid']); exit; }
    $id = (int)$data['id'];
    $sql = "DELETE FROM saving_goals WHERE id=$id AND user_id=$user_id";
    echo $conn->query($sql)
      ? json_encode(['success'=>true])
      : json_encode(['success'=>false,'message'=>$conn->error]);
    break;

  default:
    echo json_encode(['success'=>false,'message'=>'Invalid action']);
}
$conn->close();