"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  BarChart3,
  TrendingUp,
  Hash,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ── Chart colors matching brand ── */
const CHART_COLORS = [
  "#CC9910", "#C37C13", "#D7E0D9", "#2F353B", "#E5B84D",
  "#A86610", "#B8CFC0", "#4A5058", "#F0D080", "#7A5510",
];

const CHART_TABS = [
  { label: "Cantidad vendida", value: "cantidad" as const },
  { label: "Ingresos ($)", value: "ingreso" as const },
];

/* ── Types ── */
interface ProductoStat {
  id: number;
  name: string;
  price: string;
  image: string | null;
  category_name: string;
  total_cantidad: number;
  total_ingreso: string;
}

interface EstadisticasData {
  resumen: {
    total_pedidos: number;
    total_items_vendidos: number;
    total_ingresos: string;
  };
  por_cantidad: ProductoStat[];
  por_ingreso: ProductoStat[];
}

/* ── Medal icons by rank ── */
const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

/* ── Preset periods ── */
const PERIODOS = [
  { label: "Hoy", value: "hoy" },
  { label: "Esta semana", value: "semana" },
  { label: "Este mes", value: "mes" },
  { label: "Todo", value: "todo" },
  { label: "Personalizado", value: "custom" },
];

function getDateRange(periodo: string): { desde: string; hasta: string } | null {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (periodo) {
    case "hoy":
      return { desde: fmt(now), hasta: fmt(now) };
    case "semana": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Sunday
      return { desde: fmt(start), hasta: fmt(now) };
    }
    case "mes": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { desde: fmt(start), hasta: fmt(now) };
    }
    case "todo":
      return null;
    default:
      return null;
  }
}

