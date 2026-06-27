
-- ============== PHASE 1: Refund cap trigger ==============
CREATE OR REPLACE FUNCTION public.validate_refund_amount()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  parent_amount numeric;
  already_refunded numeric;
BEGIN
  -- Refund row (child)
  IF NEW.parent_payment_id IS NOT NULL THEN
    SELECT amount INTO parent_amount FROM public.payments WHERE id = NEW.parent_payment_id;
    SELECT COALESCE(SUM(amount),0) INTO already_refunded
      FROM public.payments
      WHERE parent_payment_id = NEW.parent_payment_id
        AND (TG_OP = 'INSERT' OR id <> NEW.id);
    IF parent_amount IS NULL THEN RAISE EXCEPTION 'Parent payment not found'; END IF;
    IF (already_refunded + NEW.amount) > parent_amount THEN
      RAISE EXCEPTION 'Refund (%) exceeds remaining refundable (%) for payment %',
        NEW.amount, parent_amount - already_refunded, NEW.parent_payment_id;
    END IF;
  END IF;
  -- Same row partial refund
  IF NEW.refund_amount IS NOT NULL AND NEW.refund_amount > NEW.amount THEN
    RAISE EXCEPTION 'Refund amount (%) cannot exceed paid amount (%)', NEW.refund_amount, NEW.amount;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_refund_amount ON public.payments;
CREATE TRIGGER trg_validate_refund_amount
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.validate_refund_amount();

-- ============== PHASE 2: ACCOUNTING MODULE ==============

