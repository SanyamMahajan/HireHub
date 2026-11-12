import { Link, Route, Routes } from "react-router";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import JobDetails from "./pages/JobDetails";
import { Login, Register } from "./pages/Auth";
import CandidateDashboard from "./pages/CandidateDashboard";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import JobForm from "./pages/JobForm";
import Applicants from "./pages/Applicants";

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">
        Go to jobs
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute role="candidate"><CandidateDashboard /></ProtectedRoute>} />

          <Route path="/recruiter" element={<ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/new" element={<ProtectedRoute role="recruiter"><JobForm /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/edit" element={<ProtectedRoute role="recruiter"><JobForm /></ProtectedRoute>} />
          <Route path="/recruiter/jobs/:id/applicants" element={<ProtectedRoute role="recruiter"><Applicants /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} HireHub · Built with the MERN stack by Sanyam Mahajan
      </footer>
    </div>
  );
}
