document.addEventListener("DOMContentLoaded", () => {
  fetch("Savinggoal.php?action=get_saving_total")
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        const total = parseFloat(data.total_saving).toFixed(2);
        const savingElem = document.getElementById("total-saving");
        if (savingElem) savingElem.textContent = `Rs.${total}`;
      }
    })
    .catch(console.error);
});

let transactions = [];
let filteredTransactions = [];
let chart;

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.style.display =
        mobileMenu.style.display === "block" ? "none" : "block";
    });
  }

  const sidebarToggleBtn = document.getElementById("mobile-menu-btn");
  const sidebarCloseBtn = document.getElementById("sidebar-close-btn");
  const sidebar = document.getElementById("sidebar");
  if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }
  if (sidebarCloseBtn && sidebar) {
    sidebarCloseBtn.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
    });
  }

  const applyFilterBtn = document.getElementById("apply-filter-btn");
  const clearFilterBtn = document.getElementById("clear-filter-btn");
  if (applyFilterBtn)
    applyFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      applyFilter();
    });
  if (clearFilterBtn)
    clearFilterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearFilter();
    });

  const transactionList = document.getElementById("transactions-table-body");
  if (transactionList) {
    transactionList.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const transactionId = e.target.dataset.id;
        fetch("api.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: transactionId }),
        })
          .then((res) => res.json())
          .then((data) => {
            alert(data.message || data.error);
            fetchTransactions();
          })
          .catch((err) => console.error(err));
      }
    });
  }

  fetchTransactions();
});

function getTotalIncome() {
  return transactions
    .filter((tx) => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function getTotalExpense() {
  return transactions
    .filter((tx) => tx.type === "Expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function getTotalSaving() {
  return transactions
    .filter((tx) => tx.type === "Saving")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function getFilteredTotalIncome() {
  return filteredTransactions
    .filter((tx) => tx.type === "Income")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function getFilteredTotalExpense() {
  return filteredTransactions
    .filter((tx) => tx.type === "Expense")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function getFilteredTotalSaving() {
  return filteredTransactions
    .filter((tx) => tx.type === "Saving")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
}

function updateSummary() {
  const income = getTotalIncome();
  const expense = getTotalExpense();
  const saving = getTotalSaving();
  const incomeElem = document.getElementById("total-income");
  const expenseElem = document.getElementById("total-expense");
  const savingElem = document.getElementById("total-saving");
  const budgetElem = document.getElementById("total-budget");
  const budgetTable = document.getElementById("total-budget-table");

  if (incomeElem) incomeElem.textContent = `Rs.${income}`;
  if (expenseElem) expenseElem.textContent = `Rs.${expense}`;
  if (savingElem) savingElem.textContent = `Rs.${saving}`;

  const budget = income - expense - saving;
  if (budgetElem) budgetElem.textContent = `Rs.${budget}`;
  if (budgetTable) budgetTable.textContent = `Rs.${budget}`;
}

function generateChart() {
  const ctx = document.getElementById("pieChart");
  if (!ctx) return;

  const typeFilter = document.getElementById("typeFilter").value;
  
  if (typeFilter === "all") {
    // Show overall distribution
    const inc = getFilteredTotalIncome();
    const exp = getFilteredTotalExpense();
    const sav = getFilteredTotalSaving();

    const categories = [];
    const amounts = [];
    
    if (inc > 0) {
      categories.push("Income");
      amounts.push(inc);
    }
    if (sav > 0) {
      categories.push("Saved");
      amounts.push(sav);
    }
    if (exp > 0) {
      categories.push("Expense");
      amounts.push(exp);
    }

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "pie",
      data: { 
        labels: categories, 
        datasets: [{ 
          data: amounts,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',  // green for income
            'rgba(59, 130, 246, 0.8)', // blue for saved
            'rgba(239, 68, 68, 0.8)'   // red for expense
          ]
        }] 
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  } else {
    // Show detailed breakdown of expense/income types
    const typeBreakdown = {};
    filteredTransactions.forEach(tx => {
      if (tx.type === typeFilter) {
        typeBreakdown[tx.expenseType] = (typeBreakdown[tx.expenseType] || 0) + parseFloat(tx.amount);
      }
    });

    const categories = Object.keys(typeBreakdown);
    const amounts = Object.values(typeBreakdown);

    // Generate colors based on the number of categories
    const colors = categories.map((_, index) => {
      const hue = typeFilter === "Income" 
        ? (120 + index * 30) % 360  // Green shades for income
        : typeFilter === "Saving"
        ? (210 + index * 30) % 360  // Blue shades for saving
        : (0 + index * 30) % 360;   // Red shades for expense
      return `hsla(${hue}, 70%, 60%, 0.8)`;
    });

    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "pie",
      data: { 
        labels: categories, 
        datasets: [{ 
          data: amounts,
          backgroundColor: colors
        }] 
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: `${typeFilter} Breakdown by Type`
          }
        }
      }
    });
  }
}

function renderTransactions() {
  const list = document.getElementById("transactions-table-body");
  if (!list) return;
  list.innerHTML = filteredTransactions
    .map(
      (tx) => `
    <tr>
      <td class="py-2 px-4 border">${tx.type}</td>
      <td class="py-2 px-4 border">${tx.expenseType}</td>
      <td class="py-2 px-4 border">${tx.amount}</td>
      <td class="py-2 px-4 border">${tx.date}</td>
      <td class="py-2 px-4 border"><button class="delete-btn text-red-500" data-id="${tx.id}">Delete</button></td>
    </tr>`
    )
    .join("");
}

function fetchTransactions() {
  // Fetch regular transactions
  fetch("api.php")
    .then((res) => res.json())
    .then((data) => {
      // Fetch saving transactions
      return fetch("Savinggoal.php?action=get_saving_transactions")
        .then((res) => res.json())
        .then((savingData) => {
          // Combine regular and saving transactions
          transactions = [...data, ...(savingData.success ? savingData.transactions : [])];
          // Sort by date in descending order
          transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
          filteredTransactions = [...transactions];
          renderTransactions();
          updateSummary();
          generateChart();
        });
    })
    .catch(console.error);
}

function applyFilter() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const typeFilter = document.getElementById("typeFilter").value;

  filteredTransactions = transactions.filter((tx) => {
    const dateInRange = (!startDate || tx.date >= startDate) && (!endDate || tx.date <= endDate);
    const typeMatches = typeFilter === "all" || tx.type === typeFilter;
    return dateInRange && typeMatches;
  });

  renderTransactions();
  updateSummary();
  generateChart();
}

function clearFilter() {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("typeFilter").value = "all";
  filteredTransactions = [...transactions];
  renderTransactions();
  updateSummary();
  generateChart();
}

