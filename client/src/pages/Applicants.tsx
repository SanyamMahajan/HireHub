import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { api, downloadFile } from "../lib/api";
import { capitalize, timeAgo } from "../lib/format";
import { APPLICATION_STATUSES, type Applicant, type ApplicationStatus, type Job } from "../lib/types";
import { Alert, EmptyState, Spinner, StatusBadge } from "../components/ui";

export default function Applicants() {
  const { id } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Applicant[] | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "">("");
  const [sortByMatch, setSortByMatch] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ job: Job; applications: Applicant[] }>(`/jobs/${id}/applications`)
      .then((d) => {
        setJob(d.job);
        setApps(d.applications);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const changeStatus = async (appId: string, status: ApplicationStatus) => {
    const prev = apps;
    setApps((list) => list?.map((a) => (a._id === appId ? { ...a, status } : a)) ?? null); // optimistic update
    try {
      await api.patch(`/applications/${appId}/status`, { status });
    } catch (e) {
      setApps(prev);
      setError((e as Error).message);
    }
  };

  if (error && !apps) return <div className="mx-auto max-w-3xl px-4 py-10"><Alert>{error}</Alert></div>;
  if (!apps || !job) return <Spinner label="Loading applicants..." />;

  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, apps.filter((a) => a.status === s).length]));
  let shown = filter ? apps.filter((a) => a.status === filter) : apps;
  if (sortByMatch) shown = [...shown].sort((a, b) => (b.skillMatch ?? -1) - (a.skillMatch ?? -1));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <Link to="/recruiter" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Applicants · {job.title}</h1>
        <p className="text-slate-500">
          {apps.length} applicant(s) · Required skills: {job.skills.join(", ") || "—"}
        </p>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("")} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === "" ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
          All ({apps.length})
        </button>
        {APPLICATION_STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === s ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {capitalize(s)} ({counts[s]})
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={sortByMatch} onChange={(e) => setSortByMatch(e.target.checked)} className="accent-brand-600" />
          Best skill match first
        </label>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="👥" title={apps.length ? "No applicants with this status" : "No applicants yet"}>
          {!apps.length && "Share your job post to start receiving applications."}
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {shown.map((a) => (
            <div key={a._id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{a.candidate.name.charAt(0)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{a.candidate.name}</h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {a.candidate.headline || a.candidate.email} · applied {timeAgo(a.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(a.candidate.skills || []).map((s) => {
                      const matched = a.matchedSkills.includes(s.toLowerCase());
                      return (
                        <span key={s} className={`rounded-md px-2 py-0.5 text-xs font-medium ${matched ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {s}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {a.skillMatch !== null && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${a.skillMatch >= 70 ? "text-emerald-600" : a.skillMatch >= 40 ? "text-amber-600" : "text-red-500"}`}>{a.skillMatch}%</div>
                    <div className="text-xs text-slate-500">skill match</div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <select className="input w-auto" value={a.status} onChange={(e) => changeStatus(a._id, e.target.value as ApplicationStatus)} aria-label="Application status">
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {capitalize(s)}
                    </option>
                  ))}
                </select>
                <button className="btn-outline" onClick={() => downloadFile(`/applications/${a._id}/resume`, a.resume.originalName).catch((e) => setError(e.message))}>
                  📄 Download resume
                </button>
                <a className="btn-outline" href={`mailto:${a.candidate.email}?subject=${encodeURIComponent(`Your application for ${job.title}`)}`}>
                  ✉️ Email
                </a>
                {a.coverLetter && (
                  <button className="text-sm font-medium text-brand-600 hover:underline" onClick={() => setExpanded(expanded === a._id ? null : a._id)}>
                    {expanded === a._id ? "Hide cover letter" : "Show cover letter"}
                  </button>
                )}
              </div>
              {expanded === a._id && <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{a.coverLetter}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
