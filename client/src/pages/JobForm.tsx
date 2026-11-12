import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { api, ApiError } from "../lib/api";
import { capitalize } from "../lib/format";
import { JOB_TYPES, WORK_MODES, type Job } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { Alert, Field, Spinner } from "../components/ui";

type FormState = {
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  skills: string;
  description: string;
};

export default function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    title: "",
    company: user?.company || "",
    location: "",
    type: "full-time",
    workMode: "onsite",
    experience: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
  });
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<{ job: Job; isOwner: boolean }>(`/jobs/${id}`)
      .then(({ job, isOwner }) => {
        if (!isOwner) throw new Error("You can only edit jobs you posted.");
        setForm({
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          workMode: job.workMode,
          experience: job.experience || "",
          salaryMin: job.salaryMin?.toString() ?? "",
          salaryMax: job.salaryMax?.toString() ?? "",
          skills: job.skills.join(", "),
          description: job.description,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (form.salaryMin && form.salaryMax && Number(form.salaryMax) < Number(form.salaryMin)) {
      setFieldErrors({ salaryMax: "Maximum salary must be greater than minimum salary" });
      return;
    }
    setSaving(true);
    try {
      const { job } = isEdit ? await api.put<{ job: Job }>(`/jobs/${id}`, form) : await api.post<{ job: Job }>("/jobs", form);
      navigate(`/jobs/${job._id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details || {});
      } else setError("Could not save the job.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading job..." />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/recruiter" className="text-sm font-medium text-brand-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{isEdit ? "Edit job" : "Post a new job"}</h1>

      <form onSubmit={submit} className="card mt-6 space-y-5 p-6 md:p-8">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Job title *" error={fieldErrors.title}>
            <input className="input" required maxLength={120} placeholder="e.g. MERN Stack Developer" value={form.title} onChange={set("title")} />
          </Field>
          <Field label="Company *" error={fieldErrors.company}>
            <input className="input" required value={form.company} onChange={set("company")} />
          </Field>
          <Field label="Location *" error={fieldErrors.location}>
            <input className="input" required placeholder="e.g. Amritsar, Punjab or Remote" value={form.location} onChange={set("location")} />
          </Field>
          <Field label="Experience">
            <input className="input" placeholder="e.g. Fresher, 1-3 years" value={form.experience} onChange={set("experience")} />
          </Field>
          <Field label="Job type">
            <select className="input" value={form.type} onChange={set("type")}>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {capitalize(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Work mode">
            <select className="input" value={form.workMode} onChange={set("workMode")}>
              {WORK_MODES.map((m) => (
                <option key={m} value={m}>
                  {capitalize(m)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Min salary (₹)" hint="Monthly stipend or yearly CTC" error={fieldErrors.salaryMin}>
            <input className="input" type="number" min={0} value={form.salaryMin} onChange={set("salaryMin")} />
          </Field>
          <Field label="Max salary (₹)" error={fieldErrors.salaryMax}>
            <input className="input" type="number" min={0} value={form.salaryMax} onChange={set("salaryMax")} />
          </Field>
        </div>
        <Field label="Skills" hint="Comma separated, e.g. React, Node.js, MongoDB">
          <input className="input" value={form.skills} onChange={set("skills")} />
        </Field>
        <Field label="Job description *" error={fieldErrors.description}>
          <textarea className="input min-h-40" required maxLength={5000} value={form.description} onChange={set("description")} />
        </Field>
        <div className="flex justify-end gap-3">
          <Link to="/recruiter" className="btn-outline">
            Cancel
          </Link>
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Publish job"}
          </button>
        </div>
      </form>
    </div>
  );
}
