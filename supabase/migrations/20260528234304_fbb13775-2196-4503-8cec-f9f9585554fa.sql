
REVOKE ALL ON FUNCTION public.link_customer_history(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_customer_inserted_link_history() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_customer_ltv(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_payment_change_recompute_ltv() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_customer_history(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.recompute_customer_ltv(uuid) TO service_role;
