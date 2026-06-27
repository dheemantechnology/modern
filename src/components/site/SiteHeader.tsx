import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import logo from "@/assets/logo.png";
import { useSetting } from "@/lib/use-settings";

const navItems = [
  { to: "/" as const, label: "Home" },
  { to: "/about" as const, label: "About" },
  { to: "/fleet" as const, label: "Fleet" },
  { to: "/news" as const, label: "News" },
  { to: "/contact" as const, label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const company = useSetting("company");
  const contact = useSetting("contact");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt={`${company.name} — Somaliland car rental`} className="h-10 w-auto md:h-12" />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-bold text-navy">{company.name}</span>
            <span className="text-[11px] text-muted-foreground">Somaliland · Car Rental</span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="text-sm font-medium text-navy/80 transition hover:text-cyan"
              activeProps={{ className: "text-cyan font-semibold" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a
            href={`tel:${contact.hotline}`}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-navy transition hover:border-cyan hover:text-cyan"
          >
            <Phone className="h-4 w-4" /> {contact.hotline}
          </a>
          <Link
            to="/auth"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-navy transition hover:border-cyan hover:text-cyan"
          >
            Sign in
          </Link>
          <Link
            to="/fleet"
            className="rounded-full bg-gradient-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-card transition hover:shadow-elegant"
          >
            Book a car
          </Link>
        </div>
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-navy md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-navy hover:bg-tint"
                activeProps={{ className: "text-cyan font-semibold" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-navy hover:bg-tint"
            >
              Sign in
            </Link>
            <Link
              to="/fleet"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gradient-cyan px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Book a car
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
