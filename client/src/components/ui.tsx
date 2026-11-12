import type { ReactNode } from "react";
import type { ApplicationStatus } from "../lib/types";
import { capitalize } from "../lib/format";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      {label}
    </div>
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-brand-100 bg-brand-50 text-brand-700",
  }[kind];
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  applied: "bg-slate-100 text-slate-700",
  shortlisted: "bg-sky-100 text-sky-700",
  interview: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-700",
  hired: "bg-emerald-100 text-emerald-700",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{capitalize(status)}</span>;
}

export function StatCard({ label, value, accent = "text-slate-900" }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
