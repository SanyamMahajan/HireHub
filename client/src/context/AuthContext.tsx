import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler, tokenStore } from "../lib/api";
import type { Role, User } from "../lib/types";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  company?: string;
  headline?: string;
  skills?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session on page load
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api
      .get<{ user: User }>("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const handleAuth = (d: { token: string; user: User }) => {
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      logout,
      setUser,
      login: async (email, password) => handleAuth(await api.post("/auth/login", { email, password })),
      register: async (input) => handleAuth(await api.post("/auth/register", input)),
    }),
    [user, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const dashboardPath = (role: Role) => (role === "recruiter" ? "/recruiter" : "/dashboard");
