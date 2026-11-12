import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { dashboardPath, useAuth, type RegisterInput } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import type { Role } from "../lib/types";
import { Alert, Field } from "../components/ui";

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function useRedirectAfterAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return (role: Role) => navigate(from || dashboardPath(role), { replace: true });
}

export function Login() {
  const { user, login } = useAuth();
  const redirect = useRedirectAfterAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const u = await login(email, password);
      redirect(u.role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (role: Role) => {
    setEmail(`${role}@hirehub.dev`);
    setPassword("demo1234");
  };

  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle={
        <>
          New to HireHub?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
      <div className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
        Try a demo account:{" "}
        <button onClick={() => fillDemo("candidate")} className="font-semibold text-brand-600 hover:underline">
          Candidate
        </button>{" "}
        ·{" "}
        <button onClick={() => fillDemo("recruiter")} className="font-semibold text-brand-600 hover:underline">
          Recruiter
        </button>
      </div>
    </AuthLayout>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const redirect = useRedirectAfterAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    role: params.get("role") === "recruiter" ? "recruiter" : "candidate",
    company: "",
    headline: "",
    skills: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const set = (k: keyof RegisterInput) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setBusy(true);
    try {
      const u = await register(form);
      redirect(u.role);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.details || {});
      } else setError("Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle={
        <>
          Already have one?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(["candidate", "recruiter"] as Role[]).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`rounded-md py-2 text-sm font-semibold transition ${form.role === r ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
            >
              {r === "candidate" ? "🎓 I want a job" : "🏢 I'm hiring"}
            </button>
          ))}
        </div>

        {error && <Alert>{error}</Alert>}
        <Field label="Full name" error={fieldErrors.name}>
          <input className="input" required value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input className="input" type="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" error={fieldErrors.password} hint="At least 6 characters">
          <input className="input" type="password" minLength={6} required value={form.password} onChange={set("password")} />
        </Field>

        {form.role === "recruiter" ? (
          <Field label="Company name" error={fieldErrors.company}>
            <input className="input" required value={form.company} onChange={set("company")} />
          </Field>
        ) : (
          <>
            <Field label="Headline (optional)">
              <input className="input" placeholder="e.g. B.Tech CSE student | React developer" value={form.headline} onChange={set("headline")} />
            </Field>
            <Field label="Skills (optional)" hint="Comma separated. Used to show how well you match each job.">
              <input className="input" placeholder="React, Node.js, MongoDB" value={form.skills} onChange={set("skills")} />
            </Field>
          </>
        )}

        <button className="btn-primary w-full py-2.5" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
