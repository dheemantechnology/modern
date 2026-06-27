
REVOKE ALL ON FUNCTION public.apply_payroll_loan_repayments() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_journal_balanced() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_leave_dates() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_advance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_loan() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_posted_payroll() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_payroll_totals() FROM PUBLIC, anon, authenticated;
