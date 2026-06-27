import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState } from "@/components/admin/ui";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsAdmin });

const STATUSES = ["all", "pending_approval", "confirmed", "active", "completed", "rejected", "cancelled"] as const;

function BookingsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("all");
  const [view, setView] = useState<string | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bookings", filter],
    queryFn: async () => {
      let q = supabase.from("bookings").select("*, vehicles(name, image_url), customers(id, full_name, email, phone)").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "confirmed") { update.approved_at = new Date().toISOString(); }
      const { error } = await supabase.from("bookings").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bookings"] }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Bookings" subtitle="Approve, reject and track reservations" />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-card p-1 border border-border">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? "bg-cyan text-navy" : "text-muted-foreground hover:bg-muted"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No bookings" body="No reservations match this filter." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {bookings.map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{b.reference}</td>
                <td className="px-4 py-3">
                  {b.customers?.id ? (
                    <Link to="/admin/customers/$customerId" params={{ customerId: b.customers.id }} className="font-medium text-navy hover:text-cyan">
                      {b.customers.full_name}
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">{b.vehicles?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{b.start_date} → {b.end_date}</td>
                <td className="px-4 py-3 font-semibold">${Number(b.total).toFixed(0)}</td>
                <td className="px-4 py-3"><Pill tone={statusTone(b.status)}>{b.status.replace("_", " ")}</Pill></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setView(b.id)} className="mr-1 rounded p-1.5 hover:bg-muted" title="View"><Eye className="h-4 w-4 text-cyan" /></button>
                  {b.status === "pending_approval" && (
                    <>
                      <button onClick={() => setStatus.mutate({ id: b.id, status: "confirmed" })} className="mr-1 rounded p-1.5 hover:bg-muted" title="Approve"><Check className="h-4 w-4 text-emerald-600" /></button>
                      <button onClick={() => setStatus.mutate({ id: b.id, status: "rejected" })} className="rounded p-1.5 hover:bg-muted" title="Reject"><X className="h-4 w-4 text-rose-600" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <BookingProfileDialog bookingId={view} onClose={() => setView(null)} />
    </div>
  );
}
