import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api, downloadFile } from "../lib/api";
import { capitalize, timeAgo } from "../lib/format";
import type { Application, DashboardStats, User } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Alert, EmptyState, Spinner, StatCard, StatusBadge } from "../components/ui";

export default function CandidateDashboard() {
  const { user, setUser } = useAuth();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState(user?.headline || "");
  const [skills, setSkills] = useState((user?.skills || []).join(", "));

  const load = () =>
    Promise.all([api.get<{ applications: Application[] }>("/applications/mine"), api.get<DashboardStats>("/stats/dashboard")])
      .then(([a, s]) => {
        setApps(a.applications);
        setStats(s);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const withdraw = async (id: string) => {
    if (!confirm("Withdraw this application? Your resume will be deleted.")) return;
    try {
      await api.delete(`/applications/${id}`);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveProfile = async () => {
    try {
      const d = await api.patch<{ user: User }>("/auth/me", { headline, skills });
      setUser(d.user);
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Hi, {user?.name.split(" ")[0]} 👋</h1>
          <p className="text-slate-500">Track your job applications and keep your profile up to date.</p>
        </div>
        <Link to="/" className="btn-primary">
          Browse jobs
        </Link>
      </div>

      {error && <Alert>{error}</Alert>}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Applications" value={stats.totalApplications} />
          <StatCard label="Shortlisted" value={stats.byStatus.shortlisted + stats.byStatus.interview} accent="text-sky-600" />
          <StatCard label="Hired" value={stats.byStatus.hired} accent="text-emerald-600" />
          <StatCard label="Rejected" value={stats.byStatus.rejected} accent="text-red-500" />
        </div>
      )}

      {/* Profile */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My profile</h2>
          {!editing && (
            <button className="btn-outline" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            <input className="input" placeholder="Skills, comma separated" value={skills} onChange={(e) => setSkills(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveProfile}>
                Save
              </button>
              <button className="btn-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-slate-600">{user?.headline || "No headline yet."}</p>
            <div className="flex flex-wrap gap-1.5">
              {user?.skills?.length ? (
                user.skills.map((s) => (
                  <span key={s} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-slate-400">Add skills to see how well you match each job.</span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Applications */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">My applications</h2>
        {!apps ? (
          <Spinner />
        ) : apps.length === 0 ? (
          <EmptyState icon="📝" title="You haven't applied to any jobs yet">
            <Link to="/" className="font-medium text-brand-600 hover:underline">
              Find your first job →
            </Link>
          </EmptyState>
        ) : (
          <div className="card divide-y divide-slate-100">
            {apps.map((a) => (
              <div key={a._id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  {a.job ? (
                    <Link to={`/jobs/${a.job._id}`} className="font-semibold text-slate-900 hover:text-brand-700">
                      {a.job.title}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-400">Job removed</span>
                  )}
                  <p className="text-sm text-slate-500">
                    {a.job ? `${a.job.company} · ${a.job.location} · ${capitalize(a.job.type)}` : ""} · Applied {timeAgo(a.createdAt)}
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => downloadFile(`/applications/${a._id}/resume`, a.resume.originalName)}>
                  Resume
                </button>
                {a.status === "applied" && (
                  <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => withdraw(a._id)}>
                    Withdraw
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
