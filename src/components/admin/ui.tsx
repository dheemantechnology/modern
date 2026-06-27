import { ReactNode } from "react";

export function StatCard({ label, value, hint, icon: Icon, tone = "cyan" }: { label: string; value: ReactNode; hint?: string; icon: any; tone?: "cyan" | "emerald" | "amber" | "rose" }) {
  const toneMap = {
    cyan: "bg-cyan/10 text-cyan",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneMap[tone]}`}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "green" | "amber" | "red" | "cyan" | "blue" }) {
  const m = {
    muted: "bg-muted text-muted-foreground",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    cyan: "bg-cyan/15 text-cyan",
    blue: "bg-blue-100 text-blue-700",
  } as const;
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m[tone]}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-navy">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: any; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-cyan" />
      <h3 className="mt-3 font-semibold text-navy">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card"><table className="w-full text-sm">{children}</table></div>;
}

export function statusTone(s: string): "green" | "amber" | "red" | "cyan" | "blue" | "muted" {
  switch (s) {
    case "available":
    case "confirmed":
    case "paid":
    case "completed":
    case "approved":
      return "green";
    case "pending":
    case "pending_approval":
    case "maintenance":
      return "amber";
    case "rejected":
    case "failed":
    case "cancelled":
    case "retired":
      return "red";
    case "active":
      return "cyan";
    case "rented":
      return "blue";
    default:
      return "muted";
  }
}