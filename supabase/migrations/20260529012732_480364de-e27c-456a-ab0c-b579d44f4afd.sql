
REVOKE ALL ON FUNCTION public.post_journal(date, text, public.journal_source, uuid, text, text, numeric) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_payment_journal() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_expense_journal() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_refund_amount() FROM public, anon, authenticated;
