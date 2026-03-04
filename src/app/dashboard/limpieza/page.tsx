"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { PaginatedResponse, ProtocoloLimpieza, ProgramaLimpieza, RegistroLimpieza } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import { SprayCanIcon, Calendar, ClipboardCheck, Clock } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

type Tab = "programas" | "protocolos" | "registros";

export default function LimpiezaPage() {
  const [tab, setTab] = useState<Tab>("programas");
  const [loading, setLoading] = useState(true);
  const [programas, setProgramas] = useState<ProgramaLimpieza[]>([]);
  const [protocolos, setProtocolos] = useState<ProtocoloLimpieza[]>([]);
  const [registros, setRegistros] = useState<RegistroLimpieza[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [progRes, protRes, regRes] = await Promise.all([
          api.get<PaginatedResponse<ProgramaLimpieza>>("/programas-limpieza/").catch(() => ({ data: { results: [] } })),
          api.get<PaginatedResponse<ProtocoloLimpieza>>("/protocolos-limpieza/").catch(() => ({ data: { results: [] } })),
          api.get<PaginatedResponse<RegistroLimpieza>>("/registros-limpieza/?ordering=-fecha").catch(() => ({ data: { results: [] } })),
        ]);
        setProgramas(progRes.data.results || []);
        setProtocolos(protRes.data.results || []);
        setRegistros(regRes.data.results || []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SprayCanIcon className="h-7 w-7 text-brand-gold" /> Limpieza
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de protocolos y programas de limpieza</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { id: "programas" as Tab, label: "Programas", icon: Calendar, count: programas.length },
          { id: "protocolos" as Tab, label: "Protocolos", icon: ClipboardCheck, count: protocolos.length },
          { id: "registros" as Tab, label: "Registros", icon: Clock, count: registros.length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Programas Tab */}
      {tab === "programas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programas.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">No hay programas de limpieza</div>
          ) : (
            programas.map((prog) => (
              <div key={prog.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{prog.nombre || `Programa #${prog.id}`}</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {prog.turno} · {prog.dia}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Protocolos Tab */}
      {tab === "protocolos" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {protocolos.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No hay protocolos de limpieza</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Área</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Frecuencia</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {protocolos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{p.area_nombre || "—"}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{p.frecuencia}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{p.tipo_limpieza?.replace(/_/g, " ")}</td>
                    <td className="px-6 py-3 text-right text-sm text-gray-600">{p.duracion_estimada ? `${p.duracion_estimada} min` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Registros Tab */}
      {tab === "registros" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {registros.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No hay registros de limpieza</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Horario</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm text-gray-900">{r.fecha}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {r.hora_inicio || "—"} {r.hora_fin ? `- ${r.hora_fin}` : ""}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={r.estado} /></td>
                    <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">{r.observaciones || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
