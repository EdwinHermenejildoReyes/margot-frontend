"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sidebarSections: string[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarSections, setSidebarSections] = useState<string[]>([]);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) { setLoading(false); return; }
      const [userRes, sidebarRes] = await Promise.all([
        api.get("/auth/users/me/"),
        api.get("/permisos-sidebar/mis_secciones/"),
      ]);
      setUser(userRes.data);
      setSidebarSections(sidebarRes.data.secciones || []);
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      setSidebarSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/jwt/create/", { username, password });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    await fetchUser();
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setSidebarSections([]);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, sidebarSections, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
