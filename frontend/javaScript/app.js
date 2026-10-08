// 1. API Config & State Variables
const API_URL = 'http://localhost:3000/api/expenses';
let allExpenses = []; 

const filterCategory = document.getElementById('filterCategory');
const expenseForm = document.getElementById('expenseForm');
const editExpenseForm = document.getElementById('editExpenseForm');

// 2. Summary Cards Configuration
const summaryCardsData = [
  {
    id: "totalAmount",
    title: "Total Spent",
    defaultValue: "$0.00",
    iconClass: "bi-wallet2",
    bgClass: "bg-danger-subtle",
    textClass: "text-danger"
  },
  {
    id: "totalCount",
    title: "Transactions",
    defaultValue: "0",
    iconClass: "bi-receipt-cutoff",
    bgClass: "bg-info-subtle",
    textClass: "text-info"
  },
  {
    id: "maxExpense",
    title: "Highest Expense",
    defaultValue: "$0.00",
    iconClass: "bi-graph-up-arrow",
    bgClass: "bg-warning-subtle",
    textClass: "text-warning-emphasis"
  }
];

// 3. UI Helpers
function showAlert(message, type = 'danger') {
  const alertContainer = document.querySelector('#alertContainer');
  if (!alertContainer) return;

  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
      <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}


function getCategoryBadge(category) {
  const badges = {
    'Food': 'bg-success-subtle text-success border-success-subtle',
    'Bills': 'bg-danger-subtle text-danger border-danger-subtle',
    'Transport': 'bg-primary-subtle text-primary border-primary-subtle',
    'Entertainment': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    'Other': 'bg-secondary-subtle text-secondary border-secondary-subtle'
  };
  return badges[category] || 'bg-light text-dark';
}



function renderSummaryCards() {
  const container = document.getElementById("cardsContainer");

  if (container) {
    container.innerHTML = summaryCardsData.map(card => `
     
        <div class="card stat-card border-0 shadow-sm h-100">
          <div class="card-body p-3 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted small fw-semibold text-uppercase tracking-wide">${card.title}</span>
              <h3 class="fw-bold mb-0 mt-1 text-dark" id="${card.id}">${card.defaultValue}</h3>
            </div>
            <div class="stat-icon ${card.bgClass} ${card.textClass}">
              <i class="bi ${card.iconClass} fs-4"></i>
            </div>
          </div>
        </div>
     
    `).join("");
  }
}


// Helper Function: Format any date string or object into YYYY-MM-DD
function formatDate(dateInput) {
  if (!dateInput) return '';
  return new Date(dateInput).toISOString().split('T')[0];
}




// 4. Calculations Logic
function calculateTotalAmount(expenses) {
  return expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
}

function calculateMaxExpense(expenses) {
  if (expenses.length === 0) return 0;
  return Math.max(...expenses.map(item => parseFloat(item.amount)));
}

// 5. DOM Updates
function updateSummaryCards(expenses) {
  const totalAmountEl = document.querySelector('#totalAmount');
  const totalCountEl = document.querySelector('#totalCount');
  const maxExpenseEl = document.querySelector('#maxExpense');

  if (!totalAmountEl || !totalCountEl || !maxExpenseEl) return;

  const totalCount = expenses.length;
  const totalAmount = calculateTotalAmount(expenses);
  const maxExpense = calculateMaxExpense(expenses);

  totalCountEl.textContent = totalCount;
  totalAmountEl.textContent = `$${totalAmount.toFixed(2)}`;
  maxExpenseEl.textContent = `$${maxExpense.toFixed(2)}`;
}


// create Expense

function createExpenseRow(expense) {
  const tr = document.createElement('tr');

  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedAmount = parseFloat(expense.amount).toFixed(2);

  tr.innerHTML = `
    <td class="ps-4 fw-medium text-dark">${expense.title}</td>
    <td class="fw-bold text-dark">$${formattedAmount}</td>
    <td>
      <span class="badge border px-2 py-1 ${getCategoryBadge(expense.category)}">
        ${expense.category}
      </span>
    </td>
    <td class="text-muted small">${formattedDate}</td>
    <td class="text-end pe-4">
      <button class="btn btn-sm btn-outline-primary border-0 me-1" onclick="startEditExpense(${expense.id})" title="Edit">
        <i class="bi bi-pencil"></i>
      </button>
      <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteExpense(${expense.id})" title="Delete">
        <i class="bi bi-trash"></i>
      </button>
    </td>
  `;

  return tr;
}





