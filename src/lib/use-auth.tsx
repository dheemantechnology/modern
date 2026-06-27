import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "manager" | "editor" | "viewer";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  rolesLoading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const latestRoleRequest = useRef(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRolesLoading(true);
        setTimeout(() => {
          void loadRoles(s.user.id);
        }, 0);
      } else {
        setRoles([]);
        setRolesLoading(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        setRolesLoading(true);
        void loadRoles(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadRoles(uid: string) {
    const requestId = latestRoleRequest.current + 1;
    latestRoleRequest.current = requestId;

    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);

      if (requestId !== latestRoleRequest.current) return;

      if (error) {
        console.error("Failed to load user roles", error);
        setRoles([]);
        return;
      }

      setRoles(((data ?? []).map((r) => r.role) as Role[]) ?? []);
    } finally {
      if (requestId === latestRoleRequest.current) {
        setRolesLoading(false);
      }
    }
  }

  const value: AuthCtx = {
    user,
    session,
    roles,
    loading,
    rolesLoading,
    isStaff: roles.some((r) => ["admin", "manager", "editor", "viewer"].includes(r)),
    isAdmin: roles.includes("admin"),
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUp: async (email, password, displayName) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin`, data: { display_name: displayName } },
      });
      return { error: error?.message };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside <AuthProvider>");
  return v;
}