import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../lib/api";
import { capitalize } from "../lib/format";
import { JOB_TYPES, WORK_MODES, type JobList } from "../lib/types";
import { JobCard } from "../components/JobCard";
import { Alert, EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<JobList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Local inputs for the search form (applied on submit)
  const [q, setQ] = useState(params.get("q") || "");
  const [location, setLocation] = useState(params.get("location") || "");

  const query = params.toString();
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");
    api
      .get<JobList>(`/jobs?${query}`)
      .then((d) => !ignore && setData(d))
      .catch((e) => !ignore && setError(e.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true; // ignore stale responses when filters change quickly
    };
  }, [query]);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) (v ? next.set(k, v) : next.delete(k));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ q: q.trim(), location: location.trim() });
  };

  const clearAll = () => {
    setQ("");
    setLocation("");
    setParams({});
  };

  const page = data?.page ?? 1;
  const hasFilters = ["q", "location", "type", "workMode", "skill"].some((k) => params.get(k));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">Find your next opportunity, or your next great hire.</h1>
          <p className="mt-4 max-w-xl text-brand-100 md:text-lg">
            Search jobs and internships, apply with your resume in one click, and track every application in one place.
          </p>

          <form onSubmit={onSearch} className="mt-8 grid gap-2 rounded-xl bg-white p-2 shadow-lg md:grid-cols-[1fr_1fr_auto]">
            <input className="input border-0 focus:ring-0" placeholder="🔍  Job title, skill or company" value={q} onChange={(e) => setQ(e.target.value)} />
            <input className="input border-0 focus:ring-0 md:border-l md:border-slate-200" placeholder="📍  Location or Remote" value={location} onChange={(e) => setLocation(e.target.value)} />
            <button className="btn-primary px-6 py-3">Search Jobs</button>
          </form>

          {!user && (
            <p className="mt-5 text-sm text-brand-100">
              Hiring?{" "}
              <Link to="/register?role=recruiter" className="font-semibold text-white underline underline-offset-4">
                Post a job for free →
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Filters + results */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select className="input w-auto" value={params.get("type") || ""} onChange={(e) => update({ type: e.target.value })} aria-label="Job type">
            <option value="">All job types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t}>
                {capitalize(t)}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={params.get("workMode") || ""} onChange={(e) => update({ workMode: e.target.value })} aria-label="Work mode">
            <option value="">Any work mode</option>
            {WORK_MODES.map((m) => (
              <option key={m} value={m}>
                {capitalize(m)}
              </option>
            ))}
          </select>
          <select className="input w-auto" value={params.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="salary">Highest salary</option>
            {params.get("q") && <option value="relevance">Most relevant</option>}
          </select>
          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-medium text-brand-600 hover:underline">
              Clear filters
            </button>
          )}
          {data && <span className="ml-auto text-sm text-slate-500">{data.total} job{data.total === 1 ? "" : "s"} found</span>}
        </div>

        {error && <Alert>{error}</Alert>}
        {loading && !data ? (
          <Spinner label="Loading jobs..." />
        ) : data && data.jobs.length === 0 ? (
          <EmptyState icon="🔎" title="No jobs match your search">
            Try different keywords or{" "}
            <button onClick={clearAll} className="font-medium text-brand-600 hover:underline">
              clear all filters
            </button>
            .
          </EmptyState>
        ) : (
          <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {data?.jobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="btn-outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
              ← Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {data.totalPages}
            </span>
            <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => update({ page: String(page + 1) })}>
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
