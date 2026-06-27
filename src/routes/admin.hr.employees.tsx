import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HrCrudPage } from "@/lib/hr-crud";
import { Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/hr/employees")({ component: EmployeesPage });

function EmployeesPage() {
  const { data: depts = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => (await supabase.from("departments").select("id, name").order("name")).data ?? [],
  });
  return (
    <HrCrudPage
      title="Employees"
      subtitle="Staff directory"
      table="employees"
      selectQuery="*, departments(name)"
      icon={UsersRound}
      emptyBody="Add your first employee."
      columns={[
        { header: "Emp #", render: (r) => <span className="font-mono text-xs">{r.employee_no}</span> },
        { header: "Name", render: (r) => <span className="font-semibold">{r.full_name}</span> },
        { header: "Department", render: (r) => r.departments?.name ?? "—" },
        { header: "Position", render: (r) => r.position ?? "—" },
        { header: "Salary", render: (r) => `$${Number(r.base_salary || 0).toFixed(2)}` },
        { header: "Status", render: (r) => <Pill tone={r.status === "active" ? "green" : "amber"}>{r.status}</Pill> },
      ]}
      fields={[
        { name: "full_name", label: "Full name", required: true },
        { name: "department_id", label: "Department", type: "select", options: (depts as any[]).map((d) => ({ value: d.id, label: d.name })) },
        { name: "position", label: "Position" },
        { name: "hire_date", label: "Hire date", type: "date" },
        { name: "base_salary", label: "Base salary", type: "number", default: 0 },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "national_id", label: "National ID" },
        { name: "address", label: "Address", type: "textarea" },
        { name: "status", label: "Status", type: "select", default: "active", options: [
          { value: "active", label: "Active" },
          { value: "on_leave", label: "On leave" },
          { value: "suspended", label: "Suspended" },
          { value: "terminated", label: "Terminated" },
        ] },
      ]}
    />
  );
}