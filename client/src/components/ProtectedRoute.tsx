import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { dashboardPath, useAuth } from "../context/AuthContext";
import type { Role } from "../lib/types";
import { Spinner } from "./ui";

export function ProtectedRoute({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={dashboardPath(user.role)} replace />;
  return <>{children}</>;
}
