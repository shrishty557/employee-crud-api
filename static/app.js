const form = document.querySelector('#employee-form');
const idInput = document.querySelector('#employee-id');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const departmentInput = document.querySelector('#department');
const tbody = document.querySelector('#employees-body');
const message = document.querySelector('#message');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle('error', isError);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const detail = data && data.detail ? data.detail : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data;
}

async function loadEmployees() {
  tbody.innerHTML = '<tr><td colspan="5">Loading employees…</td></tr>';
  try {
    const employees = await api('/api/employees');
    tbody.replaceChildren();
    if (!employees.length) {
      tbody.innerHTML = '<tr><td colspan="5">No employees yet. Add one above.</td></tr>';
      return;
    }
    for (const employee of employees) {
      const tr = document.createElement('tr');
      for (const value of [employee.id, employee.name, employee.email, employee.department]) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      }
      const actionCell = document.createElement('td');
      const edit = document.createElement('button');
      edit.type = 'button'; edit.textContent = 'Edit';
      edit.addEventListener('click', () => startEdit(employee));
      const remove = document.createElement('button');
      remove.type = 'button'; remove.textContent = 'Delete'; remove.className = 'delete-button';
      remove.addEventListener('click', () => deleteEmployee(employee.id));
      actionCell.append(edit, remove);
      tr.appendChild(actionCell);
      tbody.appendChild(tr);
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5">Could not load employees. Check that the API and database are running.</td></tr>';
    showMessage(error.message, true);
  }
}

function resetForm() {
  form.reset();
  idInput.value = '';
  document.querySelector('#form-title').textContent = 'Add an employee';
  saveButton.textContent = 'Add employee';
  cancelButton.classList.add('hidden');
}

function startEdit(employee) {
  idInput.value = employee.id;
  nameInput.value = employee.name;
  emailInput.value = employee.email;
  departmentInput.value = employee.department;
  document.querySelector('#form-title').textContent = `Edit employee #${employee.id}`;
  saveButton.textContent = 'Save changes';
  cancelButton.classList.remove('hidden');
  showMessage('Editing employee ' + employee.id);
  nameInput.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const employee = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    department: departmentInput.value.trim(),
  };
  const id = idInput.value;
  try {
    const result = await api(id ? `/api/employees/${id}` : '/api/employees', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(employee),
    });
    showMessage(id ? 'Employee updated successfully.' : `Employee added successfully (ID ${result.id}).`);
    resetForm();
    await loadEmployees();
  } catch (error) { showMessage(error.message, true); }
});

async function deleteEmployee(id) {
  if (!window.confirm(`Delete employee #${id}? This will remove the record from SQL Server.`)) return;
  try {
    const result = await api(`/api/employees/${id}`, { method: 'DELETE' });
    showMessage(result.message);
    await loadEmployees();
  } catch (error) { showMessage(error.message, true); }
}

cancelButton.addEventListener('click', resetForm);
document.querySelector('#refresh-button').addEventListener('click', loadEmployees);
loadEmployees();
