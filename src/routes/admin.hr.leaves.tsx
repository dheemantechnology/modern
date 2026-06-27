import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HrCrudPage } from "@/lib/hr-crud";
import { Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/hr/leaves")({ component: LeavesPage });

function LeavesPage() {
  const { data: emps = [] } = useQuery({
    queryKey: ["employees-min"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name").order("full_name")).data ?? [],
  });
  return (
    <HrCrudPage
      title="Leaves"
      subtitle="Approve and track employee time off"
      table="leaves"
      selectQuery="*, employees(full_name)"
      icon={CalendarOff}
      emptyBody="No leave requests yet."
      columns={[
        { header: "Employee", render: (r) => <span className="font-semibold">{r.employees?.full_name ?? "—"}</span> },
        { header: "Type", render: (r) => <span className="capitalize">{r.leave_type}</span> },
        { header: "Start", render: (r) => r.start_date },
        { header: "End", render: (r) => r.end_date },
        { header: "Days", render: (r) => Number(r.days || 0) },
        { header: "Status", render: (r) => <Pill tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "amber"}>{r.status}</Pill> },
      ]}
      fields={[
        { name: "employee_id", label: "Employee", type: "select", required: true, options: (emps as any[]).map((e) => ({ value: e.id, label: e.full_name })) },
        { name: "leave_type", label: "Type", type: "select", default: "annual", options: [
          { value: "annual", label: "Annual" },
          { value: "sick", label: "Sick" },
          { value: "unpaid", label: "Unpaid" },
          { value: "maternity", label: "Maternity" },
          { value: "other", label: "Other" },
        ]},
        { name: "start_date", label: "Start date", type: "date", required: true },
        { name: "end_date", label: "End date", type: "date", required: true },
        { name: "days", label: "Days", type: "number", default: 1 },
        { name: "status", label: "Status", type: "select", default: "pending", options: [
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "cancelled", label: "Cancelled" },
        ]},
        { name: "reason", label: "Reason", type: "textarea" },
      ]}
    />
  );
}