-- Migration 08: Human Resource Management Schema
-- Creates tables for Employees, Pay Heads, Salary Structures, Salary Sheets, Attendance, Leaves, and Loans

-- 1. Employees Table
CREATE TABLE IF NOT EXISTS hr_employees (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    cnic VARCHAR(50),
    gender VARCHAR(20) DEFAULT 'Male',
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    department_name VARCHAR(100) DEFAULT 'Operations',
    designation_name VARCHAR(100) DEFAULT 'Staff',
    grade VARCHAR(50) DEFAULT 'G-3',
    employment_type VARCHAR(50) DEFAULT 'Permanent',
    status VARCHAR(50) DEFAULT 'Active',
    joining_date DATE DEFAULT CURRENT_DATE,
    confirmation_date DATE,
    exit_date DATE,
    exit_reason TEXT,
    basic_salary NUMERIC(15, 2) DEFAULT 0,
    gross NUMERIC(15, 2) DEFAULT 0,
    net NUMERIC(15, 2) DEFAULT 0,
    loan_balance NUMERIC(15, 2) DEFAULT 0,
    bank_name VARCHAR(100),
    bank_account VARCHAR(100),
    weekly_off VARCHAR(50) DEFAULT 'Sunday',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pay Heads Table (Earnings & Deductions)
CREATE TABLE IF NOT EXISTS hr_pay_heads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    kind VARCHAR(50) NOT NULL, -- 'Earning' or 'Deduction'
    basis VARCHAR(50) DEFAULT 'Fixed', -- 'Fixed', 'Basic %', 'Gross %'
    rate NUMERIC(10, 2) DEFAULT 0,
    amount NUMERIC(15, 2) DEFAULT 0,
    account_id VARCHAR(50),
    account_name VARCHAR(255),
    auto BOOLEAN DEFAULT TRUE,
    rule VARCHAR(100) DEFAULT '',
    taxable BOOLEAN DEFAULT FALSE,
    sequence INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Salary Structures Table
CREATE TABLE IF NOT EXISTS hr_salary_structures (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES hr_employees(id) ON DELETE CASCADE,
    head_id INT REFERENCES hr_pay_heads(id) ON DELETE CASCADE,
    rate NUMERIC(10, 2) DEFAULT 0,
    amount NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS hr_attendance (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES hr_employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'Present', 'Absent', 'Half Day', 'Leave', 'Off', 'Holiday', 'On Duty'
    late_minutes INT DEFAULT 0,
    overtime_hours NUMERIC(5, 2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- 5. Leaves Table
CREATE TABLE IF NOT EXISTS hr_leave_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    days_per_year INT DEFAULT 10,
    carry_forward INT DEFAULT 0,
    paid BOOLEAN DEFAULT TRUE,
    requires_proof BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS hr_leave_applications (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES hr_employees(id) ON DELETE CASCADE,
    leave_type_id INT REFERENCES hr_leave_types(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days NUMERIC(4, 1) DEFAULT 1,
    half_day BOOLEAN DEFAULT FALSE,
    reason TEXT NOT NULL,
    address_on_leave TEXT,
    status VARCHAR(50) DEFAULT 'Applied', -- 'Applied', 'Approved', 'Rejected', 'Cancelled'
    approved_by VARCHAR(100),
    applied_on DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Loans & Advances Table
CREATE TABLE IF NOT EXISTS hr_loans (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES hr_employees(id) ON DELETE CASCADE,
    kind VARCHAR(50) DEFAULT 'Loan', -- 'Loan' or 'Advance Salary'
    purpose TEXT,
    sanctioned_on DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(15, 2) NOT NULL,
    installments INT DEFAULT 1,
    installment_amount NUMERIC(15, 2) NOT NULL,
    start_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    recovered_amount NUMERIC(15, 2) DEFAULT 0,
    balance_amount NUMERIC(15, 2) NOT NULL,
    account_id VARCHAR(50),
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Closed', 'Cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Monthly Salary Sheets (Payroll)
CREATE TABLE IF NOT EXISTS hr_salary_sheets (
    id SERIAL PRIMARY KEY,
    month VARCHAR(7) NOT NULL UNIQUE, -- 'YYYY-MM'
    total_basic NUMERIC(15, 2) DEFAULT 0,
    total_gross NUMERIC(15, 2) DEFAULT 0,
    total_net NUMERIC(15, 2) DEFAULT 0,
    total_deductions NUMERIC(15, 2) DEFAULT 0,
    total_loans NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Approved', 'Paid'
    approved_by VARCHAR(100),
    paid_date DATE,
    paid_through VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_pay_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_salary_sheets ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for authenticated / service role
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access to hr_employees" ON hr_employees;
    CREATE POLICY "Public access to hr_employees" ON hr_employees FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_pay_heads" ON hr_pay_heads;
    CREATE POLICY "Public access to hr_pay_heads" ON hr_pay_heads FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_salary_structures" ON hr_salary_structures;
    CREATE POLICY "Public access to hr_salary_structures" ON hr_salary_structures FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_attendance" ON hr_attendance;
    CREATE POLICY "Public access to hr_attendance" ON hr_attendance FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_leave_types" ON hr_leave_types;
    CREATE POLICY "Public access to hr_leave_types" ON hr_leave_types FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_leave_applications" ON hr_leave_applications;
    CREATE POLICY "Public access to hr_leave_applications" ON hr_leave_applications FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_loans" ON hr_loans;
    CREATE POLICY "Public access to hr_loans" ON hr_loans FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Public access to hr_salary_sheets" ON hr_salary_sheets;
    CREATE POLICY "Public access to hr_salary_sheets" ON hr_salary_sheets FOR ALL USING (true) WITH CHECK (true);
END $$;
