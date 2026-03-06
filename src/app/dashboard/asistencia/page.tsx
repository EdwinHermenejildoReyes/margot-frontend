"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import type {
  RegistroAsistencia,
  ResumenMensual,
  ResumenEmpleado,
  ConfiguracionLocal,
} from "@/lib/types";
import {
  Clock,
  MapPin,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Timer,
  Settings,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

// ── Helpers ──

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ── Componente principal ──

export default function AsistenciaPage() {
  const { user } = useAuth();
  const isAdmin = user?.is_staff || user?.tipo_usuario === "comercio";

  // Tabs
  const [tab, setTab] = useState<"reloj" | "historial" | "equipo" | "config">("reloj");

  // Estado del turno
  const [enTurno, setEnTurno] = useState(false);
  const [turnoActual, setTurnoActual] = useState<RegistroAsistencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reloj vivo
  const [clock, setClock] = useState(new Date());
  const [elapsed, setElapsed] = useState("00:00:00");

  // Historial
  const [resumen, setResumen] = useState<ResumenMensual | null>(null);
  const [mesHist, setMesHist] = useState(new Date().getMonth() + 1);
  const [anioHist, setAnioHist] = useState(new Date().getFullYear());

  // Equipo
  const [equipo, setEquipo] = useState<ResumenEmpleado[]>([]);
  const [mesEquipo, setMesEquipo] = useState(new Date().getMonth() + 1);
  const [anioEquipo, setAnioEquipo] = useState(new Date().getFullYear());

  // Config local
  const [configLocal, setConfigLocal] = useState<ConfiguracionLocal | null>(null);
  const [configForm, setConfigForm] = useState({
    nombre: "",
    latitud: "",
    longitud: "",
    radio_metros: 100,
    direccion: "",
  });
  const [configSaving, setConfigSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reloj en vivo ──
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Elapsed timer ──
  useEffect(() => {
    if (enTurno && turnoActual) {
      const calcElapsed = () => {
        const start = new Date(turnoActual.hora_entrada).getTime();
        const diff = Date.now() - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setElapsed(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      };
      calcElapsed();
      timerRef.current = setInterval(calcElapsed, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed("00:00:00");
    }
  }, [enTurno, turnoActual]);

  // ── Cargar estado al montar ──
  const fetchEstado = useCallback(async () => {
    try {
      const { data } = await api.get("/asistencia/mi_estado/");
      setEnTurno(data.en_turno);
      setTurnoActual(data.registro);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEstado();
  }, [fetchEstado]);

  // ── Obtener coords GPS ──
  function getGPS(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Tu navegador no soporta geolocalización."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          switch (err.code) {
            case err.PERMISSION_DENIED:
              reject(new Error("Permiso de ubicación denegado. Habilítalo en la configuración del navegador."));
              break;
            case err.POSITION_UNAVAILABLE:
              reject(new Error("Ubicación no disponible."));
              break;
            case err.TIMEOUT:
              reject(new Error("Tiempo de espera agotado para obtener ubicación."));
              break;
            default:
              reject(new Error("Error al obtener ubicación."));
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  // ── Registrar Entrada ──
  async function handleEntrada() {
    setActionError(null);
    setActionSuccess(null);
    setGeoError(null);
    setActionLoading(true);

    try {
      const { lat, lng } = await getGPS();
      const { data } = await api.post("/asistencia/registrar_entrada/", {
        latitud: lat,
        longitud: lng,
      });
      setEnTurno(true);
      setTurnoActual(data);
      setActionSuccess("¡Entrada registrada exitosamente!");
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string; distancia?: number; radio_permitido?: number } }; message?: string };
      if (axErr.response?.data?.error) {
        const d = axErr.response.data;
        if (d.distancia) {
          setActionError(
            `${d.error} Distancia: ${d.distancia}m (máx ${d.radio_permitido}m)`
          );
        } else {
          setActionError(d.error ?? "Error al registrar entrada.");
        }
      } else if (axErr.message) {
        setGeoError(axErr.message);
      }
    } finally {
      setActionLoading(false);
    }
  }

  // ── Registrar Salida ──
  async function handleSalida() {
    setActionError(null);
    setActionSuccess(null);
    setGeoError(null);
    setActionLoading(true);

    try {
      const { lat, lng } = await getGPS();
      const { data } = await api.post("/asistencia/registrar_salida/", {
        latitud: lat,
        longitud: lng,
      });
      setEnTurno(false);
      setTurnoActual(null);
      setActionSuccess(
        `¡Salida registrada! Trabajaste ${data.horas_trabajadas_display} horas.`
      );
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string; distancia?: number; radio_permitido?: number } }; message?: string };
      if (axErr.response?.data?.error) {
        const d = axErr.response.data;
        if (d.distancia) {
          setActionError(
            `${d.error} Distancia: ${d.distancia}m (máx ${d.radio_permitido}m)`
          );
        } else {
          setActionError(d.error ?? "Error al registrar salida.");
        }
      } else if (axErr.message) {
        setGeoError(axErr.message);
      }
    } finally {
      setActionLoading(false);
    }
  }

  // ── Historial ──
  const fetchHistorial = useCallback(async () => {
    try {
      const { data } = await api.get(
        `/asistencia/resumen_mensual/?mes=${mesHist}&anio=${anioHist}`
      );
      setResumen(data);
    } catch {
      /* ignore */
    }
  }, [mesHist, anioHist]);

  useEffect(() => {
    if (tab === "historial") fetchHistorial();
  }, [tab, fetchHistorial]);

  // ── Equipo ──
  const fetchEquipo = useCallback(async () => {
    try {
      const { data } = await api.get(
        `/asistencia/resumen_equipo/?mes=${mesEquipo}&anio=${anioEquipo}`
      );
      setEquipo(data.equipo);
    } catch {
      /* ignore */
    }
  }, [mesEquipo, anioEquipo]);

  useEffect(() => {
    if (tab === "equipo" && isAdmin) fetchEquipo();
  }, [tab, fetchEquipo, isAdmin]);

  // ── Config Local ──
  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get("/configuracion-local/");
      if (data.results?.length > 0 || (Array.isArray(data) && data.length > 0)) {
        const cfg = data.results?.[0] || data[0];
        setConfigLocal(cfg);
        setConfigForm({
          nombre: cfg.nombre,
          latitud: String(cfg.latitud),
          longitud: String(cfg.longitud),
          radio_metros: cfg.radio_metros,
          direccion: cfg.direccion || "",
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (tab === "config" && isAdmin) fetchConfig();
  }, [tab, fetchConfig, isAdmin]);

  async function handleSaveConfig() {
    setConfigSaving(true);
    try {
      const payload = {
        nombre: configForm.nombre,
        latitud: configForm.latitud,
        longitud: configForm.longitud,
        radio_metros: configForm.radio_metros,
        direccion: configForm.direccion,
      };
      if (configLocal) {
        await api.put(`/configuracion-local/${configLocal.id}/`, payload);
      } else {
        await api.post("/configuracion-local/", payload);
      }
      await fetchConfig();
      setActionSuccess("Configuración del local guardada.");
    } catch {
      setActionError("Error al guardar la configuración.");
    } finally {
      setConfigSaving(false);
    }
  }

  async function handleUseMyLocation() {
    try {
      const { lat, lng } = await getGPS();
      setConfigForm((f) => ({
        ...f,
        latitud: String(lat),
        longitud: String(lng),
      }));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setGeoError(e.message || "Error al obtener ubicación.");
    }
  }

  // ── Month navigation helpers ──
  function prevMonth(mes: number, anio: number, setMes: (m: number) => void, setAnio: (a: number) => void) {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
  }
  function nextMonth(mes: number, anio: number, setMes: (m: number) => void, setAnio: (a: number) => void) {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  // ── Tabs definition ──
  const tabs = [
    { key: "reloj" as const, label: "Reloj", icon: Clock },
    { key: "historial" as const, label: "Mi Historial", icon: Calendar },
    ...(isAdmin
      ? [
          { key: "equipo" as const, label: "Equipo", icon: Users },
          { key: "config" as const, label: "Configuración", icon: Settings },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
        <p className="text-gray-500 mt-1">
          Registro de entrada y salida con validación de ubicación
        </p>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {(actionError || geoError) && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{actionError || geoError}</span>
          <button
            onClick={() => {
              setActionError(null);
              setGeoError(null);
            }}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap",
              tab === t.key
                ? "bg-brand-gold text-white shadow"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════ TAB: RELOJ ═══════ */}
      {tab === "reloj" && (
        <div className="flex flex-col items-center gap-8">
          {/* Reloj digital */}
          <div className="text-center">
            <p className="text-6xl font-mono font-bold text-gray-900 tracking-wider">
              {clock.toLocaleTimeString("es-EC", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
            <p className="text-gray-500 mt-2">
              {clock.toLocaleDateString("es-EC", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Estado actual */}
          <div
            className={clsx(
              "w-full max-w-md rounded-2xl p-6 text-center border",
              enTurno
                ? "bg-green-50 border-green-300"
                : "bg-gray-50 border-gray-200"
            )}
          >
            {enTurno ? (
              <>
                <div className="flex items-center justify-center gap-2 text-green-400 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                  </span>
                  <span className="font-semibold text-lg">En turno</span>
                </div>
                <p className="text-4xl font-mono font-bold text-gray-900 mb-2">
                  {elapsed}
                </p>
                <p className="text-gray-500 text-sm">
                  Entrada: {formatTime(turnoActual?.hora_entrada || null)}
                </p>
              </>
            ) : (
              <div className="text-gray-500">
                <Timer className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-lg">Sin turno activo</p>
                <p className="text-sm mt-1">Registra tu entrada para iniciar</p>
              </div>
            )}
          </div>

          {/* Botón de acción */}
          <button
            onClick={enTurno ? handleSalida : handleEntrada}
            disabled={actionLoading}
            className={clsx(
              "flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              enTurno
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-brand-gold hover:bg-brand-bronze text-white"
            )}
          >
            {actionLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : enTurno ? (
              <LogOut className="h-6 w-6" />
            ) : (
              <LogIn className="h-6 w-6" />
            )}
            {actionLoading
              ? "Verificando ubicación..."
              : enTurno
              ? "Registrar Salida"
              : "Registrar Entrada"}
          </button>

          <p className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Se validará tu ubicación GPS para confirmar que estás en el local
          </p>
        </div>
      )}

      {/* ══════════════════════════════════ TAB: HISTORIAL ═══════ */}
      {tab === "historial" && (
        <div className="space-y-6">
          {/* Month selector */}
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
            <button
              onClick={() => prevMonth(mesHist, anioHist, setMesHist, setAnioHist)}
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-gray-900 font-semibold">
              {MESES[mesHist - 1]} {anioHist}
            </span>
            <button
              onClick={() => nextMonth(mesHist, anioHist, setMesHist, setAnioHist)}
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Summary cards */}
          {resumen && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-3xl font-bold text-brand-gold">
                  {resumen.total_horas}h
                </p>
                <p className="text-gray-500 text-sm mt-1">Horas totales</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                <p className="text-3xl font-bold text-brand-gold">
                  {resumen.dias_trabajados}
                </p>
                <p className="text-gray-500 text-sm mt-1">Días trabajados</p>
              </div>
            </div>
          )}

          {/* Records table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Entrada</th>
                    <th className="text-left px-4 py-3">Salida</th>
                    <th className="text-left px-4 py-3">Horas</th>
                    <th className="text-left px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen?.registros?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">
                        Sin registros este mes
                      </td>
                    </tr>
                  )}
                  {resumen?.registros?.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        {formatDate(r.fecha)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatTime(r.hora_entrada)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatTime(r.hora_salida)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-mono">
                        {r.horas_trabajadas_display}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            r.estado === "completado" &&
                              "bg-green-500/20 text-green-400",
                            r.estado === "en_turno" &&
                              "bg-blue-500/20 text-blue-400",
                            r.estado === "irregular" &&
                              "bg-red-500/20 text-red-400"
                          )}
                        >
                          {r.estado === "completado"
                            ? "Completado"
                            : r.estado === "en_turno"
                            ? "En turno"
                            : "Irregular"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ TAB: EQUIPO ═══════ */}
      {tab === "equipo" && isAdmin && (
        <div className="space-y-6">
          {/* Month selector */}
          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
            <button
              onClick={() =>
                prevMonth(mesEquipo, anioEquipo, setMesEquipo, setAnioEquipo)
              }
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-gray-900 font-semibold">
              {MESES[mesEquipo - 1]} {anioEquipo}
            </span>
            <button
              onClick={() =>
                nextMonth(mesEquipo, anioEquipo, setMesEquipo, setAnioEquipo)
              }
              className="p-1 rounded hover:bg-gray-200 text-gray-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Team table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left px-4 py-3">Empleado</th>
                    <th className="text-left px-4 py-3">Cargo</th>
                    <th className="text-right px-4 py-3">Días</th>
                    <th className="text-right px-4 py-3">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {equipo.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-500 py-8">
                        Sin datos este mes
                      </td>
                    </tr>
                  )}
                  {equipo.map((e) => (
                    <tr
                      key={e.usuario_id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {e.nombre}
                      </td>
                      <td className="px-4 py-3 text-gray-500 capitalize">
                        {e.tipo_usuario}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {e.dias_trabajados}
                      </td>
                      <td className="px-4 py-3 text-right text-brand-gold font-bold font-mono">
                        {e.total_horas}h
                      </td>
                    </tr>
                  ))}
                </tbody>
                {equipo.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-gray-200 bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-gray-900 font-semibold">
                        Total equipo
                      </td>
                      <td className="px-4 py-3 text-right text-brand-gold font-bold font-mono">
                        {equipo.reduce((s, e) => s + e.total_horas, 0).toFixed(2)}h
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TAB: CONFIGURACIÓN ═══════ */}
      {tab === "config" && isAdmin && (
        <div className="max-w-lg space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-gold" />
              Ubicación del Local
            </h2>
            <p className="text-sm text-gray-500">
              Configura las coordenadas GPS y el radio permitido para validar la
              asistencia del personal.
            </p>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nombre del local
              </label>
              <input
                type="text"
                value={configForm.nombre}
                onChange={(e) =>
                  setConfigForm((f) => ({ ...f, nombre: e.target.value }))
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                placeholder="Local Principal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Latitud
                </label>
                <input
                  type="text"
                  value={configForm.latitud}
                  onChange={(e) =>
                    setConfigForm((f) => ({ ...f, latitud: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  placeholder="-2.1894128"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Longitud
                </label>
                <input
                  type="text"
                  value={configForm.longitud}
                  onChange={(e) =>
                    setConfigForm((f) => ({ ...f, longitud: e.target.value }))
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  placeholder="-79.8890662"
                />
              </div>
            </div>

            <button
              onClick={handleUseMyLocation}
              type="button"
              className="text-sm text-brand-gold hover:underline flex items-center gap-1"
            >
              <MapPin className="h-3.5 w-3.5" />
              Usar mi ubicación actual
            </button>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Radio permitido (metros)
              </label>
              <input
                type="number"
                value={configForm.radio_metros}
                onChange={(e) =>
                  setConfigForm((f) => ({
                    ...f,
                    radio_metros: parseInt(e.target.value) || 100,
                  }))
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                min={10}
                max={5000}
              />
              <p className="text-xs text-gray-400 mt-1">
                Los empleados deben estar dentro de este radio para registrar
                asistencia.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Dirección (opcional)
              </label>
              <input
                type="text"
                value={configForm.direccion}
                onChange={(e) =>
                  setConfigForm((f) => ({ ...f, direccion: e.target.value }))
                }
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                placeholder="Av. Principal 123..."
              />
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={configSaving || !configForm.latitud || !configForm.longitud}
              className="flex items-center gap-2 bg-brand-gold hover:bg-brand-bronze text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {configSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {configLocal ? "Actualizar Configuración" : "Guardar Configuración"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
