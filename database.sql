/* Run this script in SQL Server Management Studio (SSMS). */
IF DB_ID(N'EmployeeApiDB') IS NULL
BEGIN
    CREATE DATABASE EmployeeApiDB;
END;
GO

USE EmployeeApiDB;
GO

IF OBJECT_ID(N'dbo.Employees', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employees
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        department NVARCHAR(100) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Employees)
BEGIN
    INSERT INTO dbo.Employees (name, email, department)
    VALUES
      (N'Aarav Sharma', N'aarav@example.com', N'IT'),
      (N'Meera Verma', N'meera@example.com', N'HR');
END;
GO

SELECT id, name, email, department, created_at
FROM dbo.Employees
ORDER BY id;
GO
