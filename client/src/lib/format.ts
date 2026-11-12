import type { Job } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// Internships/part-time are usually monthly stipends; big numbers are yearly CTC
export function formatSalary(job: Pick<Job, "salaryMin" | "salaryMax">) {
  const { salaryMin: min, salaryMax: max } = job;
  if (min == null && max == null) return "Not disclosed";
  const top = max ?? min!;
  const fmt = (n: number) => (top >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)} LPA` : inr.format(n));
  const suffix = top >= 100000 ? "" : "/month";
  if (min != null && max != null && min !== max) return `${fmt(min).replace(" LPA", "")}–${fmt(max)}${suffix}`;
  return `${fmt(top)}${suffix}`;
}

export function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, name] of units) {
    const n = Math.floor(s / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