export default function EstadisticasPage() {
  const [data, setData] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [customDesde, setCustomDesde] = useState("");
  const [customHasta, setCustomHasta] = useState("");
  const [limit, setLimit] = useState(10);
  const [chartTab, setChartTab] = useState<"cantidad" | "ingreso">("cantidad");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit };
      const range =
        periodo === "custom"
          ? customDesde && customHasta
            ? { desde: customDesde, hasta: customHasta }
            : null
          : getDateRange(periodo);
      if (range) {
        params.desde = range.desde;
        params.hasta = range.hasta;
      }
      const { data: res } = await api.get("/pedidos/estadisticas_productos/", { params });
      setData(res);
    } catch {
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  }, [periodo, customDesde, customHasta, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Estadísticas de Productos</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Productos más vendidos por cantidad y por ingresos</p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-gold" />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Período:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  periodo === p.value
                    ? "bg-brand-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodo === "custom" && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={customDesde}
                onChange={(e) => setCustomDesde(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="date"
                value={customHasta}
                onChange={(e) => setCustomHasta(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="min-h-[30vh]" />
      ) : !data ? (
        <p className="text-center text-gray-400 py-16">No se pudieron cargar las estadísticas</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <SummaryCard
              title="Total Pedidos"
              value={data.resumen.total_pedidos.toLocaleString("es-ES")}
              icon={ShoppingCart}
              color="bg-blue-500"
            />
            <SummaryCard
              title="Items Vendidos"
              value={data.resumen.total_items_vendidos.toLocaleString("es-ES")}
              icon={Package}
              color="bg-green-500"
            />
            <SummaryCard
              title="Ingresos Totales"
              value={`$${parseFloat(data.resumen.total_ingresos).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              color="bg-brand-gold"
            />
          </div>

          {/* ── Chart ── */}
          <ProductChart
            porCantidad={data.por_cantidad}
            porIngreso={data.por_ingreso}
            activeTab={chartTab}
            onTabChange={setChartTab}
          />

          {/* Two-column ranking tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Quantity */}
            <RankingTable
              title="Más Vendidos por Cantidad"
              subtitle="Productos con mayor número de unidades vendidas"
              icon={Hash}
              items={data.por_cantidad}
              valueKey="cantidad"
            />

            {/* By Revenue */}
            <RankingTable
              title="Más Vendidos por Ingresos"
              subtitle="Productos que generan mayor ingreso"
              icon={DollarSign}
              items={data.por_ingreso}
              valueKey="ingreso"
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ── Product Chart ── */
function ProductChart({
  porCantidad,
  porIngreso,
  activeTab,
  onTabChange,
}: {
  porCantidad: ProductoStat[];
  porIngreso: ProductoStat[];
  activeTab: "cantidad" | "ingreso";
  onTabChange: (tab: "cantidad" | "ingreso") => void;
}) {
  const items = activeTab === "cantidad" ? porCantidad : porIngreso;

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900">Gráfica de Productos</h3>
        <p className="text-center text-gray-400 py-12">No hay datos para graficar</p>
      </div>
    );
  }

  const chartData = items.map((item) => ({
    name: item.name.length > 18 ? item.name.slice(0, 16) + "…" : item.name,
    fullName: item.name,
    category: item.category_name,
    value:
      activeTab === "cantidad"
        ? item.total_cantidad
        : parseFloat(item.total_ingreso),
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Chart header with tab toggle */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand-gold" />
          <h3 className="text-lg font-semibold text-gray-900">Gráfica de Productos</h3>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {CHART_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="px-4 py-6">
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              angle={-35}
              textAnchor="end"
              interval={0}
              height={70}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickFormatter={(v: number) =>
                activeTab === "ingreso"
                  ? `$${v.toLocaleString("es-ES")}`
                  : v.toLocaleString("es-ES")
              }
            />
            <Tooltip
              cursor={{ fill: "rgba(204, 153, 16, 0.08)" }}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                fontSize: 13,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [
                activeTab === "ingreso"
                  ? `$${Number(value).toLocaleString("es-ES", { minimumFractionDigits: 2 })}`
                  : Number(value).toLocaleString("es-ES"),
                activeTab === "ingreso" ? "Ingresos" : "Unidades vendidas",
              ]}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              labelFormatter={(_label: any, payload: readonly any[]) => {
                const entry = payload?.[0]?.payload;
                return entry ? `${entry.fullName} — ${entry.category}` : _label;
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {chartData.map((_entry, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Summary Card ── */
function SummaryCard({ title, value, icon: Icon, color }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-5 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-4">
      <div className={`h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-[10px] sm:text-sm text-gray-500">{title}</p>
        <p className="text-base sm:text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

/* ── Ranking Table ── */
function RankingTable({ title, subtitle, icon: Icon, items, valueKey }: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  items: ProductoStat[];
  valueKey: "cantidad" | "ingreso";
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-center text-gray-400 py-12">No hay datos para el período seleccionado</p>
      </div>
    );
  }

  const maxValue =
    valueKey === "cantidad"
      ? Math.max(...items.map((i) => i.total_cantidad))
      : Math.max(...items.map((i) => parseFloat(i.total_ingreso)));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-brand-gold" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {items.map((item, idx) => {
          const value =
            valueKey === "cantidad"
              ? item.total_cantidad
              : parseFloat(item.total_ingreso);
          const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const RankIcon = rankIcons[idx] || null;
          const rankColor = rankColors[idx] || "text-gray-400";

          return (
            <div key={item.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              {/* Rank */}
              <div className="w-8 flex-shrink-0 flex items-center justify-center">
                {RankIcon ? (
                  <RankIcon className={`h-5 w-5 ${rankColor}`} />
                ) : (
                  <span className="text-sm font-bold text-gray-300">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Image */}
              <div className="h-10 w-10 rounded-lg bg-brand-sage flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-brand-sage-dark" />
                  </div>
                )}
              </div>

              {/* Name & Category */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{item.category_name} · ${item.price}</p>
                {/* Bar */}
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gold rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Value */}
              <div className="text-right flex-shrink-0">
                {valueKey === "cantidad" ? (
                  <p className="text-sm font-bold text-gray-900">{item.total_cantidad}</p>
                ) : (
                  <p className="text-sm font-bold text-brand-gold">
                    ${parseFloat(item.total_ingreso).toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {valueKey === "cantidad" ? "unidades" : "ingresos"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
