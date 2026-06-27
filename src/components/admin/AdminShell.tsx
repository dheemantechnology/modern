import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Car, CalendarCheck, Users, CreditCard, BarChart3,
  ShieldCheck, FileText, Settings, LogOut, Menu, ChevronDown, Home, Info, Image,
  Sparkles, TrendingUp, Tag, Wrench, ListTree, ShoppingBag, Globe, ClipboardList, Receipt,
  Megaphone, UserPlus, Heart, KeyRound,
  Calculator, BookOpen, ReceiptText, PieChart, Building2, UsersRound, Wallet, CalendarOff, HandCoins, Landmark,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";

type Item = { to: string; label: string; icon: any; admin?: boolean };

const cms: Item[] = [
  { to: "/admin/cms/home", label: "Home page", icon: Home },
  { to: "/admin/cms/about", label: "About page", icon: Info },
  { to: "/admin/cms/fleet", label: "Fleet page", icon: Car },
  { to: "/admin/news", label: "News & Media", icon: Megaphone },
];

const dashboards: Item[] = [
  { to: "/admin", label: "My dashboard", icon: Sparkles },
  { to: "/admin/dashboard/operations", label: "Operations", icon: BarChart3 },
  { to: "/admin/dashboard/commercial", label: "Commercial", icon: TrendingUp },
];

const fleet: Item[] = [
  { to: "/admin/fleet/categories", label: "Vehicle Categories", icon: Tag },
  { to: "/admin/fleet", label: "Vehicle Types", icon: ListTree },
  { to: "/admin/fleet/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/fleet/maintenance", label: "Maintenance", icon: Wrench },
];

const orders: Item[] = [
  { to: "/admin/orders/online", label: "Online Bookings", icon: Globe },
  { to: "/admin/orders/manual", label: "Bookings (Manual)", icon: ClipboardList },
  { to: "/admin/orders/rentals", label: "Rental Operations", icon: KeyRound },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/orders/invoices", label: "Invoices & Receipts", icon: Receipt },
];

const crm: Item[] = [
  { to: "/admin/crm/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/admin/crm/leads", label: "Leads", icon: UserPlus },
  { to: "/admin/customers", label: "Customers", icon: Heart },
];

const erp: Item[] = [
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/health", label: "System Health", icon: Activity, admin: true },
  { to: "/admin/users", label: "Users & Roles", icon: ShieldCheck, admin: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, admin: true },
];

const accounting: Item[] = [
  { to: "/admin/accounting/coa", label: "Chart of Accounts", icon: BookOpen },
  { to: "/admin/accounting/journal", label: "Journal Entries", icon: Calculator },
  { to: "/admin/accounting/expenses", label: "Expenses", icon: ReceiptText },
  { to: "/admin/accounting/reports", label: "Financial Reports", icon: PieChart },
];

const hr: Item[] = [
  { to: "/admin/hr/departments", label: "Departments", icon: Building2 },
  { to: "/admin/hr/employees", label: "Employees", icon: UsersRound },
  { to: "/admin/hr/payroll", label: "Payroll", icon: Wallet },
  { to: "/admin/hr/leaves", label: "Leaves", icon: CalendarOff },
  { to: "/admin/hr/advances", label: "Advances", icon: HandCoins },
  { to: "/admin/hr/loans", label: "Loans", icon: Landmark },
];

