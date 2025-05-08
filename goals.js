document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
  updateTotalSavings();
  document.getElementById('add-goal-btn').addEventListener('click', addGoal);
  document.getElementById('add-saving-btn').addEventListener('click', addSaving);
  document.getElementById('goal-list').addEventListener('click', e => {
    if (e.target.classList.contains('delete-goal-btn')) deleteGoal(e.target.dataset.id);
  });
});

// 1) Create a new goal
function addGoal(e) {
  e.preventDefault();
  const name = document.getElementById('goal-name').value.trim();
  const amount = document.getElementById('target-amount').value;
  const deadline = document.getElementById('deadline').value;
  if (!name || !amount || !deadline) return alert('Please fill in all fields.');
  fetch('Savinggoal.php?action=add', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({goal_name: name, target_amount: amount, deadline})
  })
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      ['goal-name','target-amount','deadline'].forEach(id=>document.getElementById(id).value='');
      loadGoals(); updateTotalSavings();
    } else alert(data.message);
  }).catch(console.error);
}

// 2) Add a manual daily saving
function addSaving(e) {
  e.preventDefault();
  const goalId = document.getElementById('manual-goal').value;
  const amount = document.getElementById('manual-amount').value;
  if (!goalId || !amount) return alert('Select a goal and enter amount.');
  fetch('Savinggoal.php?action=add_saving', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({goal_id: goalId, amount})
  })
  .then(r=>r.json())
  .then(data=>{
    if (data.success) {
      document.getElementById('manual-amount').value = '';
      loadGoals(); updateTotalSavings();
    } else alert(data.message);
  }).catch(console.error);
}

// 3) Load goals & populate table + dropdown + congrats
function loadGoals() {
  fetch('Savinggoal.php?action=get')
    .then(r=>r.json())
    .then(data=>{
      const tbody = document.getElementById('goal-list');
      const select = document.getElementById('manual-goal');
      const alerted = JSON.parse(localStorage.getItem('alertedGoals')||'[]');
      if (data.success && data.goals.length) {
        tbody.innerHTML = data.goals.map(g=>`
          <tr class="group hover:bg-blue-50/50 transition">
            <td class="py-2 px-4 border">${g.goal_name}</td>
            <td class="py-2 px-4 border">Rs.${parseFloat(g.target_amount).toFixed(2)}</td>
            <td class="py-2 px-4 border">Rs.${parseFloat(g.saved).toFixed(2)}</td>
            <td class="py-2 px-4 border">${g.deadline}</td>
            <td class="py-2 px-4 border">
              <button class="delete-goal-btn text-red-500" data-id="${g.id}">Delete</button>
            </td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4">No goals found.</td></tr>';
      }
      // populate select
      select.innerHTML = data.goals.map(g=>
        `<option value="${g.id}">${g.goal_name} (Rs.${parseFloat(g.saved).toFixed(2)}/Rs.${parseFloat(g.target_amount).toFixed(2)})</option>`
      ).join('');
      // congrats
      data.goals.forEach(g=>{
        if (parseFloat(g.saved) >= parseFloat(g.target_amount) && !alerted.includes(g.id)) {
          alert(`🎉 Congrats! You've hit your goal "${g.goal_name}".`);
          alerted.push(g.id);
          localStorage.setItem('alertedGoals', JSON.stringify(alerted));
        }
      });
    }).catch(console.error);
}

// 4) Update total
function updateTotalSavings() {
  fetch('Savinggoal.php?action=get_saving_total')
    .then(r=>r.json())
    .then(data=>{
      if (!data.success) return;
      const tot = parseFloat(data.total_saving).toFixed(2);
      document.getElementById('total-saving').textContent = `Rs.${tot}`;
      document.getElementById('total-savings-table').textContent = `Rs.${tot}`;
    }).catch(console.error);
}

// delete

function deleteGoal(goalId) {
  if (!confirm('Are you sure you want to delete this goal (and any saved amounts)?')) return;
  fetch(`Savinggoal.php?action=delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: goalId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        loadGoals();
        updateTotalSavings();
      } else {
        alert(data.message || 'Failed to delete goal');
      }
    })
    .catch(err => console.error('Delete error:', err));
}