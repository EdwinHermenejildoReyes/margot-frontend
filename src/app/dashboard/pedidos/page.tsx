"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type { Pedido, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronRightIcon,
  Plus,
  Clock,
  Armchair,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import clsx from "clsx";
import StockInsuficienteModal, {
  type StockErrorResponse,
} from "@/components/StockInsuficienteModal";

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "confirmado", label: "Confirmados" },
  { value: "en_preparacion", label: "En Preparación" },
  { value: "listo", label: "Listos" },
  { value: "en_camino", label: "En Camino" },
  { value: "entregado", label: "Entregados" },
  { value: "cancelado", label: "Cancelados" },
];

export default function PedidosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canCreatePedido = canManage(user, "pedidos");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stockError, setStockError] = useState<StockErrorResponse | null>(null);
  const [stockAction, setStockAction] = useState<"confirmar" | "preparar">("confirmar");

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, ordering: "-created_at" };
      if (search) params.search = search;
      if (estado) params.estado = estado;
      const { data } = await api.get<PaginatedResponse<Pedido>>("/pedidos/", { params });
      setPedidos(data.results);
      setTotalCount(data.count);
    } catch {
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, [page, search, estado]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Auto-refresh every 15s to reflect state changes from other users
  useEffect(() => {
    const interval = setInterval(fetchPedidos, 15000);
    return () => clearInterval(interval);
  }, [fetchPedidos]);

  const handleAction = async (e: React.MouseEvent, id: number, action: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.post(`/pedidos/${id}/${action}/`);
      toast.success(`Pedido ${action} exitosamente`);
      fetchPedidos();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: StockErrorResponse } };
      if (
        axiosErr.response?.status === 409 &&
        axiosErr.response.data?.error === "stock_insuficiente"
      ) {
        setStockError(axiosErr.response.data);
        setStockAction(action === "preparar" ? "preparar" : "confirmar");
      } else {
        toast.error(`Error al ${action} el pedido`);
      }
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  /* ── Action button config by state and role ── */
  function getActionButton(pedido: Pedido) {
    const tipo = user?.tipo_usuario;
    const isAdmin = user?.is_staff || tipo === "comercio";
    const isMeseroCajero = tipo === "mesero" || tipo === "cajero";
    const isCocinero = tipo === "cocinero";

    switch (pedido.estado) {
      case "pendiente":
        if (isAdmin || isMeseroCajero)
          return { label: "✅ Confirmar", action: "confirmar", colors: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" };
        return null;
      case "confirmado":
        if (isAdmin || isCocinero)
          return { label: "🔥 Preparar", action: "preparar", colors: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" };
        return null;
      case "en_preparacion":
        if (isAdmin || isCocinero)
          return { label: "✅ Listo", action: "listo", colors: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" };
        return null;
      case "listo":
        if (isAdmin || isMeseroCajero)
          return { label: "🍽️ Entregar", action: "entregar", colors: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" };
        return null;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} pedidos</p>
        </div>
        {canCreatePedido && (
          <Link
            href="/dashboard/pedidos/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:bg-brand-bronze transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Pedido
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número de pedido..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                onClick={() => {
                  setEstado(e.value);
                  setPage(1);
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  estado === e.value
                    ? "bg-brand-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner />
      ) : pedidos.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No se encontraron pedidos</p>
        </div>
      ) : (
        <>
          {/* ═══════════ DESKTOP TABLE (hidden on mobile) ═══════════ */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pedido</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mesa</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidos.map((pedido) => {
                    const actionBtn = getActionButton(pedido);
                    return (
                      <tr
                        key={pedido.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/pedidos/${pedido.id}`)}
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{pedido.numero_pedido}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 capitalize">
                            {pedido.tipo_entrega?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {pedido.mesa_numero ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-sage text-brand-dark text-xs font-medium">
                              <Armchair className="h-3 w-3" />
                              Mesa {pedido.mesa_numero}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={pedido.estado} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">${pedido.total}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
                            {new Date(pedido.created_at).toLocaleDateString("es-ES")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {actionBtn && (
                              <button
                                onClick={(e) => handleAction(e, pedido.id, actionBtn.action)}
                                className={clsx("px-2.5 py-1 rounded-lg text-xs font-medium border", actionBtn.colors)}
                              >
                                {actionBtn.label}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═══════════ MOBILE CARDS (hidden on desktop) ═══════════ */}
          <div className="md:hidden space-y-3">
            {pedidos.map((pedido) => {
              const actionBtn = getActionButton(pedido);
              return (
                <Link
                  key={pedido.id}
                  href={`/dashboard/pedidos/${pedido.id}`}
                  className="block bg-white rounded-xl border border-gray-200 hover:border-brand-gold hover:shadow-md transition-all"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: pedido info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-lg bg-brand-sage flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-4 w-4 text-brand-bronze" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-gray-900 truncate block">
                              {pedido.numero_pedido}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              {pedido.tipo_entrega?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={pedido.estado} />
                          <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            {new Date(pedido.created_at).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right: mesa + total + chevron */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          {pedido.mesa_numero && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-sage text-brand-dark text-[10px] font-bold">
                              <Armchair className="h-2.5 w-2.5" />
                              {pedido.mesa_numero}
                            </span>
                          )}
                          <span className="text-sm font-bold text-brand-gold">${pedido.total}</span>
                          <ChevronRightIcon className="h-4 w-4 text-gray-300" />
                        </div>
                        {actionBtn && (
                          <button
                            onClick={(e) => handleAction(e, pedido.id, actionBtn.action)}
                            className={clsx(
                              "px-2.5 py-1 rounded-lg text-[11px] font-medium border",
                              actionBtn.colors
                            )}
                          >
                            {actionBtn.label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ STOCK INSUFICIENTE MODAL ═══ */}
      {stockError && (
        <StockInsuficienteModal
          data={stockError}
          onClose={() => setStockError(null)}
          action={stockAction}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
