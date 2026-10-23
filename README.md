# Employee Management CRUD API (beginner starter)

This demo connects a simple HTML/CSS/JavaScript frontend to a Python FastAPI backend and Microsoft SQL Server.

## Files
- `database.sql` — creates `EmployeeApiDB`, `dbo.Employees`, and two sample records.
- `app/main.py` — API endpoints.
- `app/database.py` — SQL Server connection.
- `static/` — frontend files.
- `.env.example` — sample connection settings. Copy this to `.env` and update `DB_SERVER` / `DB_DRIVER` if needed.

## Setup
1. Open SSMS and connect to your SQL Server instance.
2. Open `database.sql` in SSMS and click **Execute**. Confirm that two sample employees appear.
3. Install Python 3.10+ and Microsoft ODBC Driver for SQL Server (ODBC Driver 18 or 17).
4. Open this project folder in VS Code.
5. In the VS Code terminal, run:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

6. Open `.env`. Set `DB_SERVER` to the exact server name shown in SSMS. If your driver is version 17, change `DB_DRIVER` to `ODBC Driver 17 for SQL Server`.
7. Start the API from the project root:

   ```powershell
   python -m uvicorn app.main:app --reload
   ```

8. Open `http://127.0.0.1:8000` for the frontend, or `http://127.0.0.1:8000/docs` to test the API.

## Endpoints
- `GET /api/health` — checks API and database connection.
- `GET /api/employees` — list all employees.
- `GET /api/employees/{id}` — get one employee.
- `POST /api/employees` — create an employee.
- `PUT /api/employees/{id}` — replace employee details.
- `PATCH /api/employees/{id}` — update selected fields.
- `DELETE /api/employees/{id}` — delete an employee.

## Verify that the database changes
After adding, editing, or deleting through the frontend, run this in SSMS:

```sql
USE EmployeeApiDB;
SELECT id, name, email, department, created_at
FROM dbo.Employees
ORDER BY id;
```

Refresh the query to see the current database records.

## Common problems
- **Cannot open database / server not found:** verify the `DB_SERVER` value in `.env` against the server name in SSMS.
- **ODBC driver not found:** install Microsoft ODBC Driver 18 for SQL Server, or change `DB_DRIVER` to the installed driver name.
- **PowerShell won't activate the venv:** run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. Alternatively use `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` and `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload` without activation.
- **Port 8000 is busy:** run `python -m uvicorn app.main:app --reload --port 8001` and open port 8001 in the browser.

This is a learning/demo project. Don't put real employee or confidential company data into it without your senior's approval and appropriate authentication/security.
