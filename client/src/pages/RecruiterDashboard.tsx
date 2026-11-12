import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";
import { capitalize, timeAgo } from "../lib/format";
import type { DashboardStats, MyJob } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Alert, EmptyState, Spinner, StatCard } from "../components/ui";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<MyJob[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    Promise.all([api.get<{ jobs: MyJob[] }>("/jobs/mine"), api.get<DashboardStats>("/stats/dashboard")])
      .then(([j, s]) => {
        setJobs(j.jobs);
        setStats(s);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (job: MyJob) => {
    try {
      await api.put(`/jobs/${job._id}`, { status: job.status === "open" ? "closed" : "open" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (job: MyJob) => {
    if (!confirm(`Delete "${job.title}"? All ${job.applicants} application(s) will also be deleted.`)) return;
    try {
      await api.delete(`/jobs/${job._id}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recruiter dashboard</h1>
          <p className="text-slate-500">{user?.company} · Manage your job posts and applicants.</p>
        </div>
        <Link to="/recruiter/jobs/new" className="btn-primary">
          + Post a new job
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Open jobs" value={`${stats.openJobs} / ${stats.totalJobs}`} />
            <StatCard label="Total applicants" value={stats.totalApplications} accent="text-brand-600" />
            <StatCard label="Shortlisted / Interview" value={stats.byStatus.shortlisted + stats.byStatus.interview} accent="text-sky-600" />
            <StatCard label="Hired" value={stats.byStatus.hired} accent="text-emerald-600" />
          </div>

          {stats.totalApplications > 0 && (
            <div className="card p-5">
              <p className="mb-3 text-sm font-medium text-slate-600">Hiring pipeline</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                {(
                  [
                    ["applied", "bg-slate-400"],
                    ["shortlisted", "bg-sky-500"],
                    ["interview", "bg-amber-500"],
                    ["hired", "bg-emerald-500"],
                    ["rejected", "bg-red-400"],
                  ] as const
                ).map(([s, color]) =>
                  stats.byStatus[s] ? (
                    <div key={s} className={color} style={{ width: `${(stats.byStatus[s] / stats.totalApplications) * 100}%` }} title={`${capitalize(s)}: ${stats.byStatus[s]}`} />
                  ) : null
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                {Object.entries(stats.byStatus).map(([s, n]) => (
                  <span key={s}>
                    {capitalize(s)}: <strong className="text-slate-700">{n}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">My job posts</h2>
        {!jobs ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <EmptyState icon="📢" title="You haven't posted any jobs yet">
            <Link to="/recruiter/jobs/new" className="font-medium text-brand-600 hover:underline">
              Post your first job →
            </Link>
          </EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Applicants</th>
                  <th className="px-4 py-3 text-center">Shortlisted</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/jobs/${job._id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                        {job.title}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {job.location} · {capitalize(job.type)} · posted {timeAgo(job.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${job.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {capitalize(job.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{job.applicants}</td>
                    <td className="px-4 py-3 text-center">{job.shortlisted}</td>
                    <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                      <Link to={`/recruiter/jobs/${job._id}/applicants`} className="font-medium text-brand-600 hover:underline">
                        Applicants
                      </Link>
                      <Link to={`/recruiter/jobs/${job._id}/edit`} className="font-medium text-slate-600 hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => toggleStatus(job)} className="font-medium text-slate-600 hover:underline">
                        {job.status === "open" ? "Close" : "Reopen"}
                      </button>
                      <button onClick={() => remove(job)} className="font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
