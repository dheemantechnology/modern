import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Pill, TableShell, EmptyState } from "@/components/admin/ui";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

const ROLES = ["admin", "manager", "editor", "viewer"] as const;

function UsersAdmin() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, phone, created_at"),
        supabase.from("user_roles").select("id, user_id, role"),
      ]);
      const byUser: Record<string, { id: string; role: string }[]> = {};
      (roles ?? []).forEach((r) => { (byUser[r.user_id] ||= []).push({ id: r.id, role: r.role }); });
      return (profiles ?? []).map((p) => ({ ...p, roles: byUser[p.id] ?? [] }));
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Role granted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); toast.success("Role removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isAdmin) return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Only administrators can manage users.</div>;

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Grant or revoke access to the admin portal" />
      <div className="mb-4 rounded-xl border border-cyan/30 bg-cyan/5 p-4 text-sm">
        <p className="font-semibold text-navy">How to add a new staff member</p>
        <p className="mt-1 text-muted-foreground">Ask them to sign up at <code className="rounded bg-muted px-1.5 py-0.5">/auth</code>. Once they appear in the list below, assign a role.</p>
      </div>
      {rows.length === 0 ? <EmptyState icon={ShieldCheck} title="No users yet" body="Users will appear after they sign up." /> : (
        <TableShell>
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wider text-navy">
            <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3 text-right">Grant role</th></tr>
          </thead>
          <tbody>{rows.map((u: any) => <UserRow key={u.id} u={u} addRole={addRole} removeRole={removeRole} />)}</tbody>
        </TableShell>
      )}
    </div>
  );
}

function UserRow({ u, addRole, removeRole }: { u: any; addRole: any; removeRole: any }) {
  const [role, setRole] = useState<string>("viewer");
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3"><p className="font-semibold text-navy">{u.display_name ?? "—"}</p><p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p></td>
      <td className="px-4 py-3 text-sm">{u.phone ?? "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
          {u.roles.map((r: any) => (
            <span key={r.id} className="inline-flex items-center gap-1">
              <Pill tone="cyan">{r.role}</Pill>
              <button onClick={() => removeRole.mutate(r.id)} className="rounded p-0.5 hover:bg-muted" title="Remove"><Trash2 className="h-3 w-3 text-rose-600" /></button>
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button onClick={() => addRole.mutate({ user_id: u.id, role })} className="inline-flex items-center gap-1 rounded-md bg-navy px-2 py-1 text-xs font-semibold text-white"><Plus className="h-3 w-3" /> Grant</button>
        </div>
      </td>
    </tr>
  );
}