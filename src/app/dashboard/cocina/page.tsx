"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import type { ComandaCocina } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import { ChefHat, Clock, AlertTriangle, RefreshCw, Wine, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

const PRIORIDAD_COLORS: Record<string, string> = {
  vip: "border-l-yellow-500 bg-yellow-50",
  urgente: "border-l-red-500 bg-red-50",
  normal: "border-l-blue-500 bg-white",
};

const PRIORIDAD_ICONS: Record<string, React.ReactNode> = {
  vip: <span className="text-yellow-600 text-xs font-bold">⭐ VIP</span>,
  urgente: <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><AlertTriangle className="h-3 w-3" /> URGENTE</span>,
  normal: <span className="text-blue-600 text-xs font-medium">Normal</span>,
};

/* Section filter tabs */
const SECTION_TABS = [
  { value: "todas", label: "Todas", icon: <UtensilsCrossed className="h-4 w-4" /> },
  { value: "cocina", label: "Cocina", icon: <ChefHat className="h-4 w-4" /> },
  { value: "barra", label: "Barra", icon: <Wine className="h-4 w-4" /> },
];

export default function CocinaPage() {
  const [comandas, setComandas] = useState<ComandaCocina[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [seccionFilter, setSeccionFilter] = useState("todas");

  const fetchComandas = useCallback(async () => {
    try {
      const { data } = await api.get("/comandas/pendientes/");
      setComandas(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error("Error al cargar comandas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComandas();
  }, [fetchComandas]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchComandas, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchComandas]);

  const handleAction = async (id: number, action: string) => {
    try {
      await api.post(`/comandas/${id}/${action}/`);
      toast.success("Comanda actualizada");
      fetchComandas();
    } catch {
      toast.error("Error al actualizar comanda");
    }
  };

  const getElapsedTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "Ahora";
    return `${diff} min`;
  };

  /* Filter by section */
  const filteredComandas = comandas.filter((c) => {
    if (seccionFilter === "todas") return true;
    const nombre = (c.seccion_nombre || "").toLowerCase();
    return nombre.includes(seccionFilter);
  });

  const pendientes = filteredComandas.filter((c) => c.estado === "pendiente");
  const enPreparacion = filteredComandas.filter((c) => c.estado === "en_preparacion");

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="h-7 w-7 text-brand-gold" /> Pantalla de Cocina
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendientes.length} pendientes · {enPreparacion.length} en preparación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded text-brand-gold" />
            Auto-actualizar
          </label>
          <button
            onClick={fetchComandas}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Section filter tabs */}
      <div className="flex gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSeccionFilter(tab.value)}
            className={clsx(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              seccionFilter === tab.value
                ? "bg-brand-gold text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.value === "todas" && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {comandas.length}
              </span>
            )}
            {tab.value !== "todas" && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                {comandas.filter((c) => (c.seccion_nombre || "").toLowerCase().includes(tab.value)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredComandas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">Sin comandas pendientes</h2>
          <p className="text-sm text-gray-400 mt-1">Las nuevas comandas aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredComandas.map((comanda) => (
            <div
              key={comanda.id}
              className={clsx(
                "rounded-xl border border-gray-200 border-l-4 overflow-hidden shadow-sm transition-shadow hover:shadow-md",
                PRIORIDAD_COLORS[comanda.prioridad] || PRIORIDAD_COLORS.normal
              )}
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-white/50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">#{comanda.numero_comanda || comanda.id}</span>
                  {PRIORIDAD_ICONS[comanda.prioridad]}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={comanda.estado} />
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {getElapsedTime(comanda.hora_enviada)}
                  </span>
                </div>
              </div>

              {/* Meta row: section + mesa */}
              <div className="px-4 py-2 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
                {comanda.seccion_nombre && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-sage text-brand-dark text-xs font-medium">
                    {comanda.seccion_nombre.toLowerCase().includes("barra") ? (
                      <Wine className="h-3 w-3" />
                    ) : (
                      <ChefHat className="h-3 w-3" />
                    )}
                    {comanda.seccion_nombre}
                  </span>
                )}
                {comanda.mesa_numero && (
                  <span className="text-xs font-medium text-gray-600">
                    🪑 Mesa {comanda.mesa_numero}
                  </span>
                )}
                {comanda.pedido_numero && (
                  <span className="text-xs text-gray-400">
                    {comanda.pedido_numero.slice(-6)}
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="px-4 py-3 space-y-2">
                {comanda.detalles?.map((det) => (
                  <div key={det.id} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="h-6 w-6 rounded-full bg-brand-sage text-brand-bronze text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {det.cantidad}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {det.menu_item_name || `Ítem #${det.menu_item}`}
                        </span>
                        {det.notas && (
                          <p className="text-xs text-yellow-700 mt-0.5">📝 {det.notas}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {comanda.notas_cocina && (
                  <div className="mt-2 p-2 rounded-lg bg-yellow-100 text-yellow-800 text-xs">
                    📝 {comanda.notas_cocina}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                {comanda.estado === "pendiente" && (
                  <button
                    onClick={() => handleAction(comanda.id, "iniciar_preparacion")}
                    className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    🔥 Iniciar Preparación
                  </button>
                )}
                {comanda.estado === "en_preparacion" && (
                  <>
                    <button
                      onClick={() => handleAction(comanda.id, "marcar_listo")}
                      className="flex-1 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      ✅ Listo
                    </button>
                    <button
                      onClick={() => handleAction(comanda.id, "marcar_servido")}
                      className="py-2 px-3 rounded-lg bg-teal-100 text-teal-700 text-sm font-medium hover:bg-teal-200 transition-colors"
                    >
                      🍽️ Servido
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
