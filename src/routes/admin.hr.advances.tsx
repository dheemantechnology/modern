import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HrCrudPage } from "@/lib/hr-crud";
import { Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/hr/advances")({ component: AdvancesPage });

function AdvancesPage() {
  const { data: emps = [] } = useQuery({
    queryKey: ["employees-min"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name").order("full_name")).data ?? [],
  });
  return (
    <HrCrudPage
      title="Advances"
      subtitle="Salary advances to staff"
      table="advances"
      selectQuery="*, employees(full_name)"
      icon={HandCoins}
      emptyBody="No advances issued yet."
      columns={[
        { header: "Ref", render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
        { header: "Employee", render: (r) => <span className="font-semibold">{r.employees?.full_name ?? "—"}</span> },
        { header: "Date", render: (r) => r.advance_date },
        { header: "Amount", render: (r) => `$${Number(r.amount || 0).toFixed(2)}` },
        { header: "Repaid", render: (r) => `$${Number(r.repaid_amount || 0).toFixed(2)}` },
        { header: "Status", render: (r) => <Pill tone={r.status === "repaid" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status}</Pill> },
      ]}
      fields={[
        { name: "employee_id", label: "Employee", type: "select", required: true, options: (emps as any[]).map((e) => ({ value: e.id, label: e.full_name })) },
        { name: "advance_date", label: "Date", type: "date" },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "repaid_amount", label: "Repaid amount", type: "number", default: 0 },
        { name: "status", label: "Status", type: "select", default: "pending", options: [
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "repaid", label: "Repaid" },
          { value: "rejected", label: "Rejected" },
        ]},
        { name: "reason", label: "Reason", type: "textarea" },
      ]}
    />
  );
}