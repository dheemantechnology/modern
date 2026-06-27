
-- =============================================
-- Polish pass: integrity triggers + indexes
-- =============================================

-- 1. Leaves: end_date must be on or after start_date
CREATE OR REPLACE FUNCTION public.validate_leave_dates()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'Leave end date (%) cannot be before start date (%)', NEW.end_date, NEW.start_date;
  END IF;
  IF NEW.days IS NULL OR NEW.days <= 0 THEN
    NEW.days := GREATEST(1, (NEW.end_date - NEW.start_date) + 1);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_leave ON public.leaves;
CREATE TRIGGER trg_validate_leave BEFORE INSERT OR UPDATE ON public.leaves
  FOR EACH ROW EXECUTE FUNCTION public.validate_leave_dates();

-- 2. Advances: repaid_amount <= amount; auto-flag repaid
CREATE OR REPLACE FUNCTION public.validate_advance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Advance amount must be greater than zero';
  END IF;
  IF NEW.repaid_amount < 0 OR NEW.repaid_amount > NEW.amount THEN
    RAISE EXCEPTION 'Repaid amount (%) must be between 0 and advance amount (%)', NEW.repaid_amount, NEW.amount;
  END IF;
  IF NEW.repaid_amount = NEW.amount AND NEW.status <> 'rejected' THEN
    NEW.status := 'repaid';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_advance ON public.advances;
CREATE TRIGGER trg_validate_advance BEFORE INSERT OR UPDATE ON public.advances
  FOR EACH ROW EXECUTE FUNCTION public.validate_advance();

-- 3. Loans: balance constraints + auto status
CREATE OR REPLACE FUNCTION public.validate_loan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.principal <= 0 THEN
    RAISE EXCEPTION 'Loan principal must be greater than zero';
  END IF;
  IF NEW.balance < 0 OR NEW.balance > NEW.principal THEN
    RAISE EXCEPTION 'Loan balance (%) must be between 0 and principal (%)', NEW.balance, NEW.principal;
  END IF;
  IF NEW.monthly_installment <= 0 THEN
    RAISE EXCEPTION 'Monthly installment must be greater than zero';
  END IF;
  IF NEW.balance = 0 AND NEW.status = 'active' THEN
    NEW.status := 'paid';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_loan ON public.loans;
CREATE TRIGGER trg_validate_loan BEFORE INSERT OR UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.validate_loan();

-- 4. Journal entries must balance (sum debits = sum credits) — checked on COMMIT
CREATE OR REPLACE FUNCTION public.check_journal_balanced()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _entry uuid := COALESCE(NEW.entry_id, OLD.entry_id);
  _dr numeric;
  _cr numeric;
BEGIN
  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
    INTO _dr, _cr
    FROM public.journal_lines WHERE entry_id = _entry;
  IF _dr <> _cr THEN
    RAISE EXCEPTION 'Journal entry % is unbalanced: debits=% credits=%', _entry, _dr, _cr;
  END IF;
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_journal_balanced ON public.journal_lines;
CREATE CONSTRAINT TRIGGER trg_journal_balanced
  AFTER INSERT OR UPDATE OR DELETE ON public.journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_journal_balanced();

-- 5. Prevent deletion / structural changes of posted payroll runs
CREATE OR REPLACE FUNCTION public.protect_posted_payroll()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'posted' THEN
    RAISE EXCEPTION 'Cannot delete a posted payroll run (%). Cancel it first.', OLD.reference;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'posted'
     AND (NEW.total_gross <> OLD.total_gross OR NEW.total_net <> OLD.total_net) THEN
    RAISE EXCEPTION 'Cannot edit totals on posted payroll run %', OLD.reference;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_protect_payroll ON public.payroll_runs;
CREATE TRIGGER trg_protect_payroll BEFORE UPDATE OR DELETE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.protect_posted_payroll();

-- 6. When payroll is posted, decrement loan balances by loan_repayment amounts
CREATE OR REPLACE FUNCTION public.apply_payroll_loan_repayments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  IF NEW.status = 'posted' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    FOR r IN
      SELECT employee_id, SUM(loan_repayment) AS total
        FROM public.payroll_items
        WHERE run_id = NEW.id AND loan_repayment > 0
        GROUP BY employee_id
    LOOP
      UPDATE public.loans
        SET balance = GREATEST(0, balance - r.total)
        WHERE employee_id = r.employee_id AND status = 'active';
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_payroll_loan_repay ON public.payroll_runs;
CREATE TRIGGER trg_payroll_loan_repay AFTER UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.apply_payroll_loan_repayments();

-- 7. Auto-recompute payroll_runs totals when items change
CREATE OR REPLACE FUNCTION public.recompute_payroll_totals()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _run uuid := COALESCE(NEW.run_id, OLD.run_id);
BEGIN
  UPDATE public.payroll_runs SET
    total_gross = COALESCE((SELECT SUM(gross) FROM public.payroll_items WHERE run_id = _run), 0),
    total_net   = COALESCE((SELECT SUM(net)   FROM public.payroll_items WHERE run_id = _run), 0)
  WHERE id = _run AND status = 'draft';
  RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS trg_recompute_payroll ON public.payroll_items;
CREATE TRIGGER trg_recompute_payroll AFTER INSERT OR UPDATE OR DELETE ON public.payroll_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_payroll_totals();

-- =============================================
-- Performance indexes (idempotent)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fleet_unit ON public.bookings(fleet_unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_parent ON public.payments(parent_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit ON public.maintenance_records(fleet_unit_id);
CREATE INDEX IF NOT EXISTS idx_fleet_units_vehicle ON public.fleet_units(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_units_status ON public.fleet_units(status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON public.journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON public.payroll_items(run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON public.payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON public.employees(department_id);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_advances_employee ON public.advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_loans_employee ON public.loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_customer ON public.leads(customer_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON public.customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
