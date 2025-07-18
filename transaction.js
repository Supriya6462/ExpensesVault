let transactions = [];

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Menu Toggle
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      if (
        mobileMenu.style.display === "none" ||
        mobileMenu.style.display === ""
      ) {
        mobileMenu.style.display = "block";
      } else {
        mobileMenu.style.display = "none";
      }
    });
  }

  // Sidebar Toggle
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

// Toggle Expense Type Field
const typeSelect = document.getElementById("type");
const expenseTypeDiv = document.getElementById("expense-type-div");
const incomeTypeDiv = document.getElementById("income-type-div");
const incomeTypeSelect = document.getElementById("income-type");
const incomeCustomType = document.getElementById("income-custom-type");
const expenseTypeSelect = document.getElementById("expense-type");
const expenseCustomType = document.getElementById("expense-custom-type");

if (typeSelect && expenseTypeDiv && incomeTypeDiv) {
  // Set initial state - hide both fields
  incomeTypeDiv.classList.add("hidden");
  expenseTypeDiv.classList.add("hidden");

  typeSelect.addEventListener("change", () => {
    const selected = typeSelect.value;
    if (selected === "Income") {
      incomeTypeDiv.classList.remove("hidden");
      expenseTypeDiv.classList.add("hidden");
    } else if (selected === "Expense") {
      incomeTypeDiv.classList.add("hidden");
      expenseTypeDiv.classList.remove("hidden");
    } else {
      // For "Choose Category" or any other option
      incomeTypeDiv.classList.add("hidden");
      expenseTypeDiv.classList.add("hidden");
    }
  });
}

// Handle income type dropdown change
if (incomeTypeSelect && incomeCustomType) {
  incomeTypeSelect.addEventListener("change", () => {
    if (incomeTypeSelect.value === "Others") {
      incomeCustomType.classList.remove("hidden");
    } else {
      incomeCustomType.classList.add("hidden");
    }
  });
}

