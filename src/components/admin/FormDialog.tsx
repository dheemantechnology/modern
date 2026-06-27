import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
};

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

export function FormDialog({ open, onClose, title, subtitle, size = "md", children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose} />
      <div className={`relative w-full ${sizeMap[size]} max-h-[90vh] overflow-hidden rounded-2xl bg-card shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col`}>
        <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-cyan/5 to-transparent px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-navy truncate">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-navy transition"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldGroup({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20 ${props.className ?? ""}`}
      rows={props.rows ?? 3}
    />
  );
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-gradient-cyan px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:shadow-lg disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-2 text-sm font-semibold text-navy transition hover:border-cyan hover:bg-muted ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}