export function AdminShell() {
  const { user, loading, rolesLoading, isStaff, isAdmin, signOut, roles } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(true);
  const [fleetOpen, setFleetOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [crmOpen, setCrmOpen] = useState(true);
  const [acctOpen, setAcctOpen] = useState(false);
  const [hrOpen, setHrOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!loading && user && !isStaff && roles.length === 0) {
      // not staff yet — show message but still allow viewing
    }
  }, [loading, user, isStaff, roles]);

  if (loading || rolesLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading admin…</div>;
  }

  if (!isStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan" />
          <h1 className="mt-3 font-display text-xl font-bold text-navy">Pending access</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account has no admin role yet. Ask an admin to grant you access.</p>
          <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="mt-5 inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-cyan">Sign out</button>
        </div>
      </div>
    );
  }

  const visibleErp = erp.filter((i) => !i.admin || isAdmin);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-navy text-white transition lg:static lg:translate-x-0`}>
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan font-bold text-navy">M</div>
          <div>
            <p className="text-sm font-bold">MMS Admin</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">Control center</p>
          </div>
        </div>
        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3 text-sm">
          <button
            onClick={() => setDashOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <LayoutDashboard className="h-4 w-4" /> Dashboards
            </span>
            <ChevronDown className={`h-4 w-4 transition ${dashOpen ? "rotate-180" : ""}`} />
          </button>
          {dashOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {dashboards.map((i) => (
                <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <button
            onClick={() => setOrdersOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <ShoppingBag className="h-4 w-4" /> Order Management
            </span>
            <ChevronDown className={`h-4 w-4 transition ${ordersOpen ? "rotate-180" : ""}`} />
          </button>
          {ordersOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {orders.map((i) => (
                <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <button
            onClick={() => setCrmOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <Heart className="h-4 w-4" /> CRM
            </span>
            <ChevronDown className={`h-4 w-4 transition ${crmOpen ? "rotate-180" : ""}`} />
          </button>
          {crmOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {crm.map((i) => (
                <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <button
            onClick={() => setFleetOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <Car className="h-4 w-4" /> Fleet Management
            </span>
            <ChevronDown className={`h-4 w-4 transition ${fleetOpen ? "rotate-180" : ""}`} />
          </button>
          {fleetOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {fleet.map((i) => (
                <NavLink key={i.to} item={i} active={isFleetActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <button
            onClick={() => setAcctOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <Calculator className="h-4 w-4" /> Accounting
            </span>
            <ChevronDown className={`h-4 w-4 transition ${acctOpen ? "rotate-180" : ""}`} />
          </button>
          {acctOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {accounting.map((i) => (
                <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <button
            onClick={() => setHrOpen((v) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-3 font-semibold">
              <UsersRound className="h-4 w-4" /> Human Resources
            </span>
            <ChevronDown className={`h-4 w-4 transition ${hrOpen ? "rotate-180" : ""}`} />
          </button>
          {hrOpen && (
            <div className="ml-3 mb-1 border-l border-white/10 pl-2">
              {hr.map((i) => (
                <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          )}
          <SectionLabel className="mt-4">Website CMS</SectionLabel>
          {cms.map((i) => <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />)}
          <SectionLabel className="mt-4">System</SectionLabel>
          {visibleErp.map((i) => <NavLink key={i.to} item={i} active={isActive(path, i.to)} onNavigate={() => setOpen(false)} />)}
          <div className="mt-auto border-t border-white/10 pt-3">
            <div className="px-3 py-2 text-xs">
              <p className="font-semibold text-white truncate">{user.email}</p>
              <p className="text-white/50 capitalize">{roles.join(", ") || "no role"}</p>
            </div>
            <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-white/70 hover:bg-white/5"><Home className="h-4 w-4" /> Public site</Link>
            <button onClick={async () => { await signOut(); toast.success("Signed out"); nav({ to: "/" }); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-white/70 hover:bg-white/5">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:px-8">
          <button onClick={() => setOpen((v) => !v)} className="lg:hidden rounded-md border border-border p-2"><Menu className="h-4 w-4" /></button>
          <div className="hidden lg:block">
            <h1 className="font-display text-lg font-bold text-navy">{titleFor(path)}</h1>
            <p className="text-xs text-muted-foreground">{breadcrumbFor(path)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-cyan/10 px-3 py-1 text-xs font-semibold text-cyan">
              <ShieldCheck className="h-3.5 w-3.5" /> {isAdmin ? "Administrator" : "Staff"}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-cyan font-bold text-white">
              {(user.email ?? "?")[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function isActive(path: string, to: string) {
  if (to === "/admin") return path === "/admin";
  return path.startsWith(to);
}

// /admin/fleet must not light up when a sub-route like /admin/fleet/vehicles is active
function isFleetActive(path: string, to: string) {
  if (to === "/admin/fleet") return path === "/admin/fleet";
  return path === to || path.startsWith(to + "/");
}

function NavLink({ item, active, onNavigate }: { item: Item; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} onClick={onNavigate}
      className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${active ? "bg-cyan text-navy font-semibold" : "text-white/80 hover:bg-white/10"}`}>
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-white/40 ${className}`}>{children}</p>;
}

function titleFor(path: string) {
  const map: Record<string, string> = {
    "/admin": "My dashboard",
    "/admin/dashboard/operations": "Operations dashboard",
    "/admin/dashboard/commercial": "Commercial dashboard",
    "/admin/fleet": "Vehicle Types",
    "/admin/fleet/categories": "Vehicle Categories",
    "/admin/fleet/vehicles": "Vehicles",
    "/admin/fleet/maintenance": "Maintenance",
    "/admin/bookings": "Bookings",
    "/admin/orders/online": "Online Bookings",
    "/admin/orders/manual": "Manual Bookings",
    "/admin/orders/invoices": "Invoices & Receipts",
    "/admin/orders/rentals": "Rental Operations",
    "/admin/crm/campaigns": "CRM · Campaigns",
    "/admin/crm/leads": "CRM · Leads",
    "/admin/customers": "Customers",
    "/admin/payments": "Payments & Invoices",
    "/admin/reports": "Reports & Analytics",
    "/admin/users": "Users & Roles",
    "/admin/settings": "Settings",
    "/admin/cms/home": "CMS · Home page",
    "/admin/cms/about": "CMS · About page",
    "/admin/cms/fleet": "CMS · Fleet page",
    "/admin/news": "News & Media",
    "/admin/accounting/coa": "Chart of Accounts",
    "/admin/accounting/journal": "Journal Entries",
    "/admin/accounting/expenses": "Expenses",
    "/admin/accounting/reports": "Financial Reports",
    "/admin/hr/departments": "HR · Departments",
    "/admin/hr/employees": "HR · Employees",
    "/admin/hr/payroll": "HR · Payroll",
    "/admin/hr/leaves": "HR · Leaves",
    "/admin/hr/advances": "HR · Advances",
    "/admin/hr/loans": "HR · Loans",
  };
  return map[path] ?? "Admin";
}
function breadcrumbFor(path: string) {
  return path.replace(/^\//, "").replace(/\//g, " · ");
}