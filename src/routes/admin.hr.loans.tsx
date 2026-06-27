import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HrCrudPage } from "@/lib/hr-crud";
import { Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/hr/loans")({ component: LoansPage });

function LoansPage() {
  const { data: emps = [] } = useQuery({
    queryKey: ["employees-min"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name").order("full_name")).data ?? [],
  });
  return (
    <HrCrudPage
      title="Loans"
      subtitle="Long-term staff loans with monthly repayments"
      table="loans"
      selectQuery="*, employees(full_name)"
      icon={Landmark}
      emptyBody="No loans issued yet."
      columns={[
        { header: "Ref", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
        { header: "Employee", render: (r) => <span className="font-semibold">{r.employees?.full_name ?? "—"}</span> },
        { header: "Start", render: (r) => r.start_date },
        { header: "Principal", render: (r) => `$${Number(r.principal || 0).toFixed(2)}` },
        { header: "Balance", render: (r) => `$${Number(r.balance || 0).toFixed(2)}` },
        { header: "Monthly", render: (r) => `$${Number(r.monthly_installment || 0).toFixed(2)}` },
        { header: "Status", render: (r) => <Pill tone={r.status === "paid" ? "green" : r.status === "defaulted" ? "red" : "amber"}>{r.status}</Pill> },
      ]}
      fields={[
        { name: "employee_id", label: "Employee", type: "select", required: true, options: (emps as any[]).map((e) => ({ value: e.id, label: e.full_name })) },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "principal", label: "Principal", type: "number", required: true },
        { name: "balance", label: "Outstanding balance", type: "number", required: true },
        { name: "monthly_installment", label: "Monthly installment", type: "number", required: true },
        { name: "status", label: "Status", type: "select", default: "active", options: [
          { value: "active", label: "Active" },
          { value: "paid", label: "Paid off" },
          { value: "defaulted", label: "Defaulted" },
          { value: "cancelled", label: "Cancelled" },
        ]},
        { name: "reason", label: "Purpose / notes", type: "textarea" },
      ]}
    />
  );
}