"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  Search,
  DollarSign,
  Percent,
  Package,
  TrendingUp,
  ChevronDown,
  Save,
  RotateCcw,
  Printer,
  Info,
  FileText,
  Edit3,
  X,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type {
  InventarioItem,
  PaginatedResponse,
  CosteoRecetaList,
  CosteoRecetaDetail,
} from "@/lib/types";
import clsx from "clsx";

/* ─── Types ─── */
interface IngredientRow {
  id: string;
  insumo_id: number | null;
  nombre: string;
  costo_unitario: number;
  cantidad: number;
  unidad: string;
}

interface ExtraCostRow {
  id: string;
  concepto: string;
  monto: number;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const emptyIngredient = (): IngredientRow => ({
  id: uid(),
  insumo_id: null,
  nombre: "",
  costo_unitario: 0,
  cantidad: 0,
  unidad: "",
});

const emptyExtra = (): ExtraCostRow => ({
  id: uid(),
  concepto: "",
  monto: 0,
});

/* ─── Component ─── */
export default function CosteoPage() {
  const { user } = useAuth();
  const canEdit = canManage(user, "costeo");
  const [nombreReceta, setNombreReceta] = useState("");
  const [porciones, setPorciones] = useState(1);
  const [ingredientes, setIngredientes] = useState<IngredientRow[]>([
    emptyIngredient(),
  ]);
  const [extras, setExtras] = useState<ExtraCostRow[]>([
    { id: uid(), concepto: "Empaque", monto: 0 },
    { id: uid(), concepto: "Mano de obra", monto: 0 },
  ]);
  const [porcentajeUtilidad, setPorcentajeUtilidad] = useState(30);
  const [porcentajeCostoFijo, setPorcentajeCostoFijo] = useState(40);

  /* ── Inventory search ── */
  const [insumos, setInsumos] = useState<InventarioItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLTableCellElement>(null);

  /* ── Saved recipes ── */
  const [recetasGuardadas, setRecetasGuardadas] = useState<CosteoRecetaList[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRecetas, setShowRecetas] = useState(false);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load inventory items
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<PaginatedResponse<InventarioItem>>(
          "/inventario-items/?is_active=true&page_size=200"
        );
        setInsumos(data.results);
      } catch {
        /* ignore — user might not have permission */
      }
    };
    load();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredInsumos = insumos.filter((i) =>
    i.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Load saved recipes ── */
  const loadRecetasGuardadas = useCallback(async () => {
    setLoadingRecetas(true);
    try {
      const { data } = await api.get<PaginatedResponse<CosteoRecetaList>>(
        "/costeo-recetas/?page_size=100"
      );
      setRecetasGuardadas(data.results);
    } catch {
      /* ignore */
    } finally {
      setLoadingRecetas(false);
    }
  }, []);

  useEffect(() => {
    loadRecetasGuardadas();
  }, [loadRecetasGuardadas]);

  /* ── Save / Update recipe ── */
  const handleSave = async () => {
    if (!nombreReceta.trim()) {
      alert("Ingresa un nombre para la receta antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: nombreReceta,
        porciones,
        porcentaje_utilidad: porcentajeUtilidad,
        porcentaje_costo_fijo: porcentajeCostoFijo,
        notas: "",
        ingredientes: ingredientes
          .filter((i) => i.nombre.trim())
          .map((i) => ({
            insumo: i.insumo_id || null,
            nombre: i.nombre,
            costo_unitario: i.costo_unitario,
            cantidad: i.cantidad,
            unidad: i.unidad,
          })),
        extras: extras
          .filter((e) => e.concepto.trim())
          .map((e) => ({
            concepto: e.concepto,
            monto: e.monto,
          })),
      };

      if (editingId) {
        await api.put(`/costeo-recetas/${editingId}/`, payload);
        setSuccessMsg("Receta actualizada correctamente");
      } else {
        const { data } = await api.post("/costeo-recetas/", payload);
        setEditingId(data.id);
        setSuccessMsg("Receta guardada correctamente");
      }
      loadRecetasGuardadas();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Error al guardar la receta.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Load a recipe into the form ── */
  const handleLoadReceta = async (id: number) => {
    try {
      const { data } = await api.get<CosteoRecetaDetail>(
        `/costeo-recetas/${id}/`
      );
      setNombreReceta(data.nombre);
      setPorciones(data.porciones);
      setPorcentajeUtilidad(parseFloat(data.porcentaje_utilidad));
      setPorcentajeCostoFijo(parseFloat(data.porcentaje_costo_fijo));
      setIngredientes(
        data.ingredientes.length > 0
          ? data.ingredientes.map((i) => ({
              id: uid(),
              insumo_id: i.insumo ?? null,
              nombre: i.nombre,
              costo_unitario: parseFloat(String(i.costo_unitario)),
              cantidad: parseFloat(String(i.cantidad)),
              unidad: i.unidad,
            }))
          : [emptyIngredient()]
      );
      setExtras(
        data.extras.length > 0
          ? data.extras.map((e) => ({
              id: uid(),
              concepto: e.concepto,
              monto: parseFloat(String(e.monto)),
            }))
          : [emptyExtra()]
      );
      setEditingId(data.id);
      setShowRecetas(false);
    } catch {
      alert("Error al cargar la receta.");
    }
  };

  /* ── Delete a recipe ── */
  const handleDeleteReceta = async (id: number) => {
    if (!confirm("¿Eliminar esta receta permanentemente?")) return;
    try {
      await api.delete(`/costeo-recetas/${id}/`);
      if (editingId === id) {
        setEditingId(null);
      }
      loadRecetasGuardadas();
    } catch {
      alert("Error al eliminar la receta.");
    }
  };

  /* ── Calculations ── */
  const totalIngredientes = ingredientes.reduce(
    (sum, i) => sum + i.costo_unitario * i.cantidad,
    0
  );
  const totalExtras = extras.reduce((sum, e) => sum + e.monto, 0);
  const costoTotal = totalIngredientes + totalExtras;
  const costoFijo = costoTotal * (porcentajeCostoFijo / 100);
  const costoTotalConFijo = costoTotal + costoFijo;
  const costoPorPorcion = porciones > 0 ? costoTotalConFijo / porciones : 0;

  // PV = Costo / (1 - %utilidad)
  const precioVenta =
    porcentajeUtilidad < 100
      ? costoPorPorcion / (1 - porcentajeUtilidad / 100)
      : 0;
  const utilidadNeta = precioVenta - costoPorPorcion;
  const margenReal =
    precioVenta > 0 ? ((precioVenta - costoPorPorcion) / precioVenta) * 100 : 0;

  /* ── Handlers ── */
  const updateIngredient = (
    id: string,
    field: keyof IngredientRow,
    value: string | number | null
  ) => {
    setIngredientes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const selectInsumo = (rowId: string, insumo: InventarioItem) => {
    setIngredientes((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              insumo_id: insumo.id,
              nombre: insumo.nombre,
              costo_unitario: parseFloat(insumo.costo_unitario),
              unidad: insumo.unidad_abreviatura || "",
            }
          : r
      )
    );
    setActiveDropdown(null);
    setSearchQuery("");
  };

  const addIngredient = () =>
    setIngredientes((prev) => [...prev, emptyIngredient()]);
  const removeIngredient = (id: string) =>
    setIngredientes((prev) => prev.filter((r) => r.id !== id));

  const updateExtra = (
    id: string,
    field: keyof ExtraCostRow,
    value: string | number
  ) => {
    setExtras((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const addExtra = () => setExtras((prev) => [...prev, emptyExtra()]);
  const removeExtra = (id: string) =>
    setExtras((prev) => prev.filter((r) => r.id !== id));

  const resetAll = () => {
    setNombreReceta("");
    setPorciones(1);
    setIngredientes([emptyIngredient()]);
    setExtras([
      { id: uid(), concepto: "Empaque", monto: 0 },
      { id: uid(), concepto: "Mano de obra", monto: 0 },
    ]);
    setPorcentajeUtilidad(30);
    setPorcentajeCostoFijo(40);
    setEditingId(null);
  };

  const fmt = (n: number) =>
    n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* ── Success toast ── */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <Save className="h-4 w-4" />
          {successMsg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-7 w-7 text-brand-gold" />
            Costeo de Recetas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Calcula el precio de venta usando la fórmula: PV = Costo ÷ (1 − %
            Utilidad)
          </p>
          {editingId && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full font-medium">
                <Edit3 className="h-3 w-3" />
                Editando: {nombreReceta || "Sin nombre"}
              </span>
              <button
                onClick={resetAll}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Nueva receta
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowRecetas(!showRecetas); if (!showRecetas) loadRecetasGuardadas(); }}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Mis Recetas
            {recetasGuardadas.length > 0 && (
              <span className="bg-brand-gold text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {recetasGuardadas.length}
              </span>
            )}
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving || !nombreReceta.trim()}
              className={clsx(
                "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                nombreReceta.trim()
                  ? "bg-brand-gold text-white hover:bg-brand-bronze shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "Actualizar" : "Guardar"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            onClick={resetAll}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* ── Saved recipes panel ── */}
      {showRecetas && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-gold" />
              Recetas Guardadas
            </h2>
            <button
              onClick={() => setShowRecetas(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {loadingRecetas ? (
            <div className="p-8 text-center text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              Cargando recetas...
            </div>
          ) : recetasGuardadas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tienes recetas guardadas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {recetasGuardadas.map((r) => (
                <div
                  key={r.id}
                  className={clsx(
                    "flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors group",
                    editingId === r.id && "bg-brand-gold/5 border-l-2 border-brand-gold"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {r.nombre}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span>Costo: ${parseFloat(r.costo_total).toFixed(2)}</span>
                      <span>PV: ${parseFloat(r.precio_venta).toFixed(2)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(r.updated_at).toLocaleDateString("es-EC")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLoadReceta(r.id)}
                      className="px-2.5 py-1.5 rounded-md bg-brand-gold/10 text-brand-gold text-xs font-medium hover:bg-brand-gold/20 flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      Editar
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteReceta(r.id)}
                        className="p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Recipe name + portions ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Receta / Producto
            </label>
            <input
              type="text"
              value={nombreReceta}
              onChange={(e) => setNombreReceta(e.target.value)}
              placeholder="Ej: Margot Smash Burger"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº Porciones que rinde
            </label>
            <input
              type="number"
              min={1}
              value={porciones}
              onChange={(e) => setPorciones(Math.max(1, +e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Ingredients Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-brand-gold" />
            Ingredientes / Insumos
          </h2>
          <button
            onClick={addIngredient}
            className="px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium w-[35%]">
                  Artículo
                </th>
                <th className="px-4 py-3 text-right font-medium w-[18%]">
                  Costo Unit.
                </th>
                <th className="px-4 py-3 text-center font-medium w-[12%]">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-center font-medium w-[10%]">
                  Unidad
                </th>
                <th className="px-4 py-3 text-right font-medium w-[18%]">
                  Total
                </th>
                <th className="px-4 py-3 w-[7%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ingredientes.map((row) => {
                const total = row.costo_unitario * row.cantidad;
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 group">
                    {/* Artículo with autocomplete */}
                    <td className="px-4 py-2 relative" ref={activeDropdown === row.id ? dropdownRef : undefined}>
                      <div className="relative">
                        <input
                          type="text"
                          value={
                            activeDropdown === row.id ? searchQuery : row.nombre
                          }
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (activeDropdown !== row.id)
                              setActiveDropdown(row.id);
                            updateIngredient(row.id, "nombre", e.target.value);
                          }}
                          onFocus={() => {
                            setActiveDropdown(row.id);
                            setSearchQuery(row.nombre);
                          }}
                          placeholder="Buscar insumo..."
                          className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                        />
                        {activeDropdown === row.id &&
                          filteredInsumos.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {filteredInsumos.slice(0, 15).map((insumo) => (
                                <button
                                  key={insumo.id}
                                  type="button"
                                  onClick={() => selectInsumo(row.id, insumo)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-brand-gold/10 flex items-center justify-between gap-2 transition-colors"
                                >
                                  <span className="font-medium text-gray-800 truncate">
                                    {insumo.nombre}
                                  </span>
                                  <span className="text-xs text-gray-400 flex-shrink-0">
                                    ${fmt(parseFloat(insumo.costo_unitario))}{" "}
                                    / {insumo.unidad_abreviatura}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </td>

                    {/* Costo unitario */}
                    <td className="px-4 py-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.costo_unitario || ""}
                          onChange={(e) =>
                            updateIngredient(
                              row.id,
                              "costo_unitario",
                              +e.target.value
                            )
                          }
                          className="w-full pl-6 pr-2 py-1.5 rounded-md border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                        />
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.001"
                        min={0}
                        value={row.cantidad || ""}
                        onChange={(e) =>
                          updateIngredient(row.id, "cantidad", +e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                      />
                    </td>

                    {/* Unidad */}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.unidad}
                        onChange={(e) =>
                          updateIngredient(row.id, "unidad", e.target.value)
                        }
                        placeholder="ud"
                        className="w-full px-2 py-1.5 rounded-md border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                      />
                    </td>

                    {/* Total */}
                    <td className="px-4 py-2 text-right font-medium text-gray-800">
                      <span
                        className={clsx(
                          "inline-block min-w-[4rem]",
                          total > 0 && "text-brand-dark"
                        )}
                      >
                        ${fmt(total)}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-2 text-center">
                      {ingredientes.length > 1 && (
                        <button
                          onClick={() => removeIngredient(row.id)}
                          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td colSpan={4} className="px-4 py-3 text-right text-gray-600">
                  Total Ingredientes
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  ${fmt(totalIngredientes)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Extra Costs ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-brand-gold" />
            Costos Adicionales
          </h2>
          <button
            onClick={addExtra}
            className="px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-medium w-[65%]">
                  Concepto
                </th>
                <th className="px-4 py-3 text-right font-medium w-[28%]">
                  Monto
                </th>
                <th className="px-4 py-3 w-[7%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extras.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={row.concepto}
                      onChange={(e) =>
                        updateExtra(row.id, "concepto", e.target.value)
                      }
                      placeholder="Ej: Empaque, Gas, Mano de obra"
                      className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={row.monto || ""}
                        onChange={(e) =>
                          updateExtra(row.id, "monto", +e.target.value)
                        }
                        className="w-full pl-6 pr-2 py-1.5 rounded-md border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeExtra(row.id)}
                      className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3 text-right text-gray-600">
                  Total Costos Adicionales
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  ${fmt(totalExtras)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Utility % Slider + Summary Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Slider */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5 text-brand-gold" />
            % Utilidad Deseada
          </h3>
          <div className="space-y-4">
            <input
              type="range"
              min={5}
              max={80}
              step={1}
              value={porcentajeUtilidad}
              onChange={(e) => setPorcentajeUtilidad(+e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-gold"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">5%</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={porcentajeUtilidad}
                  onChange={(e) =>
                    setPorcentajeUtilidad(
                      Math.min(99, Math.max(1, +e.target.value))
                    )
                  }
                  className="w-16 px-2 py-1 rounded-md border border-gray-200 text-sm text-center font-bold text-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                />
                <span className="text-sm font-medium text-gray-500">%</span>
              </div>
              <span className="text-xs text-gray-400">80%</span>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {[20, 25, 30, 35, 40, 50, 60].map((p) => (
                <button
                  key={p}
                  onClick={() => setPorcentajeUtilidad(p)}
                  className={clsx(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    porcentajeUtilidad === p
                      ? "bg-brand-gold text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Formula */}
          <div className="mt-6 p-4 bg-brand-sage/30 rounded-lg border border-brand-sage">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-brand-bronze mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-semibold text-brand-dark mb-1">Fórmula:</p>
                <p className="font-mono text-[11px] bg-white/60 rounded px-2 py-1">
                  PV = Costo ÷ (1 − {porcentajeUtilidad / 100})
                </p>
                <p className="font-mono text-[11px] bg-white/60 rounded px-2 py-1 mt-1">
                  PV = ${fmt(costoPorPorcion)} ÷{" "}
                  {(1 - porcentajeUtilidad / 100).toFixed(2)} ={" "}
                  <span className="font-bold text-brand-gold">
                    ${fmt(precioVenta)}
                  </span>
                </p>
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Costo por porción incluye costo fijo ({porcentajeCostoFijo}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results Summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-gold" />
              Resumen de Costos
              {nombreReceta && (
                <span className="text-brand-bronze font-normal">
                  — {nombreReceta}
                </span>
              )}
            </h3>

            <div className="space-y-3">
              {/* Row: Total Ingredientes */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">
                  Total Ingredientes
                </span>
                <span className="text-sm font-medium text-gray-800">
                  ${fmt(totalIngredientes)}
                </span>
              </div>

              {/* Row: Costos Adicionales */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">
                  Costos Adicionales
                </span>
                <span className="text-sm font-medium text-gray-800">
                  ${fmt(totalExtras)}
                </span>
              </div>

              <div className="border-t border-gray-200" />

              {/* Row: Costo Total */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold text-gray-800">
                  Costo Total de la Receta
                </span>
                <span className="text-sm font-bold text-gray-900">
                  ${fmt(costoTotal)}
                </span>
              </div>

              {/* Row: Costo Fijo */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Costo Fijo</span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md px-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={porcentajeCostoFijo}
                      onChange={(e) =>
                        setPorcentajeCostoFijo(
                          Math.min(100, Math.max(0, +e.target.value))
                        )
                      }
                      className="w-12 px-1 py-0.5 bg-transparent text-xs text-center font-medium text-gray-700 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  ${fmt(costoFijo)}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              {/* Row: PVP (Costo Total + Costo Fijo) */}
              <div className="flex items-center justify-between py-2 bg-brand-gold/5 -mx-6 px-6 rounded">
                <span className="text-sm font-bold text-brand-dark">
                  PVP Receta (Costo + Fijo)
                </span>
                <span className="text-sm font-bold text-brand-dark">
                  ${fmt(costoTotalConFijo)}
                </span>
              </div>

              {/* Row: Costo por porción */}
              {porciones > 1 && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">
                    Costo por Porción ({porciones} porciones)
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    ${fmt(costoPorPorcion)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200" />

              {/* Row: % Utilidad */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">% Utilidad</span>
                <span className="text-sm font-medium text-brand-gold">
                  {porcentajeUtilidad}%
                </span>
              </div>

              {/* Row: Utilidad Neta */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">
                  Utilidad Neta por Porción
                </span>
                <span className="text-sm font-medium text-green-600">
                  ${fmt(utilidadNeta)}
                </span>
              </div>
            </div>
          </div>

          {/* PVP Card */}
          <div className="bg-gradient-to-br from-brand-dark to-gray-900 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-1">
                  Precio de Venta Sugerido
                </p>
                <p className="text-4xl font-bold tracking-tight">
                  <span className="text-brand-gold">$</span>
                  {fmt(precioVenta)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Margen real: {margenReal.toFixed(1)}% · Ganancia: $
                  {fmt(utilidadNeta)} por unidad
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2">
                <div className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium">
                  Costo: ${fmt(costoPorPorcion)}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium">
                  +${fmt(utilidadNeta)} utilidad
                </div>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                <div
                  className="bg-red-400/80 transition-all duration-300"
                  style={{
                    width:
                      precioVenta > 0
                        ? `${(costoPorPorcion / precioVenta) * 100}%`
                        : "0%",
                  }}
                  title={`Costo: ${fmt(costoPorPorcion)}`}
                />
                <div
                  className="bg-green-400/80 transition-all duration-300"
                  style={{
                    width:
                      precioVenta > 0
                        ? `${(utilidadNeta / precioVenta) * 100}%`
                        : "0%",
                  }}
                  title={`Utilidad: ${fmt(utilidadNeta)}`}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
                <span>Costo ({(100 - margenReal).toFixed(0)}%)</span>
                <span>Utilidad ({margenReal.toFixed(0)}%)</span>
              </div>
            </div>
          </div>

          {/* Quick comparison table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Tabla Comparativa de Utilidades
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-2 text-left font-medium">% Utilidad</th>
                    <th className="py-2 text-right font-medium">PV Sugerido</th>
                    <th className="py-2 text-right font-medium">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[20, 25, 30, 35, 40, 50, 60].map((p) => {
                    const pv = costoPorPorcion / (1 - p / 100);
                    const gain = pv - costoPorPorcion;
                    const isActive = p === porcentajeUtilidad;
                    return (
                      <tr
                        key={p}
                        className={clsx(
                          "cursor-pointer transition-colors",
                          isActive
                            ? "bg-brand-gold/10 font-semibold"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => setPorcentajeUtilidad(p)}
                      >
                        <td className="py-2">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1",
                              isActive && "text-brand-gold"
                            )}
                          >
                            {p}%
                            {isActive && (
                              <span className="text-[9px] bg-brand-gold text-white px-1 py-0.5 rounded">
                                actual
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 text-right">${fmt(pv)}</td>
                        <td className="py-2 text-right text-green-600">
                          +${fmt(gain)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
