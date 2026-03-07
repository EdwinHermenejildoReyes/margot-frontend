"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { isInternal } from "@/lib/permissions";

/** Extrae la sección del pathname: /dashboard/cocina → "cocina", /dashboard → "dashboard" */
function sectionFromPath(pathname: string): string {
  const parts = pathname.replace(/^\/dashboard\/?/, "").split("/");
  return parts[0] || "dashboard";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sidebarSections } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!isInternal(user)) { router.push("/login"); return; }

    // Staff siempre tiene acceso total
    if (user.is_staff) return;

    const section = sectionFromPath(pathname);
    if (!sidebarSections.includes(section)) {
      // Redirigir a la primera sección permitida
      const first = sidebarSections[0];
      const route = first === "dashboard" ? "/dashboard" : `/dashboard/${first}`;
      router.push(route);
    }
  }, [loading, user, router, pathname, sidebarSections]);

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
