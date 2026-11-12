import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { dashboardPath, useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:text-brand-600"}`;

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
        Find Jobs
      </NavLink>
      {user && (
        <NavLink to={dashboardPath(user.role)} end className={linkClass} onClick={() => setOpen(false)}>
          Dashboard
        </NavLink>
      )}
      {user?.role === "recruiter" && (
        <NavLink to="/recruiter/jobs/new" className={linkClass} onClick={() => setOpen(false)}>
          Post a Job
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">H</span>
          Hire<span className="-ml-2 text-brand-600">Hub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">{links}</nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs capitalize text-slate-500">{user.role === "recruiter" ? user.company : user.role}</p>
              </div>
              <button onClick={handleLogout} className="btn-outline">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-md p-2 text-2xl text-slate-700 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">{links}</nav>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            {user ? (
              <button onClick={handleLogout} className="btn-outline w-full">
                Log out ({user.name})
              </button>
            ) : (
              <>
                <Link to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>
                  Log in
                </Link>
                <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
