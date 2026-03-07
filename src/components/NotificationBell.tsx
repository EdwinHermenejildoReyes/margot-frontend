"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChefHat,
  ClipboardCheck,
  Truck,
  XCircle,
  Package,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Notificacion, NotificacionesNoLeidasResponse } from "@/lib/types";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

const ICON_MAP: Record<string, typeof Bell> = {
  pedido_confirmado: ClipboardCheck,
  pedido_en_preparacion: ChefHat,
  pedido_listo: UtensilsCrossed,
  pedido_en_camino: Truck,
  pedido_entregado: Package,
  pedido_cancelado: XCircle,
};

const COLOR_MAP: Record<string, string> = {
  pedido_confirmado: "bg-blue-100 text-blue-600",
  pedido_en_preparacion: "bg-amber-100 text-amber-600",
  pedido_listo: "bg-green-100 text-green-600",
  pedido_en_camino: "bg-indigo-100 text-indigo-600",
  pedido_entregado: "bg-emerald-100 text-emerald-700",
  pedido_cancelado: "bg-red-100 text-red-600",
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [count, setCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  /* ── Fetch ── */
  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get<NotificacionesNoLeidasResponse>(
        "/notificaciones/no_leidas/"
      );
      setCount(data.count);
      setNotifs(data.notificaciones);

      // Toast para nuevas notificaciones
      if (data.count > prevCountRef.current && prevCountRef.current >= 0) {
        const nuevas = data.notificaciones.slice(
          0,
          data.count - prevCountRef.current
        );
        nuevas.forEach((n) => {
          toast(n.titulo + "\n" + n.mensaje, {
            icon: "🔔",
            duration: 5000,
            style: {
              borderLeft: "4px solid #CC9910",
              padding: "12px 16px",
            },
          });
        });
      }
      prevCountRef.current = data.count;
    } catch {
      /* user might not be authenticated */
    }
  }, []);

  useEffect(() => {
    // Initial flag to avoid toasting on first load
    prevCountRef.current = -1;
    fetchNotifs().then(() => {
      // After first fetch, set the ref so future fetches can detect new ones
      // (prevCountRef was set inside fetchNotifs already)
    });
    const id = setInterval(fetchNotifs, 10_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

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

  /* ── Mark one read ── */
  const marcarLeida = async (n: Notificacion) => {
    try {
      await api.post(`/notificaciones/${n.id}/marcar_leida/`);
      setNotifs((prev) => prev.filter((x) => x.id !== n.id));
      setCount((c) => Math.max(0, c - 1));
      prevCountRef.current = Math.max(0, prevCountRef.current - 1);
    } catch {
      /* ignore */
    }
    if (n.pedido) {
      router.push(`/dashboard/pedidos/${n.pedido}`);
      setOpen(false);
    }
  };

  /* ── Mark all read ── */
  const marcarTodasLeidas = async () => {
    try {
      await api.post("/notificaciones/marcar_todas_leidas/");
      setCount(0);
      setNotifs([]);
      prevCountRef.current = 0;
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-500" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-bold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-gold" />
              <h3 className="text-sm font-semibold text-gray-900">
                Notificaciones
              </h3>
              {count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-medium">
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
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Sin notificaciones</p>
              </div>
            ) : (
              notifs.map((n) => {
                const Icon = ICON_MAP[n.tipo] || Bell;
                const color = COLOR_MAP[n.tipo] || "bg-gray-100 text-gray-600";
                return (
                  <button
                    key={n.id}
                    onClick={() => marcarLeida(n)}
                    className="w-full px-4 py-3 border-b border-gray-50 flex gap-3 hover:bg-gray-50/60 transition-colors text-left"
                  >
                    <div
                      className={clsx(
                        "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {n.titulo}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.mensaje}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/dashboard/pedidos");
                }}
                className="text-xs text-brand-gold hover:text-brand-bronze font-medium transition-colors"
              >
                Ver todos los pedidos →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
