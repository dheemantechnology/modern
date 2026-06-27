import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Users, Check, X, Eye, Trash2, Phone, Mail, Search, Award, UserCheck, UserX, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, statusTone, TableShell, EmptyState } from "@/components/admin/ui";
import { FormDialog, FieldGroup, Input, Select, Textarea, PrimaryButton, GhostButton } from "@/components/admin/FormDialog";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { confirmDelete, notifyDeleted, notifyError } from "@/lib/swal";

export const Route = createFileRoute("/admin/customers")({ component: CustomersAdmin });

const TIERS = ["bronze", "silver", "gold", "platinum"];

function CustomersAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (c: any) => {
      const payload: any = { ...c };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      if (c.id) {
        const { error } = await supabase.from("customers").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); setEditing(null); toast.success("Customer saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setKyc = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("customers").update({ kyc_status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("KYC updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setApproval = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("customers").update({ approval_status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success("Customer status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
    onError: (e: any) => notifyError(e.message),
  });

  async function handleDelete(c: any) {
    const ok = await confirmDelete({
      itemLabel: c.full_name,
      description: "All associated bookings and notes will lose their customer link.",
      typeToConfirm: true,
    });
    if (!ok) return;
    await del.mutateAsync(c.id);
    await notifyDeleted(c.full_name);
  }

  const filtered = (customers as any[]).filter((c) =>
    (tab === "all" || (c.approval_status ?? "approved") === tab) &&
    (!q || (c.full_name + " " + (c.email ?? "") + " " + (c.phone ?? "")).toLowerCase().includes(q.toLowerCase()))
  );

  const counts = {
    pending: (customers as any[]).filter((c) => (c.approval_status ?? "approved") === "pending").length,
    approved: (customers as any[]).filter((c) => (c.approval_status ?? "approved") === "approved").length,
    rejected: (customers as any[]).filter((c) => c.approval_status === "rejected").length,
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Approve sign-ups, manage KYC and 360° profiles"
        actions={
          <PrimaryButton onClick={() => setEditing({ kyc_status: "pending", loyalty_tier: "bronze" })}>
            <Plus className="h-4 w-4" /> New customer
          </PrimaryButton>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 max-w-sm flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, phone, email…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="flex rounded-md border border-border bg-card overflow-hidden">
          {([
            ["all", "All", customers.length],
            ["pending", "Pending approval", counts.pending],
            ["approved", "Approved", counts.approved],
            ["rejected", "Rejected", counts.rejected],
          ] as const).map(([key, label, n]) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`px-3 py-2 text-xs font-semibold flex items-center gap-2 ${tab === key ? "bg-cyan text-navy" : "text-muted-foreground hover:bg-muted/50"}`}>
              {label}
              <span className={`rounded-full px-1.5 text-[10px] ${tab === key ? "bg-navy text-white" : "bg-muted text-muted-foreground"}`}>{n}</span>
            </button>
          ))}
        </div>
      </div>

      {counts.pending > 0 && tab !== "pending" && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800"><strong>{counts.pending}</strong> customer{counts.pending > 1 ? "s" : ""} awaiting approval from online sign-ups.</p>
          <button onClick={() => setTab("pending")} className="ml-auto rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">Review</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers yet" body="Add customers manually or wait for sign-ups."
          action={<PrimaryButton onClick={() => setEditing({ kyc_status: "pending", loyalty_tier: "bronze" })}><Plus className="h-4 w-4" /> Add customer</PrimaryButton>} />
      ) : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">License</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">KYC</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-cyan/30" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan to-navy text-sm font-bold text-white">
                        {(c.full_name ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-navy">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.national_id ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {c.email ?? "—"}</p>
                  <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {c.phone ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-xs">
                  {c.license_no ?? "—"}
                  <p className="text-muted-foreground">exp {c.license_expiry ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 capitalize">
                    <Award className="h-3 w-3" /> {c.loyalty_tier ?? "bronze"}
                  </span>
                </td>
                <td className="px-4 py-3"><Pill tone={statusTone(c.kyc_status)}>{c.kyc_status}</Pill></td>
                <td className="px-4 py-3 text-right">
                  {(c.approval_status ?? "approved") === "pending" && (
                    <>
                      <button onClick={() => setApproval.mutate({ id: c.id, status: "approved" })} className="mr-1 rounded p-1.5 hover:bg-emerald-100" title="Approve customer"><UserCheck className="h-4 w-4 text-emerald-600" /></button>
                      <button onClick={() => setApproval.mutate({ id: c.id, status: "rejected" })} className="mr-1 rounded p-1.5 hover:bg-rose-100" title="Reject customer"><UserX className="h-4 w-4 text-rose-600" /></button>
                    </>
                  )}
                  {c.kyc_status === "pending" && (
                    <>
                      <button onClick={() => setKyc.mutate({ id: c.id, status: "approved" })} className="mr-1 rounded p-1.5 hover:bg-emerald-100" title="Approve KYC"><Check className="h-4 w-4 text-emerald-600" /></button>
                      <button onClick={() => setKyc.mutate({ id: c.id, status: "rejected" })} className="mr-1 rounded p-1.5 hover:bg-rose-100" title="Reject KYC"><X className="h-4 w-4 text-rose-600" /></button>
                    </>
                  )}
                  <Link to="/admin/customers/$customerId" params={{ customerId: c.id }} className="mr-1 inline-flex rounded p-1.5 hover:bg-cyan/10" title="View 360°"><Eye className="h-4 w-4 text-cyan" /></Link>
                  <button onClick={() => setEditing(c)} className="mr-1 rounded p-1.5 hover:bg-cyan/10" title="Edit"><Pencil className="h-4 w-4 text-cyan" /></button>
                  <button onClick={() => handleDelete(c)} className="rounded p-1.5 hover:bg-rose-100" title="Delete"><Trash2 className="h-4 w-4 text-rose-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit customer" : "New customer"}
        subtitle={editing?.id ? `Updating ${editing.full_name ?? ""}` : "Capture basic details now — add documents from the 360° profile."}
        size="lg"
        footer={
          <>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
            <PrimaryButton form="customer-form" type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : editing?.id ? "Save changes" : "Create customer"}
            </PrimaryButton>
          </>
        }
      >
        {editing && (
          <form id="customer-form" onSubmit={(e) => { e.preventDefault(); save.mutate(editing); }} className="grid gap-5 md:grid-cols-[200px_1fr]">
            <div>
              <ImageUploader value={editing.avatar_url} onChange={(url) => setEditing({ ...editing, avatar_url: url })} folder="avatars" label="Avatar" aspect="square" />
            </div>
            <div className="space-y-4">
              <FieldGroup label="Full name" required>
                <Input required value={editing.full_name ?? ""} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} placeholder="John Doe" />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Email"><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></FieldGroup>
                <FieldGroup label="Phone"><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+252 …" /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="National ID"><Input value={editing.national_id ?? ""} onChange={(e) => setEditing({ ...editing, national_id: e.target.value })} /></FieldGroup>
                <FieldGroup label="Date of birth"><Input type="date" value={editing.date_of_birth ?? ""} onChange={(e) => setEditing({ ...editing, date_of_birth: e.target.value })} /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="License number"><Input value={editing.license_no ?? ""} onChange={(e) => setEditing({ ...editing, license_no: e.target.value })} /></FieldGroup>
                <FieldGroup label="License expiry"><Input type="date" value={editing.license_expiry ?? ""} onChange={(e) => setEditing({ ...editing, license_expiry: e.target.value })} /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="City"><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} placeholder="Hargeisa" /></FieldGroup>
                <FieldGroup label="Address"><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></FieldGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="KYC status">
                  <Select value={editing.kyc_status ?? "pending"} onChange={(e) => setEditing({ ...editing, kyc_status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Loyalty tier">
                  <Select value={editing.loyalty_tier ?? "bronze"} onChange={(e) => setEditing({ ...editing, loyalty_tier: e.target.value })}>
                    {TIERS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </Select>
                </FieldGroup>
              </div>
              <FieldGroup label="Internal notes" hint="Visible to staff only">
                <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </FieldGroup>
            </div>
          </form>
        )}
      </FormDialog>
    </div>
  );
}
