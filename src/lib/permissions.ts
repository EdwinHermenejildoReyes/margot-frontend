import type { TipoUsuario, User } from "./types";

// ── Tipos internos del restaurante (con acceso al dashboard) ──
export const TIPOS_INTERNOS: TipoUsuario[] = [
  "comercio",
  "mesero",
  "cocinero",
  "cajero",
];

// ── Labels legibles para cada tipo de usuario ──
export const TIPO_LABELS: Record<TipoUsuario, string> = {
  comercio: "Administrador",
  mesero: "Mesero",
  cocinero: "Cocinero",
  cajero: "Cajero",
  cliente: "Cliente",
  repartidor: "Repartidor",
};

// ── Rutas del sidebar permitidas por tipo_usuario ──
// staff/is_staff siempre tiene acceso total
export const ROLE_ROUTES: Record<TipoUsuario, string[]> = {
  comercio: [
    "/dashboard",
    "/dashboard/menu",
    "/dashboard/pedidos",
    "/dashboard/mesas",
    "/dashboard/cocina",
    "/dashboard/inventario",
    "/dashboard/costeo",
    "/dashboard/estadisticas",
    "/dashboard/promociones",
    "/dashboard/limpieza",
    "/dashboard/asistencia",
  ],
  mesero: [
    "/dashboard",
    "/dashboard/mesas",
    "/dashboard/pedidos",
    "/dashboard/inventario",
    "/dashboard/limpieza",
    "/dashboard/asistencia",
  ],
  cajero: [
    "/dashboard",
    "/dashboard/mesas",
    "/dashboard/pedidos",
    "/dashboard/inventario",
    "/dashboard/limpieza",
    "/dashboard/asistencia",
  ],
  cocinero: [
    "/dashboard/cocina",
    "/dashboard/inventario",
    "/dashboard/limpieza",
    "/dashboard/asistencia",
  ],
  cliente: [],
  repartidor: [],
};

// ── Helpers ──

/** ¿El usuario es personal interno del restaurante? */
export function isInternal(user: User | null): boolean {
  if (!user) return false;
  if (user.is_staff) return true;
  return TIPOS_INTERNOS.includes(user.tipo_usuario);
}

/** ¿El usuario tiene acceso a esta ruta del dashboard? */
export function canAccessRoute(user: User | null, pathname: string): boolean {
  if (!user) return false;
  if (user.is_staff) return true;
  const routes = ROLE_ROUTES[user.tipo_usuario] || [];
  // Coincidencia exacta o ruta hija (e.g. /dashboard/pedidos/nuevo)
  return routes.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
}

/** ¿El usuario puede ver alertas de stock? (solo comercio/staff) */
export function canViewAlerts(user: User | null): boolean {
  if (!user) return false;
  return user.is_staff || user.tipo_usuario === "comercio";
}

/** ¿El usuario puede gestionar (CRUD) esta sección? */
export function canManage(
  user: User | null,
  section: "menu" | "pedidos" | "mesas" | "cocina" | "inventario" | "estadisticas" | "limpieza" | "asistencia" | "costeo" | "promociones"
): boolean {
  if (!user) return false;
  if (user.is_staff || user.tipo_usuario === "comercio") return true;

  switch (section) {
    case "pedidos":
      return ["mesero", "cajero"].includes(user.tipo_usuario);
    case "mesas":
      return ["mesero", "cajero"].includes(user.tipo_usuario);
    case "cocina":
      return user.tipo_usuario === "cocinero";
    case "inventario":
    case "limpieza":
    case "costeo":
      // mesero, cajero, cocinero can view but NOT create/edit/delete
      return false;
    case "menu":
    case "promociones":
      return false;
    default:
      return false;
  }
}
