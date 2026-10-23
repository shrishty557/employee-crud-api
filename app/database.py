import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    server = os.getenv("DB_SERVER", r"localhost\SQLEXPRESS")
    database = os.getenv("DB_NAME", "EmployeeApiDB")
    driver = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")
    trusted = os.getenv("DB_TRUSTED_CONNECTION", "yes").strip().lower() in {"yes", "true", "1"}

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server}",
        f"DATABASE={database}",
        "Encrypt=no",
        "TrustServerCertificate=yes",
    ]
    if trusted:
        parts.append("Trusted_Connection=yes")
    else:
        parts.append(f"UID={os.getenv('DB_USERNAME', '')}")
        parts.append(f"PWD={os.getenv('DB_PASSWORD', '')}")

    return pyodbc.connect(";".join(parts) + ";", timeout=5)
