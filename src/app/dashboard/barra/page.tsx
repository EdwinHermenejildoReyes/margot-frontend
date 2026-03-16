"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type { Pedido, PedidoDetalle, PedidoPromocion } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import StockInsuficienteModal, {
  type StockErrorResponse,
} from "@/components/StockInsuficienteModal";
import {
  Wine,
  Clock,
  RefreshCw,
  Armchair,
  ShoppingCart,
  Flame,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface PedidoBarra extends Pedido {
  detalles?: PedidoDetalle[];
  promociones?: PedidoPromocion[];
}

export default function BarraPage() {
  const { user } = useAuth();
  const canEdit = canManage(user, "barra");
  const [pedidos, setPedidos] = useState<PedidoBarra[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [stockError, setStockError] = useState<StockErrorResponse | null>(null);

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await api.get("/pedidos/cocina/?seccion=Barra");
      const list: PedidoBarra[] = Array.isArray(data) ? data : data.results || [];
      // Filtrar items para mostrar solo los de Barra
      const filtered = list.map((p) => ({
        ...p,
        detalles: p.detalles?.filter((d) => d.section_name === "Barra"),
        promociones: p.promociones?.filter(
          (pp) => pp.menu_item_seleccionado_section === "Barra"
        ),
      })).filter(
        (p) => (p.detalles?.length || 0) + (p.promociones?.length || 0) > 0
      );
      setPedidos(filtered);
    } catch {
      toast.error("Error al cargar pedidos de barra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPedidos]);

  const handleAction = async (id: number, action: string) => {
    setActionLoading(id);
    try {
      await api.post(`/pedidos/${id}/${action}/`);
      toast.success(
        action === "preparar"
          ? "🍹 Preparación iniciada"
          : "✅ Pedido listo para servir"
      );
      fetchPedidos();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: StockErrorResponse } };
      if (
        axiosErr.response?.status === 409 &&
        axiosErr.response.data?.error === "stock_insuficiente"
      ) {
        setStockError(axiosErr.response.data);
      } else {
        toast.error("Error al actualizar pedido");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getElapsedTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "Ahora";
    if (diff >= 60) return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    return `${diff} min`;
  };

  const confirmados = pedidos.filter((p) => p.estado === "confirmado");
  const enPreparacion = pedidos.filter((p) => p.estado === "en_preparacion");

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wine className="h-7 w-7 text-purple-500" /> Pantalla de Barra
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {confirmados.length} por preparar · {enPreparacion.length} en preparación
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-purple-500"
            />
            Auto-actualizar
          </label>
          <button
            onClick={fetchPedidos}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Actualizar
          </button>
        </div>
      </div>

      {/* Empty State */}
      {pedidos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <Wine className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">
            Sin pedidos pendientes
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Los pedidos con bebidas aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <>
          {/* ═══ CONFIRMADOS — Por preparar ═══ */}
          {confirmados.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                Por Preparar ({confirmados.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {confirmados.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    getElapsedTime={getElapsedTime}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ═══ EN PREPARACIÓN ═══ */}
          {enPreparacion.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-orange-500" />
                En Preparación ({enPreparacion.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {enPreparacion.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    getElapsedTime={getElapsedTime}
                    onAction={handleAction}
                    actionLoading={actionLoading}
                    canEdit={canEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {stockError && (
        <StockInsuficienteModal
          data={stockError}
          onClose={() => setStockError(null)}
          action="preparar"
        />
      )}
    </div>
  );
}

/* ═══ Pedido Card Component ═══ */
function PedidoCard({
  pedido,
  getElapsedTime,
  onAction,
  actionLoading,
  canEdit,
}: {
  pedido: PedidoBarra;
  getElapsedTime: (d: string) => string;
  onAction: (id: number, action: string) => void;
  actionLoading: number | null;
  canEdit: boolean;
}) {
  const isLoading = actionLoading === pedido.id;
  const isConfirmado = pedido.estado === "confirmado";
  const isEnPreparacion = pedido.estado === "en_preparacion";

  return (
    <div
      className={clsx(
        "rounded-xl border-2 overflow-hidden shadow-sm transition-shadow hover:shadow-md",
        isConfirmado && "border-purple-300 bg-purple-50/30",
        isEnPreparacion && "border-orange-300 bg-orange-50/30"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/70">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">
            {pedido.numero_pedido}
          </span>
          {pedido.mesa_numero && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-sage text-brand-dark text-xs font-medium">
              <Armchair className="h-3 w-3" />
              Mesa {pedido.mesa_numero}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={pedido.estado} />
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {getElapsedTime(pedido.created_at)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2 border-t border-gray-100">
        {pedido.detalles?.map((det) => (
          <div key={det.id} className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {det.cantidad}
            </span>
            <div>
              <span className="text-sm font-medium text-gray-900">
                {det.menu_item_name || det.menu_item_nombre || `Ítem #${det.menu_item}`}
              </span>
              {det.notas && (
                <p className="text-xs text-yellow-700 mt-0.5">📝 {det.notas}</p>
              )}
            </div>
          </div>
        ))}
        {pedido.promociones?.map((pp) => (
          <div key={`promo-${pp.id}`} className="flex items-start gap-2">
            <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {pp.cantidad}
            </span>
            <div>
              <span className="text-sm font-medium text-gray-900">
                {pp.menu_item_seleccionado_nombre || pp.promocion_nombre}
              </span>
              <span className="ml-1.5 text-xs text-amber-600 font-medium">
                ★ {pp.promocion_nombre}
              </span>
            </div>
          </div>
        ))}
        {pedido.notas && (
          <div className="mt-2 p-2 rounded-lg bg-yellow-100 text-yellow-800 text-xs">
            📝 {pedido.notas}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        {canEdit && isConfirmado && (
          <button
            onClick={() => onAction(pedido.id, "preparar")}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Flame className="h-4 w-4" />
            {isLoading ? "Procesando..." : "Iniciar Preparación"}
          </button>
        )}
        {canEdit && isEnPreparacion && (
          <button
            onClick={() => onAction(pedido.id, "listo")}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isLoading ? "Procesando..." : "Marcar Listo"}
          </button>
        )}
      </div>
    </div>
  );
}
