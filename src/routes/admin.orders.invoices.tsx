import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Receipt, Download, Search, Eye, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableShell, EmptyState, StatCard } from "@/components/admin/ui";
import { BookingProfileDialog } from "@/components/admin/BookingProfileDialog";

export const Route = createFileRoute("/admin/orders/invoices")({ component: InvoicesPage });

function InvoicesPage() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, bookings(id, reference, channel, total, start_date, end_date, customers(id, full_name, email, phone), vehicles(name))")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return invoices;
    return (invoices as any[]).filter((i) =>
      i.number?.toLowerCase().includes(s) ||
      i.bookings?.reference?.toLowerCase().includes(s) ||
      i.bookings?.customers?.full_name?.toLowerCase().includes(s),
    );
  }, [invoices, q]);

  const totals = useMemo(() => {
    const inv = invoices as any[];
    return { count: inv.length, amount: inv.reduce((s, i) => s + Number(i.amount ?? 0), 0) };
  }, [invoices]);

  function downloadInvoice(inv: any) {
    const b = inv.bookings;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${inv.number}</title>
      <style>body{font-family:system-ui,sans-serif;padding:40px;color:#0f172a;max-width:780px;margin:auto}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #06b6d4;padding-bottom:16px;margin-bottom:24px}
      h1{margin:0;font-size:24px;color:#0c4a6e} .muted{color:#64748b;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-top:16px} th,td{text-align:left;padding:8px;border-bottom:1px solid #e2e8f0}
      .tot{text-align:right;font-size:20px;font-weight:bold;margin-top:16px;color:#0c4a6e}
      .ftr{margin-top:40px;color:#64748b;font-size:11px;text-align:center}</style></head><body>
      <div class="hdr"><div><h1>INVOICE</h1><p class="muted">${inv.number}</p></div>
      <div style="text-align:right"><p style="margin:0;font-weight:bold">Modern Multi Services</p>
      <p class="muted">Issued ${new Date(inv.issued_at).toLocaleDateString()}</p></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div><p class="muted">Bill to</p><p style="font-weight:bold;margin:4px 0">${b?.customers?.full_name ?? "—"}</p>
        <p class="muted">${b?.customers?.email ?? ""}<br>${b?.customers?.phone ?? ""}</p></div>
        <div><p class="muted">Booking</p><p style="font-weight:bold;margin:4px 0">${b?.reference ?? "—"}</p>
        <p class="muted">${b?.start_date ?? ""} → ${b?.end_date ?? ""}</p></div>
      </div>
      <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody><tr><td>Vehicle rental · ${b?.vehicles?.name ?? "—"}</td><td style="text-align:right">$${Number(inv.amount).toFixed(2)}</td></tr></tbody></table>
      <p class="tot">Total: $${Number(inv.amount).toFixed(2)}</p>
      <p class="ftr">Thank you for your business.</p>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  }

  return (
    <div>
      <PageHeader title="Invoices & Receipts" subtitle="Download or reprint any issued receipt" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Invoices issued" value={totals.count} icon={Receipt} tone="cyan" />
        <StatCard label="Total billed" value={`$${totals.amount.toLocaleString()}`} icon={Receipt} tone="emerald" />
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice, booking, customer…"
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-cyan focus:outline-none" />
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" body="Invoices are auto-generated when a booking is paid." />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Invoice #</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((i: any) => (
              <tr key={i.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{i.number}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(i.issued_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{i.bookings?.reference ?? "—"}</td>
                <td className="px-4 py-3">
                  {i.bookings?.customers?.id ? (
                    <Link to="/admin/customers/$customerId" params={{ customerId: i.bookings.customers.id }} className="font-medium text-navy hover:text-cyan">
                      {i.bookings.customers.full_name}
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{i.bookings?.channel ?? "—"}</span></td>
                <td className="px-4 py-3 font-semibold">${Number(i.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  {i.bookings?.id && (
                    <button onClick={() => setView(i.bookings.id)} className="mr-1 rounded p-1.5 hover:bg-muted" title="Open booking"><Eye className="h-4 w-4 text-cyan" /></button>
                  )}
                  <button onClick={() => downloadInvoice(i)} className="inline-flex items-center gap-1 rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90">
                    <Printer className="h-3 w-3" /> Print / PDF
                  </button>
                  {i.pdf_url && <a href={i.pdf_url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-semibold hover:border-cyan"><Download className="h-3 w-3" /> File</a>}
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