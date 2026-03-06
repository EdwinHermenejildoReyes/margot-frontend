"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, Search, AlertTriangle, PackageX, Check, CheckCheck, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { canViewAlerts, TIPO_LABELS } from "@/lib/permissions";
import api from "@/lib/api";
import type { AlertaStockBajo, AlertasNoLeidasResponse } from "@/lib/types";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<AlertaStockBajo[]>([]);
  const [count, setCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Fetch unread alerts ── */
  const fetchAlertas = useCallback(async () => {
    try {
      const { data } = await api.get<AlertasNoLeidasResponse>(
        "/alertas-stock/no_leidas/"
      );
      setCount(data.count);
      setAlertas(data.alertas);
    } catch {
      /* ignore — user might not be staff */
    }
  }, []);

  useEffect(() => {
    if (!canViewAlerts(user)) return;
    fetchAlertas();
    const interval = setInterval(fetchAlertas, 30_000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user, fetchAlertas]);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* ── Mark all as read ── */
  const marcarTodasLeidas = async () => {
    try {
      await api.patch("/alertas-stock/marcar_todas_leidas/");
      setCount(0);
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
    } catch { /* ignore */ }
  };

  /* ── Mark one resolved ── */
  const resolverAlerta = async (id: number) => {
    try {
      await api.patch(`/alertas-stock/${id}/marcar_resuelta/`);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 lg:ml-0 ml-12">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* ── Notification bell ── */}
        {canViewAlerts(user) && (
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-500" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ── */}
            {open && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-brand-gold" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      Alertas de Stock
                    </h3>
                    {count > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {count}
                      </span>
                    )}
                  </div>
                  {count > 0 && (
                    <button
                      onClick={marcarTodasLeidas}
                      className="text-xs text-brand-gold hover:text-brand-bronze font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Marcar todas leídas
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {alertas.length === 0 ? (
                    <div className="py-10 text-center">
                      <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        Sin alertas pendientes
                      </p>
                    </div>
                  ) : (
                    alertas.map((a) => (
                      <div
                        key={a.id}
                        className={clsx(
                          "px-4 py-3 border-b border-gray-50 flex gap-3 hover:bg-gray-50/60 transition-colors",
                          !a.leida && "bg-brand-gold/5"
                        )}
                      >
                        {/* Icon */}
                        <div
                          className={clsx(
                            "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                            a.tipo === "sin_stock"
                              ? "bg-red-100"
                              : "bg-amber-100"
                          )}
                        >
                          {a.tipo === "sin_stock" ? (
                            <PackageX className="h-4 w-4 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {a.insumo_nombre}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Stock: {a.stock_al_momento} {a.unidad} — Mínimo:{" "}
                            {a.stock_minimo} {a.unidad}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(a.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>

                        {/* Resolve button */}
                        <button
                          onClick={() => resolverAlerta(a.id)}
                          title="Marcar como resuelta"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors flex-shrink-0 self-start"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {alertas.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <a
                      href="/dashboard/inventario"
                      className="text-xs text-brand-gold hover:text-brand-bronze font-medium transition-colors"
                    >
                      Ver inventario completo →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User info */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {user?.first_name || user?.username}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-sage text-brand-bronze font-medium">
            {user?.is_staff ? "Staff" : TIPO_LABELS[user?.tipo_usuario || "cliente"]}
          </span>
        </div>
      </div>
    </header>
  );
}
