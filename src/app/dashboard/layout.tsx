"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { isInternal, canAccessRoute, ROLE_ROUTES } from "@/lib/permissions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    // No logueado → login
    if (!user) { router.push("/login"); return; }
    // No es personal interno → login
    if (!isInternal(user)) { router.push("/login"); return; }
    // No tiene acceso a esta ruta → primera ruta disponible del rol
    if (!canAccessRoute(user, pathname)) {
      const firstRoute = user.is_staff
        ? "/dashboard"
        : (ROLE_ROUTES[user.tipo_usuario]?.[0] || "/dashboard");
      router.push(firstRoute);
      return;
    }
  }, [loading, user, router, pathname]);

  if (loading) return <LoadingSpinner className="min-h-screen" />;
  if (!user || !isInternal(user)) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