// Handle expense type dropdown change
if (expenseTypeSelect && expenseCustomType) {
  expenseTypeSelect.addEventListener("change", () => {
    if (expenseTypeSelect.value === "Others") {
      expenseCustomType.classList.remove("hidden");
    } else {
      expenseCustomType.classList.add("hidden");
    }
  });
}

  // Add helper function to reset form
  function resetForm() {
    document.getElementById("amount").value = "";
    document.getElementById("date").value = "";
    document.getElementById("expense-type").value = "Rent";
    document.getElementById("expense-custom-type").value = "";
    document.getElementById("income-type").value = "Salary";
    document.getElementById("income-custom-type").value = "";
    document.getElementById("type").value = "Choose Category";
    
    // Hide both type fields
    incomeTypeDiv.classList.add("hidden");
    expenseTypeDiv.classList.add("hidden");
    incomeCustomType.classList.add("hidden");
    expenseCustomType.classList.add("hidden");
  }

  // Add Transaction
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  if (addTransactionBtn) {
    addTransactionBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const type = document.getElementById("type").value;
      const amount = parseFloat(document.getElementById("amount").value);
      const date = document.getElementById("date").value;
      
      // Validate amount
      if (!amount || amount <= 0) {
        alert("Please enter a valid positive amount");
        resetForm();
        return;
      }

      // Get the appropriate type value based on category
      let typeValue;
      if (type === "Income") {
        const incomeType = document.getElementById("income-type").value;
        if (incomeType === "Others") {
          typeValue = document.getElementById("income-custom-type").value;
          if (!typeValue) {
            alert("Please enter a custom income type");
            resetForm();
            return;
          }
        } else {
          typeValue = incomeType;
        }
      } else if (type === "Expense") {
        // Check if expense amount exceeds available budget first
        const totalIncome = getTotalIncome();
        const totalExpense = getTotalExpense();
        const totalSaving = getTotalSaving();
        const availableBudget = totalIncome - totalExpense - totalSaving;

        if (amount > availableBudget) {
          alert(`Insufficient balance! Available budget: Rs.${availableBudget.toFixed(2)}`);
          resetForm();
          return;
        }

        const expenseType = document.getElementById("expense-type").value;
        if (expenseType === "Others") {
          typeValue = document.getElementById("expense-custom-type").value;
          if (!typeValue) {
            alert("Please enter a custom expense type");
            resetForm();
            return;
          }
        } else {
          typeValue = expenseType;
        }
      } else if (type === "Saving") {
        typeValue = "Saving";
      } else {
        alert("Please select a valid category.");
        resetForm();
        return;
      }

      if (!amount || !date || !typeValue) {
        alert("Please provide all required fields.");
        resetForm();
        return;
      }

      fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type, 
          amount, 
          expenseType: typeValue, 
          date 
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.message) {
            alert(data.message);
            fetchTransactions();
            resetForm();
          } else {
            alert(data.error || "Error adding transaction");
            resetForm();
          }
        })
        .catch((err) => {
          console.error("Error adding transaction:", err);
          resetForm();
        });
    });
  }

  // Delete Transaction
  const transactionList = document.getElementById("transaction-list");
  if (transactionList) {
    transactionList.addEventListener("click", (e) => {
      if (e.target && e.target.classList.contains("delete-btn")) {
        const transactionId = e.target.getAttribute("data-id");

        fetch("api.php", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: transactionId }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.message) {
              alert(data.message);
              fetchTransactions();
            } else {
              alert(data.error || "Error deleting transaction");
            }
          })
          .catch((err) => console.error("Error deleting transaction:", err));
      }
    });
  }

  // Summary & Rendering Functions
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

  // Add new function to fetch total savings from goals
  async function fetchTotalSavings() {
    try {
      const response = await fetch('Savinggoal.php?action=get_saving_total');
      const data = await response.json();
      return data.success ? data.total_saving : 0;
    } catch (err) {
      console.error("Error fetching total savings:", err);
      return 0;
    }
  }

  async function updateSummary() {
    const totalIncome = getTotalIncome();
    const totalExpense = getTotalExpense();
    const totalSaving = getTotalSaving();
    const totalBudgetElem = document.getElementById("total-budget");
    const totalAmountElem = document.getElementById("total-amount");

    // Fetch total savings from goals (same as dashboard.js)
    const totalGoalSavings = await fetchTotalSavings();
    console.log("DEBUG: totalGoalSavings from API in Transactions page:", totalGoalSavings);

    // Calculate total budget by subtracting both transaction savings and goal savings
    const totalBudget = totalIncome - totalExpense - totalGoalSavings;
    
    // Update the summary card
    if (totalBudgetElem) {
      totalBudgetElem.textContent = `Rs.${totalBudget}`;
    }
    
    // Update the table footer
    if (totalAmountElem) {
      totalAmountElem.textContent = `Rs.${totalBudget}`;
    }
  }

  function renderTransactions() {
    if (!transactionList) return;
    transactionList.innerHTML = "";
    transactions.forEach((tx) => {
      const row = document.createElement("tr");
      row.className = "transition-all duration-300 hover:bg-blue-50/50 group";
      row.innerHTML = `
        <td class="py-4 px-6">${tx.type}</td>
        <td class="py-4 px-6">${tx.expenseType}</td>
        <td class="py-4 px-6">Rs.${parseFloat(tx.amount).toFixed(2)}</td>
        <td class="py-4 px-6">${tx.date}</td>
        <td class="py-4 px-6">
          <button class="delete-btn text-red-500 transition-all duration-300 group-hover:bg-red-50 group-hover:text-red-600" data-id="${tx.id}">Delete</button>
        </td>
      `;
      transactionList.appendChild(row);
    });
    updateSummary(); // Update summary after rendering transactions
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
            renderTransactions();
            updateSummary();
          });
      })
      .catch((err) => console.error("Error fetching transactions:", err));
  }

  // Initial fetch
  fetchTransactions();
});