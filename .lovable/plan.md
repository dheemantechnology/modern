# Plan: Payments Move, Accounting Module, HRM Module

This is a large, multi-part build. I'll execute it in 4 phases. Database migrations are batched into a small number of migrations to keep things reviewable.

---

## Phase 1 — Payments into Operations + Refund Cap

**Navigation / routing**
- Move `/admin/payments` under the **Rental Operations** group in the admin sidebar (keep route working via redirect, or move file to `admin.operations.payments.tsx`).
- Make sure the Payments page reads/writes the same `payments` table used by bookings/invoices (it already does — verify Booking Profile dialog + Customer profile payment rows stay in sync).

**Refund cap**
- In the refund dialog (admin payments page + Booking Profile dialog), enforce: `refund_amount ≤ payment.amount − already_refunded`.
- Client-side: input `max` + zod validation + inline error.
- Server-side guard: a Postgres trigger `validate_refund_amount` on `payments` BEFORE INSERT/UPDATE that throws if `refund_amount > amount` (for refund rows) or if a partial refund exceeds remaining balance.

---

## Phase 2 — Accounting Module

**New tables (1 migration, with GRANTs + RLS to staff/admin):**
- `accounts` — chart of accounts: `code, name, type (asset|liability|equity|income|expense), parent_id, is_active, currency`.
- `journal_entries` — `entry_no, date, memo, source_type (manual|payment|refund|invoice|expense|payroll), source_id, status (draft|posted), created_by`.
- `journal_lines` — `entry_id, account_id, debit, credit, description` (CHECK debit ≥ 0 AND credit ≥ 0 AND not both > 0).
- `expense_categories` — name, default_account_id.
- `expenses` — date, category_id, vendor, amount, payment_account_id, memo, attachment_url, status, journal_entry_id.
- Trigger: posting a payment/refund/invoice/expense/payroll auto-creates the journal entry (double-entry).

**Seed data (via supabase--insert after migration):**
- Full Chart of Accounts tailored to a car-rental business (Cash, Bank-Zaad, Bank-EVC, Bank-USD, A/R, Prepaid Insurance, Fleet Vehicles, Accumulated Depreciation, A/P, VAT Payable, Salaries Payable, Loans Payable, Owner's Equity, Retained Earnings, Rental Revenue, Late Fee Revenue, Damage Recovery, Fuel Expense, Maintenance, Insurance Expense, Salaries, Allowances, Marketing, Rent, Utilities, Depreciation Expense, Bank Charges, Refunds Issued, etc.).
- Expense categories matching the expense accounts.
- ~4 months of sample journal entries (rentals, expenses, payroll runs, refunds) so reports look real.

**Admin pages (new routes under `/admin/accounting/...`):**
- `chart-of-accounts.tsx` — tree view + add/edit/disable.
- `journal.tsx` — list + filters + create manual entry (balanced-entry validator).
- `expenses.tsx` — CRUD with category + payment account; posts journal on save.
- `reports.tsx` — Trial Balance, P&L, Balance Sheet, Cash Flow (simple), Revenue by Vehicle/Customer, Expense by Category. Date-range filters, print-friendly.

**Auto-journal wiring:**
- Payment received → DR Cash/Bank, CR A/R (or Rental Revenue if no invoice).
- Refund → DR Refunds Issued, CR Cash/Bank.
- Invoice issued → DR A/R, CR Rental Revenue (+ VAT split if applicable).
- Expense paid → DR Expense, CR Cash/Bank.
- Payroll posted → DR Salaries + Allowances, CR Cash/Bank + Deductions Payable + Loan Receivable.

---

## Phase 3 — HRM Module

**New tables (1 migration):**
- `departments` — name, code, manager_id, description.
- `employees` — full_name, employee_no, department_id, position, hire_date, status, email, phone, national_id, dob, address, photo_url, base_salary, bank_account, currency, user_id (nullable link to auth).
- `employee_allowances` — employee_id, name, amount, recurring (bool).
- `employee_deductions` — employee_id, name, amount, recurring.
- `payroll_runs` — period_month, period_year, status (draft|posted), posted_at, journal_entry_id, total_gross, total_net.
- `payroll_items` — run_id, employee_id, base, allowances_total, deductions_total, loan_repayment, advance_repayment, gross, net.
- `leaves` — employee_id, type (annual|sick|unpaid|other), start_date, end_date, days, status (pending|approved|rejected), reason, approver_id.
- `advances` — employee_id, amount, date, reason, status, repayment_status, journal_entry_id.
- `loans` — employee_id, principal, monthly_installment, start_date, balance, status, journal_entry_id.

**Admin pages under `/admin/hr/...`:**
- `departments.tsx` — CRUD with employee count.
- `employees.tsx` + `employees.$id.tsx` (profile with allowances, deductions, leaves, advances, loans, payroll history).
- `payroll.tsx` — create payroll run for a month → auto-computes per employee (base + allowances − deductions − loan installment − advance repayment) → post → creates journal entry.
- `leaves.tsx` — request + approve workflow.
- `advances.tsx`, `loans.tsx` — CRUD with auto-journal.

Modern card-based forms with clear sections and sensible defaults.

---

## Phase 4 — Integration polish

- Sidebar: new groups **Accounting** and **HR**, Payments moved into **Operations**.
- Dashboard tiles: add Today's Cash, MTD Revenue, MTD Expenses, Net P&L.
- Customer/Vehicle profiles: leave as-is (already wired).

---

## Notes
- I'll execute migrations one at a time (Accounting first, then HRM) and request your approval on each before writing the code that depends on it. The seed data runs after the Accounting migration is approved.
- All new tables are staff-only (admin/manager write, staff read), matching existing patterns.
- This will be a large set of files but I'll keep each route focused and reuse existing UI primitives.