CREATE TYPE public.account_type AS ENUM ('asset','liability','equity','income','expense');
CREATE TYPE public.journal_status AS ENUM ('draft','posted','void');
CREATE TYPE public.journal_source AS ENUM ('manual','payment','refund','invoice','expense','payroll','advance','loan');

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type public.account_type NOT NULL,
  parent_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts staff read" ON public.accounts FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "accounts staff write" ON public.accounts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no text NOT NULL UNIQUE DEFAULT ('JE-'||to_char(now(),'YYYYMM')||'-'||upper(substr(gen_random_uuid()::text,1,6))),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  memo text,
  source_type public.journal_source NOT NULL DEFAULT 'manual',
  source_id uuid,
  status public.journal_status NOT NULL DEFAULT 'posted',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "je staff read" ON public.journal_entries FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "je staff write" ON public.journal_entries FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_nonneg CHECK (debit >= 0 AND credit >= 0),
  CONSTRAINT chk_one_side CHECK (NOT (debit > 0 AND credit > 0))
);
CREATE INDEX idx_jl_entry ON public.journal_lines(entry_id);
CREATE INDEX idx_jl_account ON public.journal_lines(account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jl staff read" ON public.journal_lines FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "jl staff write" ON public.journal_lines FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  default_account_id uuid REFERENCES public.accounts(id),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT ALL ON public.expense_categories TO service_role;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ec staff read" ON public.expense_categories FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "ec staff write" ON public.expense_categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('EXP-'||to_char(now(),'YYYYMM')||'-'||upper(substr(gen_random_uuid()::text,1,5))),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  category_id uuid REFERENCES public.expense_categories(id),
  vendor text,
  amount numeric NOT NULL,
  payment_account_id uuid REFERENCES public.accounts(id),
  memo text,
  attachment_url text,
  status text NOT NULL DEFAULT 'paid',
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp staff read" ON public.expenses FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "exp staff write" ON public.expenses FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== PHASE 3: HRM MODULE ==============

CREATE TYPE public.employee_status AS ENUM ('active','on_leave','terminated','suspended');
CREATE TYPE public.leave_type AS ENUM ('annual','sick','unpaid','maternity','other');
CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE public.payroll_status AS ENUM ('draft','posted','cancelled');
CREATE TYPE public.advance_status AS ENUM ('pending','approved','repaid','rejected');
CREATE TYPE public.loan_status AS ENUM ('active','paid','defaulted','cancelled');

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  description text,
  manager_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dept staff read" ON public.departments FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "dept staff write" ON public.departments FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_dept_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no text NOT NULL UNIQUE DEFAULT ('EMP-'||upper(substr(gen_random_uuid()::text,1,6))),
  full_name text NOT NULL,
  department_id uuid REFERENCES public.departments(id),
  position text,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  status public.employee_status NOT NULL DEFAULT 'active',
  email text,
  phone text,
  national_id text,
  date_of_birth date,
  address text,
  city text,
  photo_url text,
  base_salary numeric NOT NULL DEFAULT 0,
  bank_account text,
  currency text NOT NULL DEFAULT 'USD',
  user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emp staff read" ON public.employees FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "emp staff write" ON public.employees FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_emp_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.employee_allowances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_allowances TO authenticated;
GRANT ALL ON public.employee_allowances TO service_role;
ALTER TABLE public.employee_allowances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ea staff read" ON public.employee_allowances FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "ea staff write" ON public.employee_allowances FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.employee_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_deductions TO authenticated;
GRANT ALL ON public.employee_deductions TO service_role;
ALTER TABLE public.employee_deductions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ed staff read" ON public.employee_deductions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "ed staff write" ON public.employee_deductions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('PR-'||to_char(now(),'YYYYMM')||'-'||upper(substr(gen_random_uuid()::text,1,4))),
  period_month int NOT NULL,
  period_year int NOT NULL,
  status public.payroll_status NOT NULL DEFAULT 'draft',
  posted_at timestamptz,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  total_gross numeric NOT NULL DEFAULT 0,
  total_net numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(period_month, period_year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr staff read" ON public.payroll_runs FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "pr staff write" ON public.payroll_runs FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_pr_updated BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.payroll_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id),
  base numeric NOT NULL DEFAULT 0,
  allowances_total numeric NOT NULL DEFAULT 0,
  deductions_total numeric NOT NULL DEFAULT 0,
  loan_repayment numeric NOT NULL DEFAULT 0,
  advance_repayment numeric NOT NULL DEFAULT 0,
  gross numeric NOT NULL DEFAULT 0,
  net numeric NOT NULL DEFAULT 0,
  notes text,
  UNIQUE(run_id, employee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payroll_items TO authenticated;
GRANT ALL ON public.payroll_items TO service_role;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi staff read" ON public.payroll_items FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "pi staff write" ON public.payroll_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));

CREATE TABLE public.leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type public.leave_type NOT NULL DEFAULT 'annual',
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric NOT NULL DEFAULT 1,
  reason text,
  status public.leave_status NOT NULL DEFAULT 'pending',
  approver_id uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaves TO authenticated;
GRANT ALL ON public.leaves TO service_role;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lv staff read" ON public.leaves FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "lv staff write" ON public.leaves FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_lv_updated BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('ADV-'||upper(substr(gen_random_uuid()::text,1,6))),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  status public.advance_status NOT NULL DEFAULT 'pending',
  repaid_amount numeric NOT NULL DEFAULT 0,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advances TO authenticated;
GRANT ALL ON public.advances TO service_role;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adv staff read" ON public.advances FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "adv staff write" ON public.advances FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_adv_updated BEFORE UPDATE ON public.advances FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('LN-'||upper(substr(gen_random_uuid()::text,1,6))),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  principal numeric NOT NULL,
  monthly_installment numeric NOT NULL,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  balance numeric NOT NULL,
  status public.loan_status NOT NULL DEFAULT 'active',
  reason text,
  journal_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ln staff read" ON public.loans FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "ln staff write" ON public.loans FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'))
  WITH CHECK (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'manager'));
CREATE TRIGGER tg_ln_updated BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== AUTO-JOURNAL HELPER ==============
CREATE OR REPLACE FUNCTION public.post_journal(
  _date date, _memo text, _source public.journal_source, _source_id uuid,
  _debit_account text, _credit_account text, _amount numeric
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _entry_id uuid;
  _da uuid;
  _ca uuid;
BEGIN
  SELECT id INTO _da FROM public.accounts WHERE code = _debit_account;
  SELECT id INTO _ca FROM public.accounts WHERE code = _credit_account;
  IF _da IS NULL OR _ca IS NULL THEN
    RAISE NOTICE 'Skipping journal: missing account (% / %)', _debit_account, _credit_account;
    RETURN NULL;
  END IF;
  INSERT INTO public.journal_entries(entry_date, memo, source_type, source_id, status)
    VALUES (_date, _memo, _source, _source_id, 'posted')
    RETURNING id INTO _entry_id;
  INSERT INTO public.journal_lines(entry_id, account_id, debit, credit, description)
    VALUES (_entry_id, _da, _amount, 0, _memo),
           (_entry_id, _ca, 0, _amount, _memo);
  RETURN _entry_id;
END $$;

-- Auto-journal on payment
CREATE OR REPLACE FUNCTION public.on_payment_journal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _cash_code text;
BEGIN
  IF NEW.status::text <> 'paid' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status::text = 'paid' THEN RETURN NEW; END IF;

  _cash_code := CASE lower(coalesce(NEW.method,''))
    WHEN 'zaad' THEN '1020'
    WHEN 'evc' THEN '1021'
    WHEN 'edahab' THEN '1022'
    WHEN 'cash' THEN '1010'
    WHEN 'bank' THEN '1030'
    ELSE '1010'
  END;

  IF NEW.parent_payment_id IS NOT NULL THEN
    PERFORM public.post_journal(COALESCE(NEW.paid_at::date, CURRENT_DATE),
      'Refund payment '||NEW.id, 'refund', NEW.id, '5900', _cash_code, NEW.amount);
  ELSE
    PERFORM public.post_journal(COALESCE(NEW.paid_at::date, CURRENT_DATE),
      'Payment received '||NEW.id, 'payment', NEW.id, _cash_code, '4000', NEW.amount);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_payment_journal ON public.payments;
CREATE TRIGGER trg_payment_journal AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.on_payment_journal();

-- Auto-journal on expense
CREATE OR REPLACE FUNCTION public.on_expense_journal()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _da uuid; _ca uuid; _entry uuid;
BEGIN
  IF NEW.journal_entry_id IS NOT NULL THEN RETURN NEW; END IF;
  SELECT default_account_id INTO _da FROM public.expense_categories WHERE id = NEW.category_id;
  _ca := NEW.payment_account_id;
  IF _da IS NULL OR _ca IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.journal_entries(entry_date, memo, source_type, source_id, status)
    VALUES (NEW.expense_date, COALESCE(NEW.memo, 'Expense '||NEW.reference), 'expense', NEW.id, 'posted')
    RETURNING id INTO _entry;
  INSERT INTO public.journal_lines(entry_id, account_id, debit, credit, description)
    VALUES (_entry, _da, NEW.amount, 0, NEW.vendor),
           (_entry, _ca, 0, NEW.amount, NEW.vendor);
  NEW.journal_entry_id := _entry;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_expense_journal ON public.expenses;
CREATE TRIGGER trg_expense_journal BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.on_expense_journal();
