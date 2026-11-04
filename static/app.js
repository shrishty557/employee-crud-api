// EmployeeHub - Frontend JavaScript

const API_URL = "/api/employees";

let employees = [];

// Get HTML elements
const employeeTableBody = document.getElementById("employeeTableBody");
const searchInput = document.getElementById("searchInput");
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const addEmployeeForm = document.getElementById("addEmployeeForm");
const employeeForm = document.getElementById("employeeForm");
const cancelEmployeeBtn = document.getElementById("cancelEmployeeBtn");
const formMessage = document.getElementById("formMessage");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Get employee details safely
function getEmployeeId(employee) {
    return employee.employee_id ?? employee.id ?? "";
}

function getEmployeeName(employee) {
    return employee.name ?? employee.full_name ?? "";
}

function getEmployeeEmail(employee) {
    return employee.email ?? "";
}

function getEmployeeDepartment(employee) {
    return employee.department ?? "";
}

function getEmployeeCreatedAt(employee) {
    const date = employee.created_at ?? employee.createdAt ?? "";
    if (!date) return "";

    const parsedDate = new Date(date);

    return isNaN(parsedDate.getTime())
        ? String(date)
        : parsedDate.toLocaleDateString();
}

// Display employees in the table
function renderEmployees(list) {
    if (!employeeTableBody) return;

    employeeTableBody.innerHTML = "";

    if (!list.length) {
        employeeTableBody.innerHTML =
            '<tr><td colspan="10">No employees found.</td></tr>';
        return;
    }

    list.forEach((employee) => {
        const row = document.createElement("tr");

        const values = [
            getEmployeeId(employee),
            getEmployeeName(employee),
            getEmployeeEmail(employee),
            getEmployeeDepartment(employee),
            getEmployeeCreatedAt(employee)
        ];

        // Match the number of cells to the table headings
        const headings = document.querySelectorAll("thead th");

        headings.forEach((heading, index) => {
            const cell = document.createElement("td");
            const headingText = heading.textContent.trim().toLowerCase();

            if (headingText.includes("action")) {
                cell.textContent = "—";
            } else if (
                headingText.includes("email")
            ) {
                cell.textContent = getEmployeeEmail(employee);
            } else if (
                headingText.includes("department")
            ) {
                cell.textContent = getEmployeeDepartment(employee);
            } else if (
                headingText.includes("created") ||
                headingText.includes("date")
            ) {
                cell.textContent = getEmployeeCreatedAt(employee);
            } else {
                cell.textContent = values[index] ?? "";
            }

            row.appendChild(cell);
        });

        employeeTableBody.appendChild(row);
    });
}

// Load employees from the backend
async function loadEmployees() {
    if (!employeeTableBody) return;

    employeeTableBody.innerHTML =
        '<tr><td colspan="10">Loading employees...</td></tr>';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load employees.");
        }

        const data = await response.json();

        employees = Array.isArray(data)
            ? data
            : data.employees ?? [];
            // Update dashboard statistics
document.getElementById("totalEmployees").textContent =
    employees.length;

document.getElementById("totalDepartments").textContent =
    new Set(
        employees
            .map(employee => getEmployeeDepartment(employee))
            .filter(Boolean)
    ).size;

document.getElementById("dashboardStatus").textContent = "Active";

        renderEmployees(employees);

    } catch (error) {
        console.error("Loading error:", error);

        employeeTableBody.innerHTML =
            '<tr><td colspan="10">Unable to load employees. Please check the server.</td></tr>';
    }
}

// Search employees
function filterEmployees() {
    if (!searchInput) return;

    const query = searchInput.value.trim().toLowerCase();

    const filteredEmployees = employees.filter((employee) => {
        return [
            getEmployeeId(employee),
            getEmployeeName(employee),
            getEmployeeEmail(employee),
            getEmployeeDepartment(employee)
        ].some((value) =>
            String(value).toLowerCase().includes(query)
        );
    });

    renderEmployees(filteredEmployees);
}

if (searchInput) {
    searchInput.addEventListener("input", filterEmployees);
}

// Open Add Employee form
if (addEmployeeBtn && addEmployeeForm) {
    addEmployeeBtn.addEventListener("click", () => {
        addEmployeeForm.hidden = false;

        if (employeeForm) {
            employeeForm.reset();
        }

        if (formMessage) {
            formMessage.textContent = "";
        }

        document.getElementById("employeeName")?.focus();
    });
}

// Close Add Employee form
if (cancelEmployeeBtn && addEmployeeForm) {
    cancelEmployeeBtn.addEventListener("click", () => {
        addEmployeeForm.hidden = true;

        if (employeeForm) {
            employeeForm.reset();
        }

        if (formMessage) {
            formMessage.textContent = "";
        }
    });
}

// Add a new employee
if (employeeForm) {
    employeeForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const employee = {
            name: document.getElementById("employeeName")?.value.trim(),
            email: document.getElementById("employeeEmail")?.value.trim(),
            department: document.getElementById("employeeDepartment")?.value.trim()
        };

        if (formMessage) {
            formMessage.textContent = "Saving employee...";
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(employee)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.detail || "Could not add employee."
                );
            }

            employeeForm.reset();

            if (addEmployeeForm) {
                addEmployeeForm.hidden = true;
            }

            if (formMessage) {
                formMessage.textContent = "";
            }

            await loadEmployees();

            alert("Employee added successfully!");

        } catch (error) {
            console.error("Add employee error:", error);

            if (formMessage) {
                formMessage.textContent = error.message;
            }
        }
    });
}

// Dark / Light mode
function updateThemeButton() {
    if (!themeToggleBtn) return;

    const isDarkMode =
        document.body.classList.contains("dark-mode");

    themeToggleBtn.textContent = isDarkMode
        ? "☀️ Light mode"
        : "🌙 Dark mode";
}

// Apply saved theme
const savedTheme = localStorage.getItem("employeeHubTheme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
} else {
    document.body.classList.remove("dark-mode");
}

updateThemeButton();

// Toggle theme
if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        const isDarkMode =
            document.body.classList.contains("dark-mode");

        localStorage.setItem(
            "employeeHubTheme",
            isDarkMode ? "dark" : "light"
        );

        updateThemeButton();
    });
}

// Start the dashboard
loadEmployees();