<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success'=>false,'message'=>'Unauthorized']);
  exit;
}
$user_id = (int)$_SESSION['user_id'];

$action = $_GET['action'] ?? '';

switch($action) {
  // 1) Add a new goal
  case 'add':
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data['goal_name']) || empty($data['target_amount']) || empty($data['deadline'])) {
      echo json_encode(['success'=>false,'message'=>'Invalid input']);
      exit;
    }
    $g = $conn->real_escape_string($data['goal_name']);
    $t = (float)$data['target_amount'];
    $d = $conn->real_escape_string($data['deadline']);
    $sql = "INSERT INTO saving_goals (user_id,goal_name,target_amount,deadline)
            VALUES ($user_id,'$g',$t,'$d')";
    echo $conn->query($sql)
      ? json_encode(['success'=>true])
      : json_encode(['success'=>false,'message'=>$conn->error]);
    break;

  // 2) Add a manual saving contribution
  case 'add_saving':
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['goal_id'], $data['amount'])) {
      echo json_encode(['success'=>false,'message'=>'Invalid input']);
      exit;
    }
    $goal_id = (int)$data['goal_id'];
    $amt     = (float)$data['amount'];

    // --- Goal‑level check: sum existing contributions
    $res   = $conn->query(
      "SELECT IFNULL(SUM(amount),0) AS saved
       FROM contributions
       WHERE goal_id = $goal_id"
    );
    $saved = (float)$res->fetch_assoc()['saved'];

    // Fetch target for this goal (and ensure it belongs to this user)
    $res2 = $conn->query(
      "SELECT target_amount
       FROM saving_goals
       WHERE id = $goal_id
         AND user_id = $user_id"
    );
    if ($res2->num_rows === 0) {
      echo json_encode(['success'=>false,'message'=>'Goal not found']);
      exit;
    }
    $target = (float)$res2->fetch_assoc()['target_amount'];

    if ($saved + $amt > $target) {
      echo json_encode([
        'success' => false,
        'message' => sprintf(
          'This contribution (Rs.%.2f) would exceed your goal by Rs.%.2f',
          $amt,
          $saved + $amt - $target
        )
      ]);
      exit;
    }

    // --- Account‑level check: available budget = Income − (Expense + Saving + Use Saving)
    $res3 = $conn->query(
      "SELECT
         IFNULL(SUM(CASE WHEN type='Income'  THEN amount ELSE 0 END),0) AS total_inc,
         IFNULL(SUM(CASE WHEN type!='Income' THEN amount ELSE 0 END),0) AS total_out
       FROM transactions
       WHERE auth_id = $user_id"
    );
    $row3 = $res3->fetch_assoc();
    $availableBudget = (float)$row3['total_inc'] - (float)$row3['total_out'];
    if ($amt > $availableBudget) {
      echo json_encode([
        'success' => false,
        'message' => sprintf(
          'You only have Rs.%.2f available in your budget to save.',
          $availableBudget
        )
      ]);
      exit;
    }

    // Insert contribution
    $stmt = $conn->prepare(
      "INSERT INTO contributions (goal_id, amount) VALUES (?, ?)"
    );
    $stmt->bind_param("id", $goal_id, $amt);
    echo $stmt->execute()
      ? json_encode(['success'=>true])
      : json_encode(['success'=>false,'message'=>$stmt->error]);
    $stmt->close();
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

  // 5) Get saving transactions
  case 'get_saving_transactions':
    $sql = "SELECT 
              c.id,
              g.goal_name AS expenseType,
              c.amount,
              c.saved_at AS date,
              'Saving' AS type
            FROM contributions c
            JOIN saving_goals g ON c.goal_id = g.id
            WHERE g.user_id = $user_id
            ORDER BY c.saved_at DESC";
    $res = $conn->query($sql);
    $transactions = [];
    while ($row = $res->fetch_assoc()) $transactions[] = $row;
    echo json_encode(['success'=>true,'transactions'=>$transactions]);
    break;

  // 6) Delete a goal
  case 'delete':
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['id'])) {
      echo json_encode(['success'=>false,'message'=>'Invalid']);
      exit;
    }
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
?>