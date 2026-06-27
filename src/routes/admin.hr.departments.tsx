import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { HrCrudPage } from "@/lib/hr-crud";

export const Route = createFileRoute("/admin/hr/departments")({ component: DepartmentsPage });

function DepartmentsPage() {
  return (
    <HrCrudPage
      title="Departments"
      subtitle="Organisational structure"
      table="departments"
      selectQuery="*"
      icon={Building2}
      emptyBody="Create your first department."
      columns={[
        { header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
        { header: "Name", render: (r) => <span className="font-semibold">{r.name}</span> },
        { header: "Description", render: (r) => <span className="text-xs text-muted-foreground">{r.description}</span> },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Name", required: true },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}