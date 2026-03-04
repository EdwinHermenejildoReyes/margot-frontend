"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import type { InventarioItem, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Package,
  Search,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filterView, setFilterView] = useState<"all" | "stock_bajo" | "por_vencer">("all");
  const [resumen, setResumen] = useState({ total_items: 0, valor_total_inventario: 0, items_stock_bajo: 0 });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/inventario/";
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;

      if (filterView === "stock_bajo") url = "/inventario/stock_bajo/";
      else if (filterView === "por_vencer") url = "/inventario/por_vencer/";

      const { data } = await api.get(url, { params });
      if (Array.isArray(data)) {
        setItems(data);
        setTotalCount(data.length);
      } else {
        setItems(data.results || []);
        setTotalCount(data.count || 0);
      }
    } catch {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterView]);

  const fetchResumen = async () => {
    try {
      const { data } = await api.get("/inventario/resumen/");
      setResumen(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchResumen(); }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <p className="text-sm text-gray-500 mt-1">{totalCount} insumos registrados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Ítems</p>
            <p className="text-xl font-bold text-gray-900">{resumen.total_items}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor Total</p>
            <p className="text-xl font-bold text-gray-900">${resumen.valor_total_inventario.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Bajo</p>
            <p className="text-xl font-bold text-red-600">{resumen.items_stock_bajo}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar insumos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: "all" as const, label: "Todos", icon: Package },
              { value: "stock_bajo" as const, label: "Stock Bajo", icon: TrendingDown },
              { value: "por_vencer" as const, label: "Por Vencer", icon: AlertTriangle },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => { setFilterView(f.value); setPage(1); }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  filterView === f.value
                    ? "bg-brand-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No se encontraron insumos</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Insumo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const stockBajo = parseFloat(item.stock_actual) <= parseFloat(item.stock_minimo);
                  return (
                    <tr key={item.id} className={clsx("hover:bg-gray-50/50 transition-colors", stockBajo && "bg-red-50/50")}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("h-8 w-8 rounded-lg flex items-center justify-center", stockBajo ? "bg-red-100" : "bg-blue-100")}>
                            <Package className={clsx("h-4 w-4", stockBajo ? "text-red-600" : "text-blue-600")} />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">{item.nombre}</span>
                            {item.proveedor_nombre && <p className="text-xs text-gray-400">{item.proveedor_nombre}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.categoria_nombre || "—"}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={clsx("text-sm font-semibold", stockBajo ? "text-red-600" : "text-gray-900")}>
                          {item.stock_actual} {item.unidad_abreviatura || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500">{item.stock_minimo}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">${item.costo_unitario}</td>
                      <td className="px-6 py-4 text-center">
                        {stockBajo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3" /> Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
