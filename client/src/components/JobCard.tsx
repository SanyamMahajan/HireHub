import { Link } from "react-router";
import type { Job } from "../lib/types";
import { capitalize, formatSalary, timeAgo } from "../lib/format";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/jobs/${job._id}`}
      className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-lg font-bold text-brand-700">
          {job.company.charAt(0)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">{job.title}</h3>
          <p className="truncate text-sm text-slate-500">{job.company}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="chip">📍 {job.location}</span>
        <span className="chip">💼 {capitalize(job.type)}</span>
        <span className="chip">🏢 {capitalize(job.workMode)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.skills.slice(0, 4).map((s) => (
          <span key={s} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {s}
          </span>
        ))}
        {job.skills.length > 4 && <span className="text-xs text-slate-400">+{job.skills.length - 4}</span>}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
        <span className="font-semibold text-slate-800">{formatSalary(job)}</span>
        <span className="text-xs text-slate-400">{timeAgo(job.createdAt)}</span>
      </div>
    </Link>
  );
}
