"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type { Mesa, Atencion, Pedido, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import { Armchair, Users, Plus, Clock, X, ShoppingCart, Pencil, DoorOpen, Banknote, ArrowRightLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import clsx from "clsx";

const MESA_COLORS: Record<string, string> = {
  disponible: "bg-green-50 border-green-200 hover:border-green-400",
  ocupada: "bg-red-50 border-red-200 hover:border-red-400",
  reservada: "bg-blue-50 border-blue-200 hover:border-blue-400",
  mantenimiento: "bg-gray-50 border-gray-200",
};

export default function MesasPage() {
  const { user } = useAuth();
  const canEdit = canManage(user, "mesas");
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [pedidosPorAtencion, setPedidosPorAtencion] = useState<Record<number, Pedido[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAtencionModal, setShowAtencionModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [liberando, setLiberando] = useState<number | null>(null);
  const [liberarModal, setLiberarModal] = useState<number | null>(null);

  const fetchMesas = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Mesa>>("/mesas/");
      setMesas(data.results || []);
    } catch {
      toast.error("Error al cargar mesas");
    }
  };

  const fetchAtenciones = async () => {
    try {
      const { data } = await api.get("/atenciones/activas/");
      const lista: Atencion[] = Array.isArray(data) ? data : data.results || [];
      setAtenciones(lista);
      return lista;
    } catch {
      return [];
    }
  };

  const fetchPedidosPorAtenciones = async (lista: Atencion[]) => {
    if (lista.length === 0) return;
    try {
      // Fetch active pedidos (not cancelled/delivered) for all atenciones
      const atencionIds = lista.map((a) => a.id);
      const promises = atencionIds.map((id) =>
        api
          .get<PaginatedResponse<Pedido>>(`/pedidos/?atencion=${id}&ordering=-created_at`)
          .then((r) => ({ atencionId: id, pedidos: r.data.results || [] }))
          .catch(() => ({ atencionId: id, pedidos: [] as Pedido[] }))
      );
      const results = await Promise.all(promises);
      const map: Record<number, Pedido[]> = {};
      results.forEach((r) => {
        // Keep only active pedidos (not cancelado/entregado)
        map[r.atencionId] = r.pedidos.filter(
          (p) => !["cancelado", "entregado"].includes(p.estado)
        );
      });
      setPedidosPorAtencion(map);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const load = async () => {
      const [, ats] = await Promise.all([fetchMesas(), fetchAtenciones()]);
      await fetchPedidosPorAtenciones(ats);
      setLoading(false);
    };
    load();
  }, []);

  // Auto-refresh every 15s to reflect state changes
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchMesas();
      const ats = await fetchAtenciones();
      await fetchPedidosPorAtenciones(ats);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAtencion = (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setShowAtencionModal(true);
  };

  const handleLiberar = (atencionId: number) => {
    setLiberarModal(atencionId);
  };

  const handleConfirmLiberar = async (metodoPago: string) => {
    if (!liberarModal) return;
    setLiberando(liberarModal);
    setLiberarModal(null);
    try {
      await api.post(`/atenciones/${liberarModal}/liberar/`, { metodo_pago: metodoPago });
      toast.success("Mesa liberada");
      await fetchMesas();
      const ats = await fetchAtenciones();
      await fetchPedidosPorAtenciones(ats);
    } catch {
      toast.error("Error al liberar mesa");
    } finally {
      setLiberando(null);
    }
  };

  const getMesaAtencion = (mesaId: number) => atenciones.find((a) => a.mesa === mesaId);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  const disponibles = mesas.filter((m) => m.estado === "disponible").length;
  const ocupadas = mesas.filter((m) => m.estado === "ocupada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {disponibles} disponibles · {ocupadas} ocupadas · {mesas.length} total
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs"><div className="h-3 w-3 rounded-full bg-green-400" />Disponible</div>
        <div className="flex items-center gap-2 text-xs"><div className="h-3 w-3 rounded-full bg-red-400" />Ocupada</div>
        <div className="flex items-center gap-2 text-xs"><div className="h-3 w-3 rounded-full bg-blue-400" />Reservada</div>
      </div>

      {/* Mesa Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mesas.map((mesa) => {
          const atencion = getMesaAtencion(mesa.id);
          return (
            <div
              key={mesa.id}
              className={clsx(
                "relative p-4 rounded-xl border-2 transition-all text-center",
                MESA_COLORS[mesa.estado] || MESA_COLORS.disponible,
              )}
            >
              <button
                onClick={() => canEdit && mesa.estado === "disponible" ? handleOpenAtencion(mesa) : undefined}
                className={clsx(
                  "w-full",
                  canEdit && mesa.estado === "disponible" && "cursor-pointer"
                )}
              >
                <Armchair className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-lg font-bold text-gray-900">Mesa {mesa.numero}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                  <Users className="h-3 w-3" /> {mesa.capacidad}
                </div>
                <StatusBadge status={mesa.estado} />
              </button>
              {atencion && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-gray-500">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {new Date(atencion.hora_llegada).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {/* Existing pedidos for this atencion */}
                  {(pedidosPorAtencion[atencion.id] || []).map((ped) => (
                    <Link
                      key={ped.id}
                      href={`/dashboard/pedidos/${ped.id}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-brand-gold/30 text-brand-dark text-xs font-medium hover:bg-brand-sage/40 transition-colors"
                    >
                      <Pencil className="h-3 w-3 text-brand-gold" />
                      <span className="truncate">Editar {ped.numero_pedido.slice(-4)}</span>
                      <StatusBadge status={ped.estado} />
                    </Link>
                  ))}
                  {/* New pedido button */}
                  {canEdit && (
                    <Link
                      href={`/dashboard/pedidos/nuevo?mesa=${mesa.id}&atencion=${atencion.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-gold text-white text-xs font-medium hover:bg-brand-bronze transition-colors"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Nuevo Pedido
                    </Link>
                  )}
                  {/* Liberar mesa button */}
                  {canEdit && (
                    <button
                      onClick={() => handleLiberar(atencion.id)}
                      disabled={liberando === atencion.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      <DoorOpen className="h-3 w-3" />
                      {liberando === atencion.id ? "Liberando..." : "Liberar Mesa"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Atenciones activas */}
      {atenciones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Atenciones Activas ({atenciones.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Atención</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mesa</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Comensales</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Llegada</th>
                  {canEdit && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atenciones.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{a.numero_atencion}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">Mesa {a.mesa_numero || a.mesa}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{a.numero_comensales}</td>
                    <td className="px-6 py-3"><StatusBadge status={a.estado} /></td>
                    <td className="px-6 py-3 text-sm text-gray-500">
                      {new Date(a.hora_llegada).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleLiberar(a.id)}
                          disabled={liberando === a.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          <DoorOpen className="h-3 w-3" />
                          {liberando === a.id ? "Liberando..." : "Liberar"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Liberar Mesa - Payment Method Modal */}
      {liberarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Método de Pago</h2>
              <button onClick={() => setLiberarModal(null)} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-500 mb-4">Selecciona cómo pagó el cliente para liberar la mesa.</p>
              <button
                onClick={() => handleConfirmLiberar("efectivo")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-green-200 bg-green-50 text-green-800 font-medium hover:border-green-400 transition-colors"
              >
                <Banknote className="h-5 w-5" /> Efectivo
              </button>
              <button
                onClick={() => handleConfirmLiberar("transferencia")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-800 font-medium hover:border-blue-400 transition-colors"
              >
                <ArrowRightLeft className="h-5 w-5" /> Transferencia
              </button>
              <button
                onClick={() => handleConfirmLiberar("tarjeta")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-800 font-medium hover:border-purple-400 transition-colors"
              >
                <CreditCard className="h-5 w-5" /> Tarjeta
              </button>
              <button
                onClick={() => setLiberarModal(null)}
                className="w-full py-2.5 px-4 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50 mt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Atencion Modal */}
      {showAtencionModal && selectedMesa && (
        <NuevaAtencionModal
          mesa={selectedMesa}
          onClose={() => setShowAtencionModal(false)}
          onCreated={async () => {
            setShowAtencionModal(false);
            await fetchMesas();
            const ats = await fetchAtenciones();
            await fetchPedidosPorAtenciones(ats);
          }}
        />
      )}
    </div>
  );
}

function NuevaAtencionModal({ mesa, onClose, onCreated }: { mesa: Mesa; onClose: () => void; onCreated: () => void }) {
  const [comensales, setComensales] = useState("2");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/atenciones/", { mesa: mesa.id, cantidad_personas: Number(comensales) || 1, notas });
      toast.success("Atención creada");
      onCreated();
    } catch {
      toast.error("Error al crear atención");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nueva Atención — Mesa {mesa.numero}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de comensales</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[1-8]"
              value={comensales}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val === "" || (Number(val) >= 0 && Number(val) <= 8)) setComensales(val);
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold text-white text-sm font-medium hover:bg-brand-bronze disabled:opacity-50">{saving ? "Creando..." : "Abrir Mesa"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
