"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { HistorialResponse, HistorialCierre } from "@/lib/types";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle2,
  Lock,
  LockOpen,
  ChevronDown,
  ChevronUp,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import clsx from "clsx";

function fmt(n: string | number): string {
  return Number(n).toFixed(2);
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function HistorialCajaPage() {
  const [desde, setDesde] = useState(daysAgo(30));
  const [hasta, setHasta] = useState(today());
  const [data, setData] = useState<HistorialResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(
        `/cierres-caja/historial/?desde=${desde}&hasta=${hasta}`
      );
      setData(res);
    } catch {
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/caja"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            📊 Historial de Caja
          </h1>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setDesde(daysAgo(7)); setHasta(today()); }}
            className="px-3 py-2 text-xs rounded-lg border hover:bg-gray-50"
          >
            7 días
          </button>
          <button
            onClick={() => { setDesde(daysAgo(30)); setHasta(today()); }}
            className="px-3 py-2 text-xs rounded-lg border hover:bg-gray-50"
          >
            30 días
          </button>
          <button
            onClick={() => { setDesde(daysAgo(90)); setHasta(today()); }}
            className="px-3 py-2 text-xs rounded-lg border hover:bg-gray-50"
          >
            90 días
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {data?.totales && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            label="Días registrados"
            value={String(data.totales.dias)}
            icon={<Calendar size={18} />}
            color="blue"
          />
          <SummaryCard
            label="Total Ventas"
            value={`$${fmt(data.totales.total_ventas)}`}
            icon={<TrendingUp size={18} />}
            color="green"
          />
          <SummaryCard
            label="Total Gastos"
            value={`$${fmt(data.totales.total_gastos)}`}
            icon={<TrendingDown size={18} />}
            color="red"
          />
          <SummaryCard
            label="Inversiones"
            value={`$${fmt(data.totales.total_inversiones)}`}
            icon={<Users size={18} />}
            color="purple"
          />
          <SummaryCard
            label="Resultado"
            value={`$${fmt(data.totales.resultado)}`}
            icon={<DollarSign size={18} />}
            color={Number(data.totales.resultado) >= 0 ? "green" : "red"}
          />
        </div>
      )}

      {/* Cierres list */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">Cierres de Caja</h2>
        </div>

        {!data?.cierres?.length ? (
          <div className="p-8 text-center text-gray-400">
            No hay cierres de caja en el período seleccionado
          </div>
        ) : (
          <div className="divide-y">
            {data.cierres.map((cierre) => (
              <CierreRow
                key={cierre.id}
                cierre={cierre}
                expanded={expandedId === cierre.id}
                onToggle={() => toggleExpand(cierre.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Summary Card ── */
function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={clsx("p-1.5 rounded-lg", colorMap[color] || colorMap.blue)}>
          {icon}
        </span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className={clsx("text-lg font-bold", color === "red" ? "text-red-600" : "text-gray-900")}>
        {value}
      </p>
    </div>
  );
}

/* ── Cierre Row ── */
function CierreRow({
  cierre,
  expanded,
  onToggle,
}: {
  cierre: HistorialCierre;
  expanded: boolean;
  onToggle: () => void;
}) {
  const resultado = Number(cierre.resultado);
  const fechaDisplay = new Date(cierre.fecha + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      {/* Clickable row */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition text-left"
      >
        {/* Status */}
        <span className={clsx(
          "flex-shrink-0 p-1.5 rounded-full",
          cierre.cerrado ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
        )}>
          {cierre.cerrado ? <Lock size={14} /> : <LockOpen size={14} />}
        </span>

        {/* Date */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm">{fechaDisplay}</p>
          <p className="text-xs text-gray-500">
            {cierre.total_pedidos} pedidos
            {cierre.cerrado_por && ` · Cerrado por ${cierre.cerrado_por}`}
          </p>
        </div>

        {/* Quick numbers */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="text-right">
            <p className="text-xs text-gray-400">Ventas</p>
            <p className="font-medium text-green-600">${fmt(cierre.total_ventas)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Gastos</p>
            <p className="font-medium text-red-600">${fmt(cierre.total_gastos)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Resultado</p>
            <p className={clsx("font-bold", resultado >= 0 ? "text-green-700" : "text-red-700")}>
              ${fmt(cierre.resultado)}
            </p>
          </div>
        </div>

        {/* Chevron */}
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {/* Grid of details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <DetailItem icon={<DollarSign size={14} />} label="Apertura" value={`$${fmt(cierre.monto_apertura)}`} />
              <DetailItem icon={<ShoppingCart size={14} />} label="Pedidos" value={String(cierre.total_pedidos)} />
              <DetailItem icon={<Banknote size={14} />} label="Efectivo" value={`$${fmt(cierre.ventas_efectivo)}`} />
              <DetailItem icon={<ArrowRightLeft size={14} />} label="Transferencia" value={`$${fmt(cierre.ventas_transferencia)}`} />
              <DetailItem icon={<CreditCard size={14} />} label="Tarjeta" value={`$${fmt(cierre.ventas_tarjeta)}`} />
              <DetailItem icon={<TrendingDown size={14} />} label="Gastos" value={`$${fmt(cierre.total_gastos)}`} color="red" />
              <DetailItem icon={<Users size={14} />} label="Inversiones" value={`$${fmt(cierre.total_inversiones)}`} />
              <DetailItem
                icon={<CheckCircle2 size={14} />}
                label="Resultado"
                value={`$${fmt(cierre.resultado)}`}
                color={resultado >= 0 ? "green" : "red"}
                bold
              />
            </div>

            {cierre.observaciones && (
              <p className="text-xs text-gray-500 border-t pt-2">
                📝 {cierre.observaciones}
              </p>
            )}

            {/* Link to daily detail */}
            <div className="border-t pt-2">
              <Link
                href={`/dashboard/caja?fecha=${cierre.fecha}`}
                className="text-xs text-amber-700 hover:text-amber-900 font-medium"
              >
                Ver detalle completo del día →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Detail Item ── */
function DetailItem({
  icon,
  label,
  value,
  color,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className={clsx(
          "text-sm",
          bold ? "font-bold" : "font-medium",
          color === "red" ? "text-red-600" : color === "green" ? "text-green-600" : "text-gray-900"
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}
