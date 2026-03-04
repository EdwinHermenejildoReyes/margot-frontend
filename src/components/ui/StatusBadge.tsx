"use client";

import clsx from "clsx";

const colorMap: Record<string, string> = {
  // Pedidos
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  en_preparacion: "bg-orange-100 text-orange-800",
  listo: "bg-green-100 text-green-800",
  en_camino: "bg-purple-100 text-purple-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
  // Mesas
  disponible: "bg-green-100 text-green-800",
  ocupada: "bg-red-100 text-red-800",
  reservada: "bg-blue-100 text-blue-800",
  // Comandas
  servido: "bg-teal-100 text-teal-800",
  // Inventario
  entrada: "bg-green-100 text-green-800",
  salida: "bg-red-100 text-red-800",
  ajuste: "bg-gray-100 text-gray-800",
  // Limpieza
  completado: "bg-green-100 text-green-800",
  // Atencion
  esperando: "bg-yellow-100 text-yellow-800",
  sentado: "bg-blue-100 text-blue-800",
  atendido: "bg-cyan-100 text-cyan-800",
  cerrada: "bg-gray-100 text-gray-800",
  // Default
  activo: "bg-green-100 text-green-800",
};

const labelMap: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En Preparación",
  listo: "Listo",
  en_camino: "En Camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
  disponible: "Disponible",
  ocupada: "Ocupada",
  reservada: "Reservada",
  servido: "Servido",
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste",
  completado: "Completado",
  esperando: "Esperando",
  sentado: "Sentado",
  atendido: "Atendido",
  cerrada: "Cerrada",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        colorMap[status] || "bg-gray-100 text-gray-800"
      )}
    >
      {labelMap[status] || status.replace(/_/g, " ")}
    </span>
  );
}
