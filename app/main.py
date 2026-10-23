from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import pyodbc
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.database import get_connection

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    department: str = Field(min_length=1, max_length=100)


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[str] = Field(default=None, min_length=3, max_length=255)
    department: Optional[str] = Field(default=None, min_length=1, max_length=100)


def row_to_dict(row):
    return {
        "id": row[0],
        "name": row[1],
        "email": row[2],
        "department": row[3],
        "created_at": row[4].isoformat() if row[4] else None,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Employee Management API", version="1.0.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/api/health")
def health_check():
    try:
        with get_connection() as connection:
            connection.cursor().execute("SELECT 1")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {exc}")


@app.get("/api/employees")
def get_employees():
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT id, name, email, department, created_at FROM dbo.Employees ORDER BY id")
            return [row_to_dict(row) for row in cursor.fetchall()]
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: int):
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "SELECT id, name, email, department, created_at FROM dbo.Employees WHERE id = ?",
                employee_id,
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Employee not found")
            return row_to_dict(row)
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.post("/api/employees", status_code=status.HTTP_201_CREATED)
def create_employee(employee: EmployeeCreate):
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "INSERT INTO dbo.Employees (name, email, department) "
                "OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.department, INSERTED.created_at "
                "VALUES (?, ?, ?)",
                employee.name.strip(), employee.email.strip(), employee.department.strip(),
            )
            row = cursor.fetchone()
            connection.commit()
            return row_to_dict(row)
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=409, detail="That email address is already in use")
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.put("/api/employees/{employee_id}")
def replace_employee(employee_id: int, employee: EmployeeCreate):
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(
                "UPDATE dbo.Employees SET name = ?, email = ?, department = ? WHERE id = ?",
                employee.name.strip(), employee.email.strip(), employee.department.strip(), employee_id,
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Employee not found")
            connection.commit()
            cursor.execute(
                "SELECT id, name, email, department, created_at FROM dbo.Employees WHERE id = ?",
                employee_id,
            )
            return row_to_dict(cursor.fetchone())
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=409, detail="That email address is already in use")
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.patch("/api/employees/{employee_id}")
def partially_update_employee(employee_id: int, employee: EmployeeUpdate):
    fields = employee.model_dump(exclude_unset=True, exclude_none=True)
    if not fields:
        raise HTTPException(status_code=400, detail="Send at least one field to update")
    allowed = {"name", "email", "department"}
    if any(key not in allowed for key in fields):
        raise HTTPException(status_code=400, detail="Invalid field")
    assignments = ", ".join(f"{key} = ?" for key in fields)
    values = [value.strip() for value in fields.values()]
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute(f"UPDATE dbo.Employees SET {assignments} WHERE id = ?", *values, employee_id)
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Employee not found")
            connection.commit()
            cursor.execute(
                "SELECT id, name, email, department, created_at FROM dbo.Employees WHERE id = ?",
                employee_id,
            )
            return row_to_dict(cursor.fetchone())
    except pyodbc.IntegrityError:
        raise HTTPException(status_code=409, detail="That email address is already in use")
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int):
    try:
        with get_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("DELETE FROM dbo.Employees WHERE id = ?", employee_id)
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Employee not found")
            connection.commit()
        return {"message": f"Employee {employee_id} deleted successfully"}
    except pyodbc.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}")


@app.get("/")
def home():
    return FileResponse(STATIC_DIR / "index.html")
