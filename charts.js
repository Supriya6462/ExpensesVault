document.addEventListener("DOMContentLoaded", function () {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener("click", () => {
            mobileMenu.style.display = mobileMenu.style.display === "none" ? "block" : "none";
        });
    }

    // Sidebar toggle
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

    // Chart instances
    let monthlyChart, categoryChart, timeSeriesChart;
    let transactions = [];
    let filteredTransactions = [];

    // DOM elements
    const applyFilterBtn = document.getElementById("apply-filter-btn");
    const clearFilterBtn = document.getElementById("clear-filter-btn");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const typeFilterSelect = document.getElementById("typeFilter");

    // Initialize the page
    function init() {
        setupEventListeners();
        fetchTransactions();
        
        // Set default date range to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        startDateInput.valueAsDate = startDate;
        endDateInput.valueAsDate = endDate;
    }

    // Set up event listeners
    function setupEventListeners() {
        applyFilterBtn.addEventListener("click", applyFilters);
        clearFilterBtn.addEventListener("click", clearFilters);
    }

    // Fetch transactions from API
    function fetchTransactions() {
        Promise.all([
            fetch("api.php"),
            fetch("Savinggoal.php?action=get")
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([transactionsData, savingData]) => {
            if (transactionsData.error) {
                console.error("API Error:", transactionsData.error);
                if (transactionsData.error === "unauthorized") {
                    window.location.href = "l.html";
                }
                return;
            }
            transactions = transactionsData;
            // Add saving transactions from saving goals
            if (savingData.success && savingData.goals) {
                savingData.goals.forEach(goal => {
                    if (goal.saved > 0) {  // Only add if there are savings
                        transactions.push({
                            date: goal.deadline,
                            amount: goal.saved,
                            type: "Saving",
                            expenseType: goal.goal_name,
                            description: `Savings for ${goal.goal_name}`
                        });
                    }
                });
            }
            filteredTransactions = [...transactions];
            renderCharts();
        })
        .catch(error => {
            console.error("Error fetching data:", error);
        });
    }

    // Apply filters
    function applyFilters() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const typeFilter = typeFilterSelect.value;

        filteredTransactions = transactions.filter(transaction => {
            // Date filter
            if (startDate && transaction.date < startDate) return false;
            if (endDate && transaction.date > endDate) return false;
            
            // Type filter
            if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
            
            return true;
        });

        renderCharts();
    }

    // Clear filters
    function clearFilters() {
        startDateInput.value = "";
        endDateInput.value = "";
        typeFilterSelect.value = "all";
        filteredTransactions = [...transactions];
        renderCharts();
    }

    // Render all charts
    function renderCharts() {
        renderTimeSeriesChart();
        renderMonthlyChart();
        renderCategoryChart();
        renderSavingGoalsChart();
    }

    // Time series chart
    function renderTimeSeriesChart() {
        const ctx = document.getElementById("timeSeriesChart").getContext("2d");
        
        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Prepare data for cumulative spending
        let cumulativeBalance = 0;
        const dates = [];
        const balances = [];
        
        sortedTransactions.forEach(tx => {
            const amount = parseFloat(tx.amount);
            if (tx.type === "Income") {
                cumulativeBalance += amount;
            } else if (tx.type === "Expense") {
                cumulativeBalance -= amount;
            } else if (tx.type === "Saving") {
                cumulativeBalance += amount;  // Add savings to balance
            }
            
            dates.push(tx.date);
            balances.push(cumulativeBalance);
        });

        if (timeSeriesChart) timeSeriesChart.destroy();

        timeSeriesChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: dates,
                datasets: [{
                    label: "Net Balance Over Time",
                    data: balances,
                    borderColor: "#4CAF50",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Balance: Rs.${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: "Balance (Rs.)"
                        },
                        grid: {
                            color: "rgba(0, 0, 0, 0.05)"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Date"
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    // Monthly overview chart
    function renderMonthlyChart() {
        const ctx = document.getElementById("monthlyChart").getContext("2d");
        
        // Group by month using filtered transactions
        const monthlyData = {};
        filteredTransactions.forEach(tx => {
            const date = new Date(tx.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0, saving: 0 };
            }
            
            if (tx.type === "Income") monthlyData[monthYear].income += parseFloat(tx.amount);
            else if (tx.type === "Expense") monthlyData[monthYear].expense += parseFloat(tx.amount);
            else if (tx.type === "Saving") monthlyData[monthYear].saving += parseFloat(tx.amount);
        });

        const labels = Object.keys(monthlyData).sort();
        const incomeData = labels.map(month => monthlyData[month].income);
        const expenseData = labels.map(month => monthlyData[month].expense);
        const savingData = labels.map(month => monthlyData[month].saving);

        if (monthlyChart) monthlyChart.destroy();

        monthlyChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Income",
                        data: incomeData,
                        backgroundColor: "#4CAF50",
                        borderColor: "#388E3C",
                        borderWidth: 1
                    },
                    {
                        label: "Expenses",
                        data: expenseData,
                        backgroundColor: "#F44336",
                        borderColor: "#D32F2F",
                        borderWidth: 1
                    },
                    {
                        label: "Savings",
                        data: savingData,
                        backgroundColor: "#2196F3",
                        borderColor: "#1976D2",
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Rs.${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Amount (Rs.)"
                        },
                        grid: {
                            color: "rgba(0, 0, 0, 0.05)"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Month"
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Category breakdown chart
    function renderCategoryChart() {
        const ctx = document.getElementById("categoryChart").getContext("2d");
        
        // Group by category using filtered transactions
        const categoryData = {};
        filteredTransactions.forEach(tx => {
            if (tx.type === "Expense") {
                const category = tx.expenseType || "Uncategorized";
                categoryData[category] = (categoryData[category] || 0) + parseFloat(tx.amount);
            } else if (tx.type === "Saving") {
                const category = tx.expenseType || "Uncategorized";
                categoryData[category] = (categoryData[category] || 0) + parseFloat(tx.amount);
            }
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        if (categoryChart) categoryChart.destroy();

        categoryChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
                        "#9966FF", "#FF9F40", "#8AC249", "#EA5545",
                        "#FEB147", "#B2D3C2", "#0F7173", "#EEC584"
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: Rs.${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Saving Goals Chart
    function renderSavingGoalsChart() {
        const ctx = document.getElementById("savingGoalsChart").getContext("2d");
        
        // Filter only saving transactions
        const savingTransactions = filteredTransactions.filter(tx => tx.type === "Saving");
        
        // Group by goal name
        const goalData = {};
        savingTransactions.forEach(tx => {
            const goalName = tx.expenseType;
            if (!goalData[goalName]) {
                goalData[goalName] = {
                    saved: 0,
                    target: 0
                };
            }
            goalData[goalName].saved += parseFloat(tx.amount);
        });

        const labels = Object.keys(goalData);
        const savedData = labels.map(goal => goalData[goal].saved);

        if (savingGoalsChart) savingGoalsChart.destroy();

        savingGoalsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Amount Saved",
                    data: savedData,
                    backgroundColor: "#2196F3",
                    borderColor: "#1976D2",
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Saved: Rs.${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Amount (Rs.)"
                        },
                        grid: {
                            color: "rgba(0, 0, 0, 0.05)"
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: "Saving Goal"
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize the page
    init();
});