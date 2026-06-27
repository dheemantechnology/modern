import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-original.jpg";
import { useSetting } from "@/lib/use-settings";

export function SiteFooter() {
  const company = useSetting("company");
  const contact = useSetting("contact");
  const footer = useSetting("footer");
  const social = useSetting("social");
  const socialLinks = [
    { label: "Facebook", href: social.facebook },
    { label: "Instagram", href: social.instagram },
    { label: "Twitter", href: social.twitter },
    { label: "LinkedIn", href: social.linkedin },
    { label: "TikTok", href: social.tiktok },
    { label: "YouTube", href: social.youtube },
  ].filter((s) => s.href);
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={logo} alt={company.name} className="h-12 w-auto rounded-md" />
              <div>
                <p className="font-display text-lg font-bold text-white">{company.name}</p>
                <p className="text-xs text-white/60">Somaliland's trusted car rental partner</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm text-white/65">{footer.tagline}</p>
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                {socialLinks.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-3 py-1 hover:border-cyan hover:text-cyan">{s.label}</a>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white">Explore</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/fleet" className="hover:text-cyan">Fleet</Link></li>
              <li><Link to="/about" className="hover:text-cyan">About us</Link></li>
              <li><Link to="/contact" className="hover:text-cyan">Contact</Link></li>
              <li><Link to="/dashboard" className="hover:text-cyan">My account</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white">Reach us</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Call centre · <a href={`tel:${contact.hotline}`} className="text-cyan">{contact.hotline}</a></li>
              <li>{company.address}</li>
              <li><a href={`mailto:${contact.email}`} className="hover:text-cyan">{contact.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/55">
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
          <p>{(footer.badges ?? []).join(" · ")} · {footer.poweredBy}</p>
        </div>
      </div>
    </footer>
  );
}