function renderTable(expenses) {
  const expenseList = document.querySelector('#expenseList');
  const emptyState = document.querySelector('#emptyState');

  if (!expenseList || !emptyState) return;

  expenseList.innerHTML = '';

  const isEmpty = expenses.length === 0;
  emptyState.classList.toggle('d-none', !isEmpty);

  if (isEmpty) return;

  expenses.forEach(expense => {
    const row = createExpenseRow(expense);
    expenseList.appendChild(row);
  });
}

// 6. API Operations
async function fetchExpenses() {
  const spinner = document.getElementById('loadingSpinner');

  if (spinner) spinner.classList.remove('d-none');

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    allExpenses = await response.json();
    applyFilter();

  } catch (error) {
    console.error('Error fetching expenses:', error);
    showAlert('Unable to connect to the server. Please make sure the backend is running.', 'danger');
  } finally {
    if (spinner) spinner.classList.add('d-none');
  }
}

// 7. Add New Expense (POST Request)
expenseForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!expenseForm.checkValidity()) {
    e.stopPropagation();
    expenseForm.classList.add('was-validated');
    return;
  }

  const title = document.getElementById('title').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;

  const expenseData = { title, amount, category, date };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    showAlert('Transaction added successfully!', 'success');
    expenseForm.reset();
    expenseForm.classList.remove('was-validated');
    await fetchExpenses();

  } catch (error) {
    console.error('Error adding transaction:', error);
    showAlert('Could not save transaction. Please try again.', 'danger');
  }
});

// 8. Start Edit - Populate & Open Modal
function startEditExpense(id) {
  const expense = allExpenses.find(item => item.id === id);
  if (!expense) return;

  document.getElementById('editExpenseId').value = expense.id;
  document.getElementById('editTitle').value = expense.title;
  document.getElementById('editAmount').value = expense.amount;
  document.getElementById('editCategory').value = expense.category;

 document.getElementById('editDate').value = formatDate(expense.date);

  const editModal = new bootstrap.Modal(document.getElementById('editExpenseModal'));
  editModal.show();
}




// 9. Save Edit Expense (PUT Request)
editExpenseForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!editExpenseForm.checkValidity()) {
    e.stopPropagation();
    editExpenseForm.classList.add('was-validated');
    return;
  }

  const id = document.getElementById('editExpenseId').value;
  const title = document.getElementById('editTitle').value.trim();
  const amount = parseFloat(document.getElementById('editAmount').value);
  const category = document.getElementById('editCategory').value;
  const date = document.getElementById('editDate').value;

  const expenseData = { title, amount, category, date };

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData)
    });

    if (!response.ok) {
      throw new Error(`Server Error: ${response.status}`);
    }

    const modalElement = document.getElementById('editExpenseModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();

    showAlert('Transaction updated successfully!', 'success');
    editExpenseForm.classList.remove('was-validated');
    await fetchExpenses();

  } catch (error) {
    console.error('Error updating transaction:', error);
    showAlert('Could not update transaction. Please try again.', 'danger');
  }
});

// 10. Delete Expense Function (DELETE Request)
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete expense: ${response.status}`);
    }

    await fetchExpenses();
    showAlert('Expense deleted successfully!', 'success');

  } catch (error) {
    console.error('Error deleting expense:', error);
    showAlert('Could not delete expense. Please try again.', 'danger');
  }
}




function exportExpensesToCSV() {
  if (!allExpenses || allExpenses.length === 0) {
    return showAlert('No expenses data available to export!', 'warning');
  }


  let csvContent = "data:text/csv;charset=utf-8,ID,Title,Amount,Category,Date\n";


  allExpenses.forEach(exp => {
    const formattedDate = formatDate(exp.date);
    csvContent += `${exp.id},"${exp.title}",${exp.amount},${exp.category},"${formattedDate}"\n`;
  });


  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Expenses_Report_${formatDate(new Date())}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
}

document.getElementById('exportCsvBtn')?.addEventListener('click', exportExpensesToCSV);



// 11. Filtering Logic
function applyFilter() {
  const selectedCategory = filterCategory.value;

  if (selectedCategory === 'All') {
    renderTable(allExpenses);
    updateSummaryCards(allExpenses);
  } else {
    const filtered = allExpenses.filter(item => item.category === selectedCategory);
    renderTable(filtered);
    updateSummaryCards(filtered);
  }
}

filterCategory.addEventListener('change', applyFilter);

// 12. App Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderSummaryCards();
  fetchExpenses();
});