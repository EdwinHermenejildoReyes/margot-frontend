"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ResumenDia, GastoDiario } from "@/lib/types";
import {
  Landmark,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  Receipt,
  Wallet,
  Calendar,
  Lock,
  LockOpen,
  CheckCircle2,
  Banknote,
  ArrowRightLeft,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

/* ── Categorías de gasto ── */
const CATEGORIAS_GASTO = [
  { value: "insumos", label: "Insumos / Materia Prima" },
  { value: "servicios", label: "Servicios (luz, agua, gas, internet)" },
  { value: "personal", label: "Personal / Nómina" },
  { value: "mantenimiento", label: "Mantenimiento / Reparaciones" },
  { value: "limpieza", label: "Productos de Limpieza" },
  { value: "transporte", label: "Transporte / Delivery" },
  { value: "marketing", label: "Marketing / Publicidad" },
  { value: "otros", label: "Otros" },
];

/* ── Estado badge colors ── */
const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  en_preparacion: "bg-orange-100 text-orange-800",
  listo: "bg-green-100 text-green-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En Preparación",
  listo: "Listo",
  en_camino: "En Camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function fmt(n: string | number): string {
  return Number(n).toFixed(2);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function CajaDiariaPage() {
  const [fecha, setFecha] = useState(today());
  const [data, setData] = useState<ResumenDia | null>(null);
  const [loading, setLoading] = useState(true);

  /* Cierre de caja / apertura */
  const [montoApertura, setMontoApertura] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [savingCaja, setSavingCaja] = useState(false);

  /* Gastos */
  const [gastosOpen, setGastosOpen] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [gastoDesc, setGastoDesc] = useState("");
  const [gastoMonto, setGastoMonto] = useState("");
  const [gastoCategoria, setGastoCategoria] = useState("otros");
  const [savingGasto, setSavingGasto] = useState(false);

  /* Pedidos expand */
  const [pedidosOpen, setPedidosOpen] = useState(true);

  /* Cierre de caja */
  const [closingCaja, setClosingCaja] = useState(false);
  const [showConfirmCierre, setShowConfirmCierre] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cierres-caja/resumen_dia/?fecha=${fecha}`);
      setData(res.data);
      if (res.data.cierre_caja) {
        setMontoApertura(res.data.cierre_caja.monto_apertura);
        setObservaciones(res.data.cierre_caja.observaciones || "");
      } else {
        setMontoApertura("");
        setObservaciones("");
      }
    } catch {
      toast.error("Error al cargar datos del día");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Guardar / Crear cierre de caja ── */
  const handleSaveCaja = async () => {
    if (!montoApertura || isNaN(Number(montoApertura))) {
      toast.error("Ingrese un monto de apertura válido");
      return;
    }
    setSavingCaja(true);
    try {
      if (data?.cierre_caja) {
        await api.patch(`/cierres-caja/${data.cierre_caja.id}/`, {
          monto_apertura: montoApertura,
          observaciones,
        });
        toast.success("Caja actualizada");
      } else {
        await api.post("/cierres-caja/", {
          fecha,
          monto_apertura: montoApertura,
          observaciones,
        });
        toast.success("Caja del día creada");
      }
      fetchData();
    } catch {
      toast.error("Error al guardar la caja");
    } finally {
      setSavingCaja(false);
    }
  };

  /* ── Agregar gasto ── */
  const handleAddGasto = async () => {
    if (!data?.cierre_caja) {
      toast.error("Primero debe crear la caja del día (guardar apertura)");
      return;
    }
    if (!gastoDesc.trim() || !gastoMonto || isNaN(Number(gastoMonto)) || Number(gastoMonto) <= 0) {
      toast.error("Complete descripción y monto válido");
      return;
    }
    setSavingGasto(true);
    try {
      await api.post("/gastos-diarios/", {
        cierre_caja: data.cierre_caja.id,
        descripcion: gastoDesc.trim(),
        monto: gastoMonto,
        categoria: gastoCategoria,
      });
      toast.success("Gasto registrado");
      setGastoDesc("");
      setGastoMonto("");
      setGastoCategoria("otros");
      setShowGastoForm(false);
      fetchData();
    } catch {
      toast.error("Error al registrar gasto");
    } finally {
      setSavingGasto(false);
    }
  };

  /* ── Eliminar gasto ── */
  const handleDeleteGasto = async (gastoId: number) => {
    try {
      await api.delete(`/gastos-diarios/${gastoId}/`);
      toast.success("Gasto eliminado");
      fetchData();
    } catch {
      toast.error("Error al eliminar gasto");
    }
  };

  /* ── Cerrar caja ── */
  const handleCerrarCaja = async () => {
    if (!data?.cierre_caja) return;
    setClosingCaja(true);
    try {
      await api.post(`/cierres-caja/${data.cierre_caja.id}/cerrar/`);
      toast.success("Caja cerrada exitosamente");
      setShowConfirmCierre(false);
      fetchData();
    } catch {
      toast.error("Error al cerrar la caja");
    } finally {
      setClosingCaja(false);
    }
  };

  /* ── Reabrir caja ── */
  const handleReabrirCaja = async () => {
    if (!data?.cierre_caja) return;
    setClosingCaja(true);
    try {
      await api.post(`/cierres-caja/${data.cierre_caja.id}/reabrir/`);
      toast.success("Caja reabierta");
      fetchData();
    } catch {
      toast.error("Error al reabrir la caja");
    } finally {
      setClosingCaja(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const resumen = data?.resumen;
  const cierre = data?.cierre_caja;
  const pedidos = data?.pedidos || [];
  const gastos: GastoDiario[] = cierre?.gastos || [];
  const cajaCerrada = cierre?.cerrado === true;

  const totalVentas = Number(resumen?.total_ventas || 0);
  const totalGastos = Number(resumen?.total_gastos || 0);
  const apertura = Number(resumen?.monto_apertura || 0);
  const resultado = Number(resumen?.resultado || 0);
  const isPositive = resultado >= 0;

  const ventasEfectivo = Number(resumen?.ventas_efectivo || 0);
  const ventasTransferencia = Number(resumen?.ventas_transferencia || 0);
  const ventasTarjeta = Number(resumen?.ventas_tarjeta || 0);
  const ventasSinRegistro = Number(resumen?.ventas_sin_registro || 0);

  const efectivoEnCaja = apertura + (totalVentas - ventasTransferencia) - totalGastos;
  const isEfectivoPositive = efectivoEnCaja >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-gold/10 rounded-xl">
            <Landmark className="h-7 w-7 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estado de Resultados</h1>
            <p className="text-sm text-gray-500">Caja diaria &mdash; Ingresos y gastos</p>
          </div>
        </div>

        {/* Selector de fecha */}
        <div className="flex items-center gap-2">
          {cajaCerrada && (
            <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              <Lock className="h-3.5 w-3.5" /> Caja Cerrada
            </span>
          )}
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* RESUMEN CARDS                                 */}
      {/* ══════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Apertura */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-500">Apertura de Caja</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${fmt(apertura)}</p>
        </div>

        {/* Ventas */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <span className="text-sm text-gray-500">Ventas del Día</span>
          </div>
          <p className="text-2xl font-bold text-green-600">${fmt(totalVentas)}</p>
          <p className="text-xs text-gray-400 mt-1">{resumen?.total_pedidos || 0} pedidos</p>
          {totalVentas > 0 && (
            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
              {ventasEfectivo > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500"><Banknote className="h-3 w-3" /> Efectivo</span>
                  <span className="text-gray-700 font-medium">${fmt(ventasEfectivo)}</span>
                </div>
              )}
              {ventasTransferencia > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500"><ArrowRightLeft className="h-3 w-3" /> Transferencia</span>
                  <span className="text-gray-700 font-medium">${fmt(ventasTransferencia)}</span>
                </div>
              )}
              {ventasTarjeta > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500"><CreditCard className="h-3 w-3" /> Tarjeta</span>
                  <span className="text-gray-700 font-medium">${fmt(ventasTarjeta)}</span>
                </div>
              )}
              {ventasSinRegistro > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Sin registro</span>
                  <span className="text-gray-500 font-medium">${fmt(ventasSinRegistro)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gastos */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-sm text-gray-500">Gastos del Día</span>
          </div>
          <p className="text-2xl font-bold text-red-600">${fmt(totalGastos)}</p>
          <p className="text-xs text-gray-400 mt-1">{gastos.length} registro{gastos.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Resultado con transferencias */}
        <div className={clsx(
          "border rounded-xl p-5 shadow-sm",
          isPositive
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={clsx("p-2 rounded-lg", isPositive ? "bg-emerald-100" : "bg-red-100")}>
              <DollarSign className={clsx("h-5 w-5", isPositive ? "text-emerald-600" : "text-red-600")} />
            </div>
            <span className="text-sm text-gray-500">Total (con transferencias)</span>
          </div>
          <p className={clsx("text-2xl font-bold", isPositive ? "text-emerald-600" : "text-red-600")}>
            ${fmt(resultado)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Apertura + Ventas − Gastos</p>
        </div>
      </div>

      {/* Efectivo en Caja (sin transferencias) */}
      <div className={clsx(
        "border rounded-xl p-5 shadow-sm",
        isEfectivoPositive
          ? "bg-blue-50 border-blue-200"
          : "bg-red-50 border-red-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx("p-2 rounded-lg", isEfectivoPositive ? "bg-blue-100" : "bg-red-100")}>
              <Banknote className={clsx("h-6 w-6", isEfectivoPositive ? "text-blue-600" : "text-red-600")} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Efectivo en Caja (sin transferencias)</span>
              <p className="text-xs text-gray-400">Apertura + Ventas en efectivo/tarjeta − Gastos</p>
            </div>
          </div>
          <p className={clsx("text-2xl font-bold", isEfectivoPositive ? "text-blue-700" : "text-red-600")}>
            ${fmt(efectivoEnCaja)}
          </p>
        </div>
        {ventasTransferencia > 0 && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" /> ${fmt(ventasTransferencia)} en transferencias no incluidas
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* APERTURA DE CAJA                              */}
      {/* ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          Apertura de Caja
          {cierre && (
            <span className={clsx(
              "ml-2 text-xs px-2 py-0.5 rounded-full",
              cajaCerrada ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
            )}>
              {cajaCerrada ? "Cerrada" : "Registrada"}
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Monto de apertura ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
              placeholder="0.00"
              disabled={cajaCerrada}
              className={clsx(
                "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50",
                cajaCerrada && "bg-gray-100 cursor-not-allowed"
              )}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Observaciones (opcional)</label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas sobre la apertura..."
              disabled={cajaCerrada}
              className={clsx(
                "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50",
                cajaCerrada && "bg-gray-100 cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {!cajaCerrada && (
          <button
            onClick={handleSaveCaja}
            disabled={savingCaja}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {savingCaja ? "Guardando..." : cierre ? "Actualizar Caja" : "Crear Caja del Día"}
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* GASTOS                                        */}
      {/* ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Header clicable */}
        <button
          onClick={() => setGastosOpen(!gastosOpen)}
          className="w-full flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Gastos del Día</h2>
            <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              ${fmt(totalGastos)}
            </span>
          </div>
          {gastosOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {gastosOpen && (
          <div className="px-6 pb-6 space-y-4">
            {/* Lista de gastos */}
            {gastos.length > 0 ? (
              <div className="space-y-2">
                {gastos.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {g.categoria_display || g.categoria}
                        {g.created_at && (
                          <> &middot; {new Date(g.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-600">${fmt(g.monto)}</span>
                      <button
                        onClick={() => handleDeleteGasto(g.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar gasto"
                        disabled={cajaCerrada}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay gastos registrados este día.</p>
            )}

            {/* Botón agregar / Formulario */}
            {!cajaCerrada && !showGastoForm ? (
              <button
                onClick={() => {
                  if (!cierre) {
                    toast.error("Primero cree la caja del día (guardar apertura)");
                    return;
                  }
                  setShowGastoForm(true);
                }}
                className="flex items-center gap-2 text-sm text-brand-gold hover:text-brand-gold-dark font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar Gasto
              </button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Nuevo Gasto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={gastoDesc}
                      onChange={(e) => setGastoDesc(e.target.value)}
                      placeholder="Compra de insumos, pago de luz..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={gastoMonto}
                      onChange={(e) => setGastoMonto(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => setGastoCategoria(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  >
                    {CATEGORIAS_GASTO.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGasto}
                    disabled={savingGasto}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {savingGasto ? "Guardando..." : "Guardar Gasto"}
                  </button>
                  <button
                    onClick={() => {
                      setShowGastoForm(false);
                      setGastoDesc("");
                      setGastoMonto("");
                      setGastoCategoria("otros");
                    }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* PEDIDOS DEL DÍA                               */}
      {/* ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <button
          onClick={() => setPedidosOpen(!pedidosOpen)}
          className="w-full flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Ventas del Día</h2>
            <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {pedidos.length} pedido{pedidos.length !== 1 ? "s" : ""} &middot; ${fmt(totalVentas)}
            </span>
          </div>
          {pedidosOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {pedidosOpen && (
          <div className="px-6 pb-6">
            {pedidos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left py-2 pr-4 font-medium">Pedido</th>
                      <th className="text-left py-2 pr-4 font-medium">Hora</th>
                      <th className="text-left py-2 pr-4 font-medium">Estado</th>
                      <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                      <th className="text-left py-2 pr-4 font-medium">Pago</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pedidos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <span className="font-mono text-gray-900 text-xs">{p.numero_pedido}</span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Date(p.created_at).toLocaleTimeString("es-EC", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            ESTADO_COLORS[p.estado] || "bg-gray-100 text-gray-800"
                          )}>
                            {ESTADO_LABELS[p.estado] || p.estado}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500 capitalize">
                          {p.tipo_entrega.replace("_", " ")}
                        </td>
                        <td className="py-3 pr-4">
                          {p.metodo_pago ? (
                            <span className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                              p.metodo_pago.metodo === "efectivo" && "bg-green-100 text-green-700",
                              p.metodo_pago.metodo === "transferencia" && "bg-blue-100 text-blue-700",
                              p.metodo_pago.metodo === "tarjeta" && "bg-purple-100 text-purple-700",
                            )}>
                              {p.metodo_pago.metodo === "efectivo" && <Banknote className="h-3 w-3" />}
                              {p.metodo_pago.metodo === "transferencia" && <ArrowRightLeft className="h-3 w-3" />}
                              {p.metodo_pago.metodo === "tarjeta" && <CreditCard className="h-3 w-3" />}
                              {p.metodo_pago.display}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 text-right font-semibold text-gray-900">
                          ${fmt(p.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={5} className="py-3 text-right text-gray-500 font-medium">
                        Total Ventas
                      </td>
                      <td className="py-3 text-right font-bold text-green-600 text-base">
                        ${fmt(totalVentas)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay pedidos registrados este día.</p>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* CUADRE FINAL (estilo libro contable)          */}
      {/* ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-brand-gold" />
          Cuadre del Día &mdash; {new Date(fecha + "T12:00:00").toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </h2>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Apertura de Caja</span>
            <span className="font-mono text-gray-900">${fmt(apertura)}</span>
          </div>
          <div className="py-2 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-green-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Ingresos (Ventas)
              </span>
              <span className="font-mono text-green-600">+ ${fmt(totalVentas)}</span>
            </div>
            {totalVentas > 0 && (
              <div className="ml-6 mt-1 space-y-0.5">
                {ventasEfectivo > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500"><Banknote className="h-3 w-3" /> Efectivo</span>
                    <span className="font-mono text-gray-600">${fmt(ventasEfectivo)}</span>
                  </div>
                )}
                {ventasTransferencia > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500"><ArrowRightLeft className="h-3 w-3" /> Transferencia</span>
                    <span className="font-mono text-gray-600">${fmt(ventasTransferencia)}</span>
                  </div>
                )}
                {ventasTarjeta > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500"><CreditCard className="h-3 w-3" /> Tarjeta</span>
                    <span className="font-mono text-gray-600">${fmt(ventasTarjeta)}</span>
                  </div>
                )}
                {ventasSinRegistro > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Sin registro de pago</span>
                    <span className="font-mono text-gray-400">${fmt(ventasSinRegistro)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-red-600 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Gastos
            </span>
            <span className="font-mono text-red-600">- ${fmt(totalGastos)}</span>
          </div>
          <div className={clsx(
            "flex justify-between items-center py-3 rounded-lg px-3 mt-2",
            isPositive ? "bg-emerald-50" : "bg-red-50"
          )}>
            <span className={clsx("font-semibold text-lg", isPositive ? "text-emerald-700" : "text-red-700")}>
              Resultado Total
            </span>
            <span className={clsx("font-mono font-bold text-lg", isPositive ? "text-emerald-700" : "text-red-700")}>
              ${fmt(resultado)}
            </span>
          </div>
          <div className={clsx(
            "flex justify-between items-center py-3 rounded-lg px-3 mt-1",
            isEfectivoPositive ? "bg-blue-50" : "bg-red-50"
          )}>
            <span className={clsx("font-semibold flex items-center gap-2", isEfectivoPositive ? "text-blue-700" : "text-red-700")}>
              <Banknote className="h-4 w-4" /> Efectivo en Caja
              <span className="text-xs font-normal text-gray-400">(sin transferencias)</span>
            </span>
            <span className={clsx("font-mono font-bold text-lg", isEfectivoPositive ? "text-blue-700" : "text-red-700")}>
              ${fmt(efectivoEnCaja)}
            </span>
          </div>
        </div>

        {/* Botón Cerrar / Reabrir Caja */}
        {cierre && !cajaCerrada && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            {!showConfirmCierre ? (
              <button
                onClick={() => setShowConfirmCierre(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Lock className="h-4 w-4" />
                Cerrar Caja
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-red-800 font-medium">
                  ¿Está seguro de cerrar la caja del día?
                </p>
                <p className="text-xs text-red-600">
                  Una vez cerrada, no podrá modificar la apertura ni agregar/eliminar gastos.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCerrarCaja}
                    disabled={closingCaja}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {closingCaja ? "Cerrando..." : "Sí, Cerrar Caja"}
                  </button>
                  <button
                    onClick={() => setShowConfirmCierre(false)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {cierre && cajaCerrada && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Caja cerrada</p>
                  <p className="text-xs text-gray-500">
                    {cierre.cerrado_at && new Date(cierre.cerrado_at).toLocaleString("es-EC")}
                    {cierre.cerrado_por_nombre && <> &middot; por {cierre.cerrado_por_nombre}</>}
                  </p>
                </div>
              </div>
              <button
                onClick={handleReabrirCaja}
                disabled={closingCaja}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <LockOpen className="h-4 w-4" />
                {closingCaja ? "Reabriendo..." : "Reabrir Caja"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
