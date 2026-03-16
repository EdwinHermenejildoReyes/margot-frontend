"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { TIPO_LABELS } from "@/lib/permissions";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Armchair,
  ChefHat,
  Wine,
  Package,
  SprayCanIcon,
  BarChart3,
  Calculator,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

/* Cada item tiene un `key` que coincide con la seccion del backend */
const navigation = [
  { key: "dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "menu", name: "Menú", href: "/dashboard/menu", icon: UtensilsCrossed },
  { key: "pedidos", name: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingCart },
  { key: "mesas", name: "Mesas", href: "/dashboard/mesas", icon: Armchair },
  { key: "cocina", name: "Cocina", href: "/dashboard/cocina", icon: ChefHat },
  { key: "barra", name: "Barra", href: "/dashboard/barra", icon: Wine },
  { key: "inventario", name: "Inventario", href: "/dashboard/inventario", icon: Package },
  { key: "costeo", name: "Costeo", href: "/dashboard/costeo", icon: Calculator },
  { key: "estadisticas", name: "Estadísticas", href: "/dashboard/estadisticas", icon: BarChart3 },
  { key: "promociones", name: "Promociones", href: "/dashboard/promociones", icon: Sparkles },
  { key: "limpieza", name: "Limpieza", href: "/dashboard/limpieza", icon: SprayCanIcon },
  { key: "asistencia", name: "Asistencia", href: "/dashboard/asistencia", icon: Clock },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, sidebarSections } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => {
    // Filtrar navegación según permisos del backend
    const allowedNav = navigation.filter((item) => {
      if (user?.is_staff) return true;
      return sidebarSections.includes(item.key);
    });

    return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-brand-bronze/20">
        <Image
          src="/logo-light.png"
          alt="Margot Food & Drinks"
          width={140}
          height={56}
          className="h-14 w-auto object-contain"
          priority
        />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {allowedNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-brand-gold/20 text-brand-gold-light shadow-sm"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-brand-bronze/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-brand-gold flex items-center justify-center text-white text-sm font-bold">
            {user?.first_name?.[0] || user?.username?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {TIPO_LABELS[user?.tipo_usuario || "cliente"]}
              {user?.is_staff && " · Staff"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </>
    );
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-brand-dark text-white shadow-lg"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-brand-dark flex flex-col transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
