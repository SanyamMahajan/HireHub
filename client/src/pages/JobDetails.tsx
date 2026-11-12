import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, ApiError } from "../lib/api";
import { capitalize, formatSalary, timeAgo } from "../lib/format";
import type { ApplicationStatus, Job } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Alert, Field, Spinner, StatusBadge } from "../components/ui";

interface JobResponse {
  job: Job;
  applicants: number;
  isOwner: boolean;
  myApplication: { status: ApplicationStatus; createdAt: string } | null;
}

export default function JobDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<JobResponse | null>(null);
  const [error, setError] = useState("");

  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyError, setApplyError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<JobResponse>(`/jobs/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id, user]);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    setApplyError("");
    if (!resume) return setApplyError("Please choose your resume (PDF).");
    if (resume.type !== "application/pdf") return setApplyError("Resume must be a PDF file.");
    if (resume.size > 2 * 1024 * 1024) return setApplyError("Resume must be smaller than 2 MB.");

    const form = new FormData();
    form.append("resume", resume);
    form.append("coverLetter", coverLetter);
    setSubmitting(true);
    try {
      await api.post(`/jobs/${id}/apply`, form);
      setData((d) => d && { ...d, applicants: d.applicants + 1, myApplication: { status: "applied", createdAt: new Date().toISOString() } });
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : "Could not submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Alert>{error}</Alert>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  if (!data) return <Spinner label="Loading job..." />;

  const { job, applicants, isOwner, myApplication } = data;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
      <article className="card p-6 md:p-8">
        <Link to="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← All jobs
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl font-bold text-brand-700">{job.company.charAt(0)}</div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <p className="text-slate-600">{job.company}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-4">
          {[
            ["Location", job.location],
            ["Job type", capitalize(job.type)],
            ["Work mode", capitalize(job.workMode)],
            ["Experience", job.experience || "—"],
            ["Salary", formatSalary(job)],
            ["Posted", timeAgo(job.createdAt)],
            ["Applicants", String(applicants)],
            ["Status", capitalize(job.status)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-semibold text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-8 text-lg font-semibold">Skills required</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.skills.map((s) => {
            const mine = user?.skills?.some((x) => x.toLowerCase() === s.toLowerCase());
            return (
              <span key={s} className={`rounded-md px-2.5 py-1 text-sm font-medium ${mine ? "bg-emerald-100 text-emerald-700" : "bg-brand-50 text-brand-700"}`}>
                {mine && "✓ "}
                {s}
              </span>
            );
          })}
        </div>

        <h2 className="mt-8 text-lg font-semibold">About the role</h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">{job.description}</p>
      </article>

      {/* Sidebar: apply / manage */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        {isOwner ? (
          <div className="card space-y-3 p-6">
            <h2 className="font-semibold">You posted this job</h2>
            <p className="text-sm text-slate-600">{applicants} candidate(s) have applied.</p>
            <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn-primary w-full">
              View applicants
            </Link>
            <Link to={`/recruiter/jobs/${job._id}/edit`} className="btn-outline w-full">
              Edit job
            </Link>
          </div>
        ) : !user ? (
          <div className="card space-y-3 p-6 text-center">
            <h2 className="font-semibold">Interested in this job?</h2>
            <p className="text-sm text-slate-600">Log in as a candidate to apply with your resume.</p>
            <button onClick={() => navigate("/login", { state: { from: `/jobs/${job._id}` } })} className="btn-primary w-full">
              Log in to apply
            </button>
            <Link to="/register" className="block text-sm font-medium text-brand-600 hover:underline">
              New here? Create an account
            </Link>
          </div>
        ) : user.role === "recruiter" ? (
          <div className="card p-6 text-sm text-slate-600">Recruiter accounts can't apply to jobs. Switch to a candidate account to apply.</div>
        ) : myApplication ? (
          <div className="card space-y-3 p-6">
            <h2 className="font-semibold">Application submitted 🎉</h2>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              Status: <StatusBadge status={myApplication.status} />
            </p>
            <p className="text-xs text-slate-500">Applied {timeAgo(myApplication.createdAt)}</p>
            <Link to="/dashboard" className="btn-outline w-full">
              Track my applications
            </Link>
          </div>
        ) : (
          <form onSubmit={apply} className="card space-y-4 p-6">
            <h2 className="font-semibold">Apply for this job</h2>
            {applyError && <Alert>{applyError}</Alert>}
            <Field label="Resume (PDF, max 2 MB)">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setResume(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              />
            </Field>
            <Field label="Cover letter (optional)">
              <textarea
                className="input min-h-28"
                maxLength={2000}
                placeholder="Why are you a great fit for this role?"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </Field>
            <button className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit application"}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
