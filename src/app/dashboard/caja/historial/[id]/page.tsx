"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { DetalleCierreResponse, GastoDiario, InversionSocio } from "@/lib/types";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Users,
  Calendar,
  Clock,
  Lock,
  Package,
  SprayCan,
  Printer,
  Receipt,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

function fmt(n: string | number): string {
  return Number(n).toFixed(2);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-blue-100 text-blue-800",
  en_preparacion: "bg-orange-100 text-orange-800",
  listo: "bg-green-100 text-green-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

export default function DetalleCierrePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<DetalleCierreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    pedidos: true,
    gastos: true,
    inversiones: true,
    productos: false,
  });

  const toggleSeccion = (key: keyof typeof seccionesAbiertas) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cierres-caja/${id}/detalle-completo/`);
      setData(res.data);
    } catch {
      toast.error("Error al cargar detalle del cierre");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const { cierre, pedidos, productos_vendidos, resumen } = data;
  const resultado = Number(resumen.resultado);
  const fechaDisplay = new Date(cierre.fecha + "T12:00:00").toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 print:px-0 print:py-2 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/caja/historial"
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📋 Detalle del Cierre de Caja
            </h1>
            <p className="text-sm text-gray-500 capitalize">{fechaDisplay}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
        >
          <Printer size={16} />
          Imprimir / PDF
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center border-b pb-3">
        <h1 className="text-xl font-bold">Reporte de Cierre de Caja</h1>
        <p className="text-sm text-gray-600 capitalize">{fechaDisplay}</p>
        {cierre.cerrado_por_nombre && (
          <p className="text-xs text-gray-500">Cerrado por: {cierre.cerrado_por_nombre}</p>
        )}
      </div>

      {/* ═══ RESUMEN GENERAL ═══ */}
      <div className="bg-white rounded-xl shadow-sm border p-5 print:shadow-none print:border print:p-3">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Receipt size={18} className="text-amber-600" />
          Resumen General
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Apertura" value={`$${fmt(resumen.monto_apertura)}`} icon={<DollarSign size={16} />} color="blue" />
          <StatCard label="Total Ventas" value={`$${fmt(resumen.total_ventas)}`} icon={<TrendingUp size={16} />} color="green" />
          <StatCard label="Total Gastos" value={`$${fmt(resumen.total_gastos)}`} icon={<TrendingDown size={16} />} color="red" />
          <StatCard
            label="Resultado"
            value={`$${fmt(resumen.resultado)}`}
            icon={<DollarSign size={16} />}
            color={resultado >= 0 ? "green" : "red"}
            bold
          />
        </div>

        {/* Desglose ventas por método */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-medium text-gray-500 mb-2">Desglose de Ventas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <MiniStat icon={<ShoppingCart size={14} />} label="Pedidos" value={String(resumen.total_pedidos)} />
            <MiniStat icon={<Banknote size={14} />} label="Efectivo" value={`$${fmt(resumen.ventas_efectivo)}`} />
            <MiniStat icon={<ArrowRightLeft size={14} />} label="Transferencia" value={`$${fmt(resumen.ventas_transferencia)}`} />
            <MiniStat icon={<CreditCard size={14} />} label="Tarjeta" value={`$${fmt(resumen.ventas_tarjeta)}`} />
          </div>
        </div>

        {/* Desglose gastos por método */}
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs font-medium text-gray-500 mb-2">Desglose de Gastos</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <MiniStat icon={<Banknote size={14} />} label="Efectivo" value={`$${fmt(resumen.gastos_efectivo)}`} />
            <MiniStat icon={<ArrowRightLeft size={14} />} label="Transferencia" value={`$${fmt(resumen.gastos_transferencia)}`} />
            <MiniStat icon={<Users size={14} />} label="Inversiones" value={`$${fmt(resumen.total_inversiones)}`} />
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-xs text-gray-500">
          {cierre.apertura_at && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> Apertura: {fmtTime(cierre.apertura_at)}
            </span>
          )}
          {cierre.cerrado_at && (
            <span className="flex items-center gap-1">
              <Lock size={12} /> Cierre: {fmtTime(cierre.cerrado_at)}
            </span>
          )}
          {cierre.cerrado_por_nombre && (
            <span>Cerrado por: <strong>{cierre.cerrado_por_nombre}</strong></span>
          )}
        </div>

        {cierre.observaciones && (
          <div className="mt-3 pt-3 border-t text-sm text-gray-600">
            📝 <strong>Observaciones:</strong> {cierre.observaciones}
          </div>
        )}
      </div>

      {/* ═══ VENTAS / PEDIDOS ═══ */}
      <CollapsibleSection
        title={`Ventas del Día (${pedidos.length} pedidos)`}
        icon={<ShoppingCart size={18} className="text-green-600" />}
        open={seccionesAbiertas.pedidos}
        onToggle={() => toggleSeccion("pedidos")}
        color="green"
      >
        {pedidos.length === 0 ? (
          <p className="text-sm text-gray-400 py-3">No hay pedidos registrados</p>
        ) : (
          <div className="divide-y">
            {pedidos.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={clsx("px-2 py-0.5 rounded-full text-[11px] font-medium", ESTADO_COLORS[p.estado] || "bg-gray-100 text-gray-600")}>
                    {p.estado_display}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      #{p.numero_pedido}
                      {p.mesa_numero && <span className="text-gray-400 ml-1">· Mesa {p.mesa_numero}</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.tipo_entrega_display} · {p.total_items} items · {fmtTime(p.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-700">${fmt(p.total)}</p>
                  {p.metodo_pago && (
                    <p className="text-[11px] text-gray-400">{p.metodo_pago.display}</p>
                  )}
                </div>
              </div>
            ))}
            {/* Subtotal */}
            <div className="py-3 flex justify-between font-semibold text-sm border-t-2">
              <span>Total Ventas</span>
              <span className="text-green-700">${fmt(resumen.total_ventas)}</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ GASTOS ═══ */}
      <CollapsibleSection
        title={`Gastos del Día (${cierre.gastos?.length || 0})`}
        icon={<TrendingDown size={18} className="text-red-600" />}
        open={seccionesAbiertas.gastos}
        onToggle={() => toggleSeccion("gastos")}
        color="red"
      >
        {!cierre.gastos?.length ? (
          <p className="text-sm text-gray-400 py-3">No hay gastos registrados</p>
        ) : (
          <div className="divide-y">
            {cierre.gastos.map((g: GastoDiario) => (
              <div key={g.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <GastoCategoryIcon categoria={g.categoria_display} />
                  <div>
                    <p className="font-medium text-gray-900">{g.descripcion}</p>
                    <p className="text-xs text-gray-500">
                      {g.categoria_display}
                      {g.subcategoria_servicio_display && ` · ${g.subcategoria_servicio_display}`}
                      {g.subcategoria_empaque_display && ` · ${g.subcategoria_empaque_display}`}
                      {g.subcategoria_limpieza_display && ` · ${g.subcategoria_limpieza_display}`}
                      {g.empleado_nomina_nombre && ` · ${g.empleado_nomina_nombre}`}
                      {g.cantidad_empaque && ` · Cant: ${g.cantidad_empaque}`}
                      {g.cantidad_limpieza && ` · ${g.cantidad_limpieza}`}
                      {g.insumo_nombre && ` · ${g.insumo_nombre}`}
                      {g.cantidad_insumo && ` (${g.cantidad_insumo} ${g.unidad_medida || ""})`}
                      {` · ${g.medio_pago_display || g.medio_pago}`}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-red-600">${fmt(g.monto)}</p>
              </div>
            ))}
            {/* Subtotal */}
            <div className="py-3 flex justify-between font-semibold text-sm border-t-2">
              <span>Total Gastos</span>
              <span className="text-red-600">${fmt(resumen.total_gastos)}</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* ═══ INVERSIONES ═══ */}
      {((cierre.inversiones?.length ?? 0) > 0 || Number(resumen.total_inversiones) > 0) && (
        <CollapsibleSection
          title={`Inversiones de Socios (${cierre.inversiones?.length || 0})`}
          icon={<Users size={18} className="text-purple-600" />}
          open={seccionesAbiertas.inversiones}
          onToggle={() => toggleSeccion("inversiones")}
          color="purple"
        >
          {!cierre.inversiones?.length ? (
            <p className="text-sm text-gray-400 py-3">No hay inversiones registradas</p>
          ) : (
            <div className="divide-y">
              {cierre.inversiones.map((inv: InversionSocio) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{inv.socio_display}</p>
                    <p className="text-xs text-gray-500">
                      {inv.categoria_display}
                      {inv.descripcion && ` · ${inv.descripcion}`}
                    </p>
                  </div>
                  <p className="font-semibold text-purple-700">${fmt(inv.monto)}</p>
                </div>
              ))}
              <div className="py-3 flex justify-between font-semibold text-sm border-t-2">
                <span>Total Inversiones</span>
                <span className="text-purple-700">${fmt(resumen.total_inversiones)}</span>
              </div>
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* ═══ PRODUCTOS VENDIDOS ═══ */}
      {productos_vendidos.length > 0 && (
        <CollapsibleSection
          title={`Productos Vendidos (${productos_vendidos.length})`}
          icon={<Package size={18} className="text-blue-600" />}
          open={seccionesAbiertas.productos}
          onToggle={() => toggleSeccion("productos")}
          color="blue"
        >
          <div className="divide-y">
            {productos_vendidos.map((p, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    ×{p.cantidad}
                  </span>
                  <span className="text-gray-900">{p.nombre}</span>
                </div>
                <span className="font-medium text-gray-700">${fmt(p.ingreso)}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ═══ RESULTADO FINAL ═══ */}
      <div className={clsx(
        "rounded-xl border-2 p-5 text-center print:shadow-none",
        resultado >= 0 ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
      )}>
        <p className="text-sm font-medium text-gray-600 mb-1">Resultado del Día</p>
        <p className={clsx("text-3xl font-bold", resultado >= 0 ? "text-green-700" : "text-red-700")}>
          ${fmt(resultado)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Apertura ${fmt(resumen.monto_apertura)} + Ventas ${fmt(resumen.total_ventas)} − Gastos ${fmt(resumen.total_gastos)} = ${fmt(resultado)}
        </p>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({
  label, value, icon, color, bold,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; bold?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className="bg-gray-50 rounded-lg p-3 print:bg-white print:border">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={clsx("p-1 rounded", colors[color])}>{icon}</span>
        <span className="text-[11px] text-gray-500">{label}</span>
      </div>
      <p className={clsx("text-lg", bold ? "font-bold" : "font-semibold",
        color === "red" && Number(value.replace(/[^0-9.-]/g, "")) < 0 ? "text-red-600" : color === "red" ? "text-red-600" : color === "green" ? "text-green-700" : "text-gray-900"
      )}>
        {value}
      </p>
    </div>
  );
}

/* ── Mini stat ── */
function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ── Collapsible Section ── */
function CollapsibleSection({
  title, icon, open, onToggle, color, children,
}: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; color: string; children: React.ReactNode;
}) {
  const borderColors: Record<string, string> = {
    green: "border-l-green-500",
    red: "border-l-red-500",
    purple: "border-l-purple-500",
    blue: "border-l-blue-500",
  };
  return (
    <div className={clsx("bg-white rounded-xl shadow-sm border border-l-4 overflow-hidden print:shadow-none print:break-inside-avoid", borderColors[color])}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition print:hover:bg-white"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          {icon}
          {title}
        </div>
        <span className="print:hidden">
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </span>
      </button>
      <div className={clsx("px-5 pb-4", open ? "block" : "hidden print:block")}>
        {children}
      </div>
    </div>
  );
}

/* ── Gasto category icon ── */
function GastoCategoryIcon({ categoria }: { categoria?: string }) {
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("empaque")) return <Package size={16} className="text-blue-500 flex-shrink-0" />;
  if (cat.includes("limpieza")) return <SprayCan size={16} className="text-green-500 flex-shrink-0" />;
  if (cat.includes("nómina") || cat.includes("personal")) return <Users size={16} className="text-purple-500 flex-shrink-0" />;
  if (cat.includes("servicio")) return <Calendar size={16} className="text-amber-500 flex-shrink-0" />;
  return <TrendingDown size={16} className="text-gray-400 flex-shrink-0" />;
}
