import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Modern Multi Services Admin" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/admin" });
  }, [user, loading, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin" ? await signIn(email, pwd) : await signUp(email, pwd, name || email.split("@")[0]);
    setBusy(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success(mode === "signin" ? "Welcome back" : "Account created — check your email if confirmation is required.");
      if (mode === "signin") nav({ to: "/admin" });
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-hero p-12 text-white">
        <Link to="/" className="font-display text-xl font-bold">Modern Multi Services</Link>
        <div>
          <ShieldCheck className="h-10 w-10 text-cyan" />
          <h2 className="mt-4 font-display text-3xl font-bold">Admin Portal</h2>
          <p className="mt-2 max-w-md text-white/75 text-sm">Manage your fleet, bookings, customers, payments and website content from one secure place.</p>
        </div>
        <p className="text-xs text-white/50">© {new Date().getFullYear()} Modern Multi Services</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-navy">{mode === "signin" ? "Sign in" : "Create account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Access your admin portal" : "First user becomes the admin"}</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input type="email" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required minLength={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <button disabled={busy} className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm text-cyan hover:underline">
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}