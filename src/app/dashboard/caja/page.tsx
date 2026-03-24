"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { ResumenDia, GastoDiario, InversionSocio, InventarioItem, CategoriaInsumo, UnidadMedida, CategoriaGasto, SocioCatalog, CategoriaInversion, ProductoVendido } from "@/lib/types";
import Link from "next/link";
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
  CheckCircle2,
  Banknote,
  ArrowRightLeft,
  CreditCard,
  Users,
  Pencil,
  History,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

const MEDIOS_PAGO_GASTO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CajaDiariaPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_staff === true;
  const [fecha, setFecha] = useState(today());
  const [data, setData] = useState<ResumenDia | null>(null);
  const [loading, setLoading] = useState(true);

  /* Cierre de caja / apertura */
  const [montoApertura, setMontoApertura] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [savingCaja, setSavingCaja] = useState(false);

  /* Ajuste transferencia (solo superadmin) */
  const [editingTransferencia, setEditingTransferencia] = useState(false);
  const [ajusteTransferencia, setAjusteTransferencia] = useState("");
  const [savingAjuste, setSavingAjuste] = useState(false);

  /* Gastos */
  const [gastosOpen, setGastosOpen] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [gastoCategoria, setGastoCategoria] = useState<number>(0);
  const [gastoMedioPago, setGastoMedioPago] = useState("efectivo");
  const [gastoMonto, setGastoMonto] = useState("");
  const [savingGasto, setSavingGasto] = useState(false);

  /* Insumos (vinculación con inventario) */
  const [insumos, setInsumos] = useState<InventarioItem[]>([]);
  const [categoriasInsumo, setCategoriasInsumo] = useState<CategoriaInsumo[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [gastoArea, setGastoArea] = useState<"cocina" | "barra">("cocina");
  const [gastoInsumo, setGastoInsumo] = useState<string>("");
  const [gastoUnidades, setGastoUnidades] = useState("");
  const [gastoPesoUnidad, setGastoPesoUnidad] = useState("");
  const [gastoUnidadCompra, setGastoUnidadCompra] = useState("kg");

  /* Crear nuevo insumo inline */
  const [creandoInsumo, setCreandoInsumo] = useState(false);
  const [nuevoInsumoNombre, setNuevoInsumoNombre] = useState("");
  const [nuevoInsumoCategoria, setNuevoInsumoCategoria] = useState("");
  const [nuevoInsumoUnidad, setNuevoInsumoUnidad] = useState("");
  const [savingNuevoInsumo, setSavingNuevoInsumo] = useState(false);

  /* Inversiones */
  const [inversionesOpen, setInversionesOpen] = useState(false);
  const [showInversionForm, setShowInversionForm] = useState(false);
  const [inversionSocio, setInversionSocio] = useState<number>(0);
  const [inversionMonto, setInversionMonto] = useState("");
  const [inversionDesc, setInversionDesc] = useState("");
  const [inversionCategoria, setInversionCategoria] = useState<number>(0);
  const [savingInversion, setSavingInversion] = useState(false);

  /* Pedidos expand */
  const [pedidosOpen, setPedidosOpen] = useState(true);
  const [productosOpen, setProductosOpen] = useState(false);

  /* Cierre de caja */
  const [closingCaja, setClosingCaja] = useState(false);
  const [showConfirmCierre, setShowConfirmCierre] = useState(false);

  /* Catálogos dinámicos */
  const [categoriasGasto, setCategoriasGasto] = useState<CategoriaGasto[]>([]);
  const [socios, setSocios] = useState<SocioCatalog[]>([]);
  const [categoriasInversion, setCategoriasInversion] = useState<CategoriaInversion[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cierres-caja/resumen_dia/?fecha=${fecha}`);
      setData(res.data);
      if (res.data.cierre_caja) {
        setMontoApertura(res.data.cierre_caja.monto_apertura);
        setObservaciones(res.data.cierre_caja.observaciones || "");
        setAjusteTransferencia(res.data.cierre_caja.ajuste_transferencia ?? "");
      } else {
        setMontoApertura("");
        setObservaciones("");
        setAjusteTransferencia("");
      }
      setEditingTransferencia(false);
    } catch {
      toast.error("Error al cargar datos del día");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* Cargar catálogos dinámicos */
  useEffect(() => {
    Promise.all([
      api.get("/categorias-gasto/"),
      api.get("/socios/"),
      api.get("/categorias-inversion/"),
    ]).then(([cgRes, sRes, ciRes]) => {
      const cg: CategoriaGasto[] = cgRes.data;
      const sc: SocioCatalog[] = sRes.data;
      const ci: CategoriaInversion[] = ciRes.data;
      setCategoriasGasto(cg);
      setSocios(sc);
      setCategoriasInversion(ci);
      const otrosGasto = cg.find(c => c.nombre.toLowerCase() === "otros");
      if (otrosGasto) setGastoCategoria(otrosGasto.id);
      else if (cg.length > 0) setGastoCategoria(cg[0].id);
      const otrosInv = ci.find(c => c.nombre.toLowerCase() === "otros");
      if (otrosInv) setInversionCategoria(otrosInv.id);
      else if (ci.length > 0) setInversionCategoria(ci[0].id);
    }).catch(() => {});
  }, []);

  /* Derivar si la categoría seleccionada es "Insumos" */
  const selectedGastoCategoria = categoriasGasto.find(c => c.id === gastoCategoria);
  const isInsumoCategory = selectedGastoCategoria?.nombre?.toLowerCase().startsWith("insumo") ?? false;

  /* Cargar insumos, categorías y unidades cuando se elige "insumos" */
  useEffect(() => {
    if (isInsumoCategory) {
      api.get(`/inventario/?is_active=true&ordering=nombre&page_size=200`)
        .then((res) => setInsumos(res.data?.results ?? res.data ?? []))
        .catch(() => setInsumos([]));
      api.get(`/categorias-insumo/?ordering=nombre`)
        .then((res) => setCategoriasInsumo(res.data?.results ?? res.data ?? []))
        .catch(() => setCategoriasInsumo([]));
      api.get(`/unidades-medida/?ordering=nombre`)
        .then((res) => setUnidadesMedida(res.data?.results ?? res.data ?? []))
        .catch(() => setUnidadesMedida([]));
    }
  }, [isInsumoCategory]);

  /* Insumos filtrados por área seleccionada */
  const insumosFiltrados = insumos.filter(
    (i) => i.categoria_area === gastoArea
  );

  /* Insumo seleccionado */
  const selectedInsumo = insumos.find((i) => i.id === Number(gastoInsumo));
  const isUnitBased = selectedInsumo
    ? selectedInsumo.unidad !== "g" && selectedInsumo.unidad !== "ml"
    : false;

  /* Cálculos de conversión para insumos */
  const unidades = Number(gastoUnidades) || 0;
  const pesoUnidad = Number(gastoPesoUnidad) || 0;
  const unidadCompra = gastoUnidadCompra;

  // Para items por unidad: unidades (cajas) × cantidad por caja = total unidades
  // Para items por peso: unidades × peso por unidad → conversión a base
  let cantidadEnBase = 0;
  let unidadBase = "";
  let totalDisplay = 0;

  if (selectedInsumo) {
    unidadBase = selectedInsumo.unidad ?? "";
    if (isUnitBased) {
      // Barra / unidades: cajas × unids_por_caja = total und
      totalDisplay = unidades * pesoUnidad;
      cantidadEnBase = totalDisplay;
    } else {
      const pesoTotal = unidades * pesoUnidad;
      totalDisplay = pesoTotal;
      if (unidadCompra === "kg" && unidadBase === "g") {
        cantidadEnBase = pesoTotal * 1000;
      } else if (unidadCompra === "lb" && unidadBase === "g") {
        cantidadEnBase = pesoTotal * 453.592;
      } else if (unidadCompra === "L" && unidadBase === "ml") {
        cantidadEnBase = pesoTotal * 1000;
      } else {
        cantidadEnBase = pesoTotal;
      }
    }
  }
  const porciones100 = !isUnitBased && (unidadBase === "g" || unidadBase === "ml")
    ? Math.floor(cantidadEnBase / 100)
    : 0;

  /* ── Guardar / Crear cierre de caja ── */
  const handleSaveCaja = async () => {
    if (montoApertura === "" || isNaN(Number(montoApertura)) || Number(montoApertura) < 0) {
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

  /* ── Guardar ajuste de transferencia (superadmin) ── */
  const handleSaveAjusteTransferencia = async () => {
    if (!data?.cierre_caja) return;
    setSavingAjuste(true);
    try {
      const value = ajusteTransferencia === "" ? null : ajusteTransferencia;
      await api.patch(`/cierres-caja/${data.cierre_caja.id}/ajuste_transferencia/`, {
        ajuste_transferencia: value,
      });
      toast.success(value === null ? "Ajuste eliminado" : "Transferencia ajustada");
      setEditingTransferencia(false);
      fetchData();
    } catch {
      toast.error("Error al guardar el ajuste");
    } finally {
      setSavingAjuste(false);
    }
  };

  /* ── Agregar gasto ── */
  const handleAddGasto = async () => {
    if (!data?.cierre_caja) {
      toast.error("Primero debe crear la caja del día (guardar apertura)");
      return;
    }

    // Validar monto
    if (!gastoMonto || isNaN(Number(gastoMonto)) || Number(gastoMonto) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }

    // Si es insumo, validar que haya insumo seleccionado y datos de compra
    if (isInsumoCategory && gastoInsumo) {
      if (!gastoUnidades || Number(gastoUnidades) <= 0) {
        toast.error("Ingrese la cantidad de unidades compradas");
        return;
      }
      if (!gastoPesoUnidad || Number(gastoPesoUnidad) <= 0) {
        toast.error(isUnitBased ? "Ingrese las unidades por caja" : "Ingrese el peso por unidad");
        return;
      }
    }

    // Auto-generar descripción
    const catLabel = selectedGastoCategoria?.nombre ?? "";
    let descripcion = catLabel;
    if (isInsumoCategory && selectedInsumo) {
      if (isUnitBased) {
        descripcion = `${selectedInsumo.nombre} — ${unidades} cajas × ${pesoUnidad} und = ${cantidadEnBase} und`;
      } else {
        const pesoTotal = unidades * pesoUnidad;
        descripcion = `${selectedInsumo.nombre} — ${unidades} uds × ${pesoUnidad} ${unidadCompra} = ${pesoTotal.toFixed(2)} ${unidadCompra}`;
      }
    }

    setSavingGasto(true);
    try {
      const payload: Record<string, unknown> = {
        cierre_caja: data.cierre_caja.id,
        descripcion,
        monto: gastoMonto,
        categoria: gastoCategoria,
        medio_pago: gastoMedioPago,
      };
      if (isInsumoCategory && gastoInsumo && cantidadEnBase > 0) {
        payload.insumo = Number(gastoInsumo);
        payload.cantidad_insumo = cantidadEnBase.toFixed(3);
        // Costo unitario por unidad base = monto total / cantidad en base
        const costoUnit = Number(gastoMonto) / cantidadEnBase;
        payload.costo_unitario_insumo = costoUnit.toFixed(4);
      }
      await api.post("/gastos-diarios/", payload);
      toast.success(
        isInsumoCategory && gastoInsumo
          ? "Gasto registrado e inventario actualizado"
          : "Gasto registrado"
      );
      resetGastoForm();
      fetchData();
    } catch {
      toast.error("Error al registrar gasto");
    } finally {
      setSavingGasto(false);
    }
  };

  const resetGastoForm = () => {
    const otrosGasto = categoriasGasto.find(c => c.nombre.toLowerCase() === "otros");
    setGastoCategoria(otrosGasto?.id ?? 0);
    setGastoMedioPago("efectivo");
    setGastoMonto("");
    setGastoArea("cocina");
    setGastoInsumo("");
    setGastoUnidades("");
    setGastoPesoUnidad("");
    setGastoUnidadCompra("kg");
    setCreandoInsumo(false);
    setNuevoInsumoNombre("");
    setNuevoInsumoCategoria("");
    setNuevoInsumoUnidad("");
    setShowGastoForm(false);
  };

  /* ── Crear nuevo insumo inline ── */
  const handleCreateInsumo = async () => {
    if (!nuevoInsumoNombre.trim()) {
      toast.error("Ingrese el nombre del insumo");
      return;
    }
    if (!nuevoInsumoCategoria) {
      toast.error("Seleccione una categoría");
      return;
    }
    if (!nuevoInsumoUnidad) {
      toast.error("Seleccione la unidad de medida");
      return;
    }
    setSavingNuevoInsumo(true);
    try {
      const res = await api.post("/inventario/", {
        nombre: nuevoInsumoNombre.trim(),
        categoria_insumo: Number(nuevoInsumoCategoria),
        unidad_medida: Number(nuevoInsumoUnidad),
      });
      const nuevo: InventarioItem = res.data;
      // Refrescar lista de insumos y auto-seleccionar el nuevo
      const listRes = await api.get(`/inventario/?is_active=true&ordering=nombre&page_size=200`);
      setInsumos(listRes.data?.results ?? listRes.data ?? []);
      setGastoInsumo(String(nuevo.id));
      // Auto-asignar unidad de compra
      const u = nuevo.unidad ?? "";
      if (u === "g") setGastoUnidadCompra("kg");
      else if (u === "ml") setGastoUnidadCompra("L");
      else setGastoUnidadCompra(u);
      // Limpiar form de nuevo insumo
      setCreandoInsumo(false);
      setNuevoInsumoNombre("");
      setNuevoInsumoCategoria("");
      setNuevoInsumoUnidad("");
      toast.success(`Insumo "${nuevo.nombre}" creado`);
    } catch {
      toast.error("Error al crear el insumo");
    } finally {
      setSavingNuevoInsumo(false);
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

  /* ── Agregar inversión ── */
  const handleAddInversion = async () => {
    if (!data?.cierre_caja) {
      toast.error("Primero debe crear la caja del día (guardar apertura)");
      return;
    }
    if (!inversionSocio) {
      toast.error("Seleccione un socio");
      return;
    }
    if (!inversionDesc.trim() || !inversionMonto || isNaN(Number(inversionMonto)) || Number(inversionMonto) <= 0) {
      toast.error("Complete descripción y monto válido");
      return;
    }
    setSavingInversion(true);
    try {
      await api.post("/inversiones-socio/", {
        cierre_caja: data.cierre_caja.id,
        socio: inversionSocio,
        monto: inversionMonto,
        descripcion: inversionDesc.trim(),
        categoria: inversionCategoria,
      });
      toast.success("Inversión registrada");
      setInversionSocio(0);
      setInversionMonto("");
      setInversionDesc("");
      const otrosInv = categoriasInversion.find(c => c.nombre.toLowerCase() === "otros");
      setInversionCategoria(otrosInv?.id ?? 0);
      setShowInversionForm(false);
      fetchData();
    } catch {
      toast.error("Error al registrar inversión");
    } finally {
      setSavingInversion(false);
    }
  };

  /* ── Eliminar inversión ── */
  const handleDeleteInversion = async (inversionId: number) => {
    try {
      await api.delete(`/inversiones-socio/${inversionId}/`);
      toast.success("Inversión eliminada");
      fetchData();
    } catch {
      toast.error("Error al eliminar inversión");
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

  if (loading) return <LoadingSpinner />;

  const resumen = data?.resumen;
  const cierre = data?.cierre_caja;
  const pedidos = data?.pedidos || [];
  const gastos: GastoDiario[] = cierre?.gastos || [];
  const inversiones: InversionSocio[] = cierre?.inversiones || [];
  const cajaCerrada = cierre?.cerrado === true;

  const totalVentas = Number(resumen?.total_ventas || 0);
  const totalGastos = Number(resumen?.total_gastos || 0);
  const apertura = Number(resumen?.monto_apertura || 0);
  const resultado = Number(resumen?.resultado || 0);
  const isPositive = resultado >= 0;

  const ventasEfectivo = Number(resumen?.ventas_efectivo || 0);
  const ventasTransferencia = Number(resumen?.ventas_transferencia || 0);
  const ventasTransferenciaCalculado = Number(resumen?.ventas_transferencia_calculado || 0);
  const tieneAjusteTransferencia = cierre?.ajuste_transferencia != null;
  const ventasTarjeta = Number(resumen?.ventas_tarjeta || 0);
  const ventasSinRegistro = Number(resumen?.ventas_sin_registro || 0);

  const gastosEfectivo = Number(resumen?.gastos_efectivo || 0);
  const gastosTransferencia = Number(resumen?.gastos_transferencia || 0);
  const totalInversiones = Number(resumen?.total_inversiones || 0);

  const efectivoEnCaja = apertura + ventasEfectivo + ventasTarjeta + ventasSinRegistro - gastosEfectivo;
  const isEfectivoPositive = efectivoEnCaja >= 0;
  const saldoTransferencias = ventasTransferencia - gastosTransferencia;
  const isSaldoTransPositive = saldoTransferencias >= 0;

  const esHoy = fecha === today();

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
          <Link
            href="/dashboard/caja/historial"
            className="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <History className="h-3.5 w-3.5" /> Historial
          </Link>
        </div>

        {/* Selector de fecha */}
        <div className="flex items-center gap-2">
          {cajaCerrada && (
            <span className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              <Lock className="h-3.5 w-3.5" /> Caja Cerrada
            </span>
          )}
          {!esHoy && (
            <button
              onClick={() => setFecha(today())}
              className="text-xs bg-brand-gold/10 text-brand-gold px-2.5 py-1 rounded-full font-medium hover:bg-brand-gold/20 transition-colors"
            >
              Ir a Hoy
            </button>
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

      {/* Banner: Último cierre cerrado */}
      {!cierre && esHoy && data?.ultimo_cierre && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Caja cerrada exitosamente</h3>
            <p className="text-sm text-green-700 mt-0.5">
              {data.ultimo_cierre.cerrado_por && `Cerrada por ${data.ultimo_cierre.cerrado_por}`}
              {data.ultimo_cierre.cerrado_at && ` · ${new Date(data.ultimo_cierre.cerrado_at).toLocaleString("es-EC")}`}
              {` · Ventas: $${fmt(data.ultimo_cierre.total_ventas)} · Resultado: $${fmt(data.ultimo_cierre.resultado)}`}
            </p>
            <p className="text-sm text-green-600 mt-1 font-medium">
              Abre una nueva caja para registrar nuevas ventas y gastos.
            </p>
          </div>
        </div>
      )}

      {/* Banner: Caja no abierta */}
      {!cierre && esHoy && !data?.ultimo_cierre && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Wallet className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800">Caja no abierta</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              Ingresa el monto de apertura para comenzar el día. Luego podrás registrar gastos y al final hacer el cierre de caja.
            </p>
          </div>
        </div>
      )}

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
                  <span className="flex items-center gap-1 text-gray-500">
                    <ArrowRightLeft className="h-3 w-3" /> Transferencia
                    {tieneAjusteTransferencia && <span className="text-indigo-500" title="Ajustado manualmente">*</span>}
                  </span>
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

      {/* Efectivo en Caja + Saldo Transferencias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={clsx(
          "border rounded-xl p-5 shadow-sm",
          isEfectivoPositive
            ? "bg-blue-50 border-blue-200"
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={clsx("p-2 rounded-lg", isEfectivoPositive ? "bg-blue-100" : "bg-red-100")}>
              <Banknote className={clsx("h-5 w-5", isEfectivoPositive ? "text-blue-600" : "text-red-600")} />
            </div>
            <span className="text-sm text-gray-500">Efectivo en Caja</span>
          </div>
          <p className={clsx("text-2xl font-bold", isEfectivoPositive ? "text-blue-700" : "text-red-600")}>
            ${fmt(efectivoEnCaja)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Apertura + Ventas no-transf. − Gastos en efectivo</p>
        </div>
        <div className={clsx(
          "border rounded-xl p-5 shadow-sm",
          isSaldoTransPositive
            ? "bg-indigo-50 border-indigo-200"
            : "bg-red-50 border-red-200"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={clsx("p-2 rounded-lg", isSaldoTransPositive ? "bg-indigo-100" : "bg-red-100")}>
              <ArrowRightLeft className={clsx("h-5 w-5", isSaldoTransPositive ? "text-indigo-600" : "text-red-600")} />
            </div>
            <span className="text-sm text-gray-500">Saldo Transferencias</span>
            {isSuperAdmin && cierre && !editingTransferencia && (
              <button
                onClick={() => {
                  setAjusteTransferencia(tieneAjusteTransferencia ? String(cierre.ajuste_transferencia) : "");
                  setEditingTransferencia(true);
                }}
                className="ml-auto p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Ajustar valor de transferencia"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {editingTransferencia ? (
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ingreso transferencia (ajuste manual)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ajusteTransferencia}
                  onChange={(e) => setAjusteTransferencia(e.target.value)}
                  placeholder={fmt(ventasTransferenciaCalculado)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Calculado del sistema: ${fmt(ventasTransferenciaCalculado)} — Dejar vacío para usar el calculado
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAjusteTransferencia}
                  disabled={savingAjuste}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  <Save className="h-3 w-3" />
                  {savingAjuste ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={() => setEditingTransferencia(false)}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={clsx("text-2xl font-bold", isSaldoTransPositive ? "text-indigo-700" : "text-red-600")}>
                ${fmt(saldoTransferencias)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tieneAjusteTransferencia
                  ? `Ajustado manualmente (calculado: $${fmt(ventasTransferenciaCalculado)})`
                  : "Ingresos transf. − Gastos transf."}
              </p>
            </>
          )}
        </div>
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
                      {g.insumo_nombre && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          📦 {g.insumo_nombre}: +{Number(g.cantidad_insumo).toFixed(1)} {g.unidad_medida}
                          {g.costo_unitario_insumo && <> &middot; ${Number(g.costo_unitario_insumo).toFixed(4)}/{g.unidad_medida}</>}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        g.medio_pago === "efectivo" && "bg-green-100 text-green-700",
                        g.medio_pago === "transferencia" && "bg-blue-100 text-blue-700",
                      )}>
                        {g.medio_pago === "efectivo" && <Banknote className="h-3 w-3" />}
                        {g.medio_pago === "transferencia" && <ArrowRightLeft className="h-3 w-3" />}
                        {g.medio_pago_display}
                      </span>
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
            ) : showGastoForm && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Nuevo Gasto</h3>

                {/* 1. Categoría */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                  <select
                    value={gastoCategoria}
                    onChange={(e) => {
                      setGastoCategoria(Number(e.target.value));
                      setGastoInsumo("");
                      setGastoUnidades("");
                      setGastoPesoUnidad("");
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  >
                    {categoriasGasto.filter(c => c.activa).map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Si es Insumos: Área + Insumo + Detalles de compra */}
                {isInsumoCategory && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Compra de Insumo
                    </p>

                    {/* Área: Cocina / Barra */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Área</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["cocina", "barra"] as const).map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => { setGastoArea(a); setGastoInsumo(""); setCreandoInsumo(false); }}
                            className={clsx(
                              "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                              gastoArea === a
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                            )}
                          >
                            {a === "cocina" ? "🍳 Cocina" : "🍸 Barra"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selector de insumo filtrado por área */}
                    {!creandoInsumo ? (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Insumo</label>
                          <select
                            value={gastoInsumo}
                            onChange={(e) => {
                              setGastoInsumo(e.target.value);
                              setGastoUnidades("");
                              setGastoPesoUnidad("");
                              // Auto-asignar unidad de compra según unidad del insumo
                              const ins = insumos.find((i) => i.id === Number(e.target.value));
                              if (ins) {
                                const u = ins.unidad ?? "";
                                if (u === "g") setGastoUnidadCompra("kg");
                                else if (u === "ml") setGastoUnidadCompra("L");
                                else setGastoUnidadCompra(u);
                              }
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 bg-white"
                          >
                            <option value="">— Seleccione insumo —</option>
                            {insumosFiltrados.map((ins) => (
                              <option key={ins.id} value={ins.id}>
                                {ins.nombre} ({ins.unidad ?? "u"} — Stock: {Number(ins.stock_actual).toFixed(1)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCreandoInsumo(true)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> ¿No lo encuentras? Crear nuevo insumo
                        </button>
                      </div>
                    ) : (
                      /* ── Mini-form crear nuevo insumo ── */
                      <div className="bg-white border border-blue-300 rounded-lg p-3 space-y-3">
                        <p className="text-xs font-semibold text-blue-700">Nuevo insumo</p>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                          <input
                            type="text"
                            maxLength={100}
                            value={nuevoInsumoNombre}
                            onChange={(e) => setNuevoInsumoNombre(e.target.value)}
                            placeholder="Ej: Alitas"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                            <select
                              value={nuevoInsumoCategoria}
                              onChange={(e) => setNuevoInsumoCategoria(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 bg-white"
                            >
                              <option value="">— Categoría —</option>
                              {categoriasInsumo
                                .filter((c) => c.area === gastoArea)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Unidad de medida</label>
                            <select
                              value={nuevoInsumoUnidad}
                              onChange={(e) => setNuevoInsumoUnidad(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50 bg-white"
                            >
                              <option value="">— Unidad —</option>
                              {unidadesMedida.map((u) => (
                                <option key={u.id} value={u.id}>{u.abreviatura} — {u.nombre}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateInsumo}
                            disabled={savingNuevoInsumo}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {savingNuevoInsumo ? "Creando..." : "Crear insumo"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCreandoInsumo(false);
                              setNuevoInsumoNombre("");
                              setNuevoInsumoCategoria("");
                              setNuevoInsumoUnidad("");
                            }}
                            className="px-3 py-1.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Detalles de compra (solo si insumo seleccionado) */}
                    {gastoInsumo && selectedInsumo && (
                      <div className="space-y-3">
                        {isUnitBased ? (
                          /* ── Compra por unidades (barra: cajas × und/caja) ── */
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Cajas / paquetes</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={gastoUnidades}
                                onChange={(e) => setGastoUnidades(e.target.value)}
                                placeholder="Ej: 2"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unidades por caja</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={gastoPesoUnidad}
                                onChange={(e) => setGastoPesoUnidad(e.target.value)}
                                placeholder="Ej: 24"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                              />
                            </div>
                          </div>
                        ) : (
                          /* ── Compra por peso (cocina: unidades × peso × conversión) ── */
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unidades</label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={gastoUnidades}
                                onChange={(e) => setGastoUnidades(e.target.value)}
                                placeholder="Ej: 3"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Peso por unidad</label>
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={gastoPesoUnidad}
                                onChange={(e) => setGastoPesoUnidad(e.target.value)}
                                placeholder="Ej: 1.13"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unidad compra</label>
                              <select
                                value={gastoUnidadCompra}
                                onChange={(e) => setGastoUnidadCompra(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                              >
                                {selectedInsumo.unidad === "g" && (
                                  <>
                                    <option value="kg">kg</option>
                                    <option value="lb">lb</option>
                                    <option value="g">g</option>
                                  </>
                                )}
                                {selectedInsumo.unidad === "ml" && (
                                  <>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Resumen de conversión */}
                        {cantidadEnBase > 0 && (
                          <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-1.5">
                            {isUnitBased ? (
                              <p className="text-xs font-medium text-gray-700">
                                Total: <span className="text-blue-700 font-bold">{unidades} {unidades === 1 ? "caja" : "cajas"} × {pesoUnidad} und = {cantidadEnBase} und</span>
                              </p>
                            ) : (
                              <>
                                <p className="text-xs font-medium text-gray-700">
                                  Peso total: <span className="text-blue-700 font-bold">{totalDisplay.toFixed(2)} {unidadCompra}</span>
                                  {" "}({unidades} uds × {pesoUnidad} {unidadCompra})
                                </p>
                                {cantidadEnBase > 0 && unidadBase !== unidadCompra && (
                                  <p className="text-xs text-gray-600">
                                    Conversión: <span className="text-blue-700 font-bold">{cantidadEnBase.toFixed(1)} {unidadBase}</span>
                                  </p>
                                )}
                                {porciones100 > 0 && (
                                  <p className="text-xs text-emerald-700 font-medium">
                                    Porciones de 100{unidadBase}: <span className="font-bold">{porciones100}</span> porciones
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Monto total */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto total ($)</label>
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

                {/* 4. Medio de pago */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Medio de Pago</label>
                  <select
                    value={gastoMedioPago}
                    onChange={(e) => setGastoMedioPago(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  >
                    {MEDIOS_PAGO_GASTO.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                {/* Acciones */}
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
                    onClick={resetGastoForm}
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
      {/* INVERSIONES DE SOCIOS                         */}
      {/* ══════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <button
          onClick={() => setInversionesOpen(!inversionesOpen)}
          className="w-full flex items-center justify-between p-6"
        >
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Inversiones de Socios</h2>
            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              ${fmt(totalInversiones)}
            </span>
          </div>
          {inversionesOpen ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {inversionesOpen && (
          <div className="px-6 pb-6 space-y-4">
            {inversiones.length > 0 ? (
              <div className="space-y-2">
                {inversiones.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{inv.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {inv.categoria_display || inv.categoria}
                        {inv.created_at && (
                          <> &middot; {new Date(inv.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Users className="h-3 w-3" />
                        {inv.socio_display}
                      </span>
                      <span className="text-sm font-semibold text-purple-600">${fmt(inv.monto)}</span>
                      <button
                        onClick={() => handleDeleteInversion(inv.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar inversión"
                        disabled={cajaCerrada}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay inversiones registradas este día.</p>
            )}

            {!cajaCerrada && !showInversionForm ? (
              <button
                onClick={() => {
                  if (!cierre) {
                    toast.error("Primero cree la caja del día (guardar apertura)");
                    return;
                  }
                  setShowInversionForm(true);
                }}
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Agregar Inversión
              </button>
            ) : (
              !cajaCerrada && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Nueva Inversión</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Socio</label>
                      <select
                        value={inversionSocio}
                        onChange={(e) => setInversionSocio(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        <option value={0}>Seleccionar socio...</option>
                        {socios.filter(s => s.activo).map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Monto ($)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={inversionMonto}
                        onChange={(e) => setInversionMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                      <select
                        value={inversionCategoria}
                        onChange={(e) => setInversionCategoria(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      >
                        {categoriasInversion.filter(c => c.activa).map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                    <input
                      type="text"
                      value={inversionDesc}
                      onChange={(e) => setInversionDesc(e.target.value)}
                      placeholder="Compra de equipos, capital..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddInversion}
                      disabled={savingInversion}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {savingInversion ? "Guardando..." : "Guardar Inversión"}
                    </button>
                    <button
                      onClick={() => {
                        setShowInversionForm(false);
                        setInversionSocio(0);
                        setInversionMonto("");
                        setInversionDesc("");
                        const otrosInv = categoriasInversion.find(c => c.nombre.toLowerCase() === "otros");
                        setInversionCategoria(otrosInv?.id ?? 0);
                      }}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )
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
      {/* PRODUCTOS VENDIDOS                            */}
      {/* ══════════════════════════════════════════════ */}
      {data?.productos_vendidos && data.productos_vendidos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <button
            onClick={() => setProductosOpen(!productosOpen)}
            className="w-full flex items-center justify-between p-6"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Productos Vendidos</h2>
              <span className="text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {data.productos_vendidos.length} producto{data.productos_vendidos.length !== 1 ? "s" : ""}
              </span>
            </div>
            {productosOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {productosOpen && (
            <div className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500">
                      <th className="text-left py-2 pr-4 font-medium">Producto</th>
                      <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                      <th className="text-right py-2 pr-4 font-medium">Cantidad</th>
                      <th className="text-right py-2 font-medium">Ingreso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.productos_vendidos.map((pv, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900">{pv.nombre}</td>
                        <td className="py-3 pr-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            pv.tipo === "promo" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {pv.tipo === "promo" ? "Promoción" : "Item"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">{pv.cantidad}</td>
                        <td className="py-3 text-right font-semibold text-gray-900">${fmt(pv.ingreso)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td colSpan={2} className="py-3 text-right text-gray-500 font-medium">Total</td>
                      <td className="py-3 text-right font-bold text-gray-700">
                        {data.productos_vendidos.reduce((s, p) => s + p.cantidad, 0)}
                      </td>
                      <td className="py-3 text-right font-bold text-green-600">
                        ${fmt(data.productos_vendidos.reduce((s, p) => s + Number(p.ingreso), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

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
          <div className="py-2 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-red-600 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Gastos
              </span>
              <span className="font-mono text-red-600">- ${fmt(totalGastos)}</span>
            </div>
            {totalGastos > 0 && (
              <div className="ml-6 mt-1 space-y-0.5">
                {gastosEfectivo > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500"><Banknote className="h-3 w-3" /> Efectivo</span>
                    <span className="font-mono text-gray-600">${fmt(gastosEfectivo)}</span>
                  </div>
                )}
                {gastosTransferencia > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5 text-gray-500"><ArrowRightLeft className="h-3 w-3" /> Transferencia</span>
                    <span className="font-mono text-gray-600">${fmt(gastosTransferencia)}</span>
                  </div>
                )}
              </div>
            )}
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
            </span>
            <span className={clsx("font-mono font-bold text-lg", isEfectivoPositive ? "text-blue-700" : "text-red-700")}>
              ${fmt(efectivoEnCaja)}
            </span>
          </div>
          {ventasTransferencia > 0 && (
            <div className={clsx(
              "flex justify-between items-center py-3 rounded-lg px-3 mt-1",
              isSaldoTransPositive ? "bg-indigo-50" : "bg-red-50"
            )}>
              <span className={clsx("font-semibold flex items-center gap-2", isSaldoTransPositive ? "text-indigo-700" : "text-red-700")}>
                <ArrowRightLeft className="h-4 w-4" /> Saldo Transferencias
                <span className="text-xs font-normal text-gray-400">(ingresos − gastos por transferencia)</span>
              </span>
              <span className={clsx("font-mono font-bold text-lg", isSaldoTransPositive ? "text-indigo-700" : "text-red-700")}>
                ${fmt(saldoTransferencias)}
              </span>
            </div>
          )}
          {totalInversiones > 0 && (
            <div className="flex justify-between items-center py-3 rounded-lg px-3 mt-1 bg-purple-50">
              <span className="font-semibold flex items-center gap-2 text-purple-700">
                <Users className="h-4 w-4" /> Inversiones de Socios
                <span className="text-xs font-normal text-gray-400">(no afecta caja)</span>
              </span>
              <span className="font-mono font-bold text-lg text-purple-700">
                ${fmt(totalInversiones)}
              </span>
            </div>
          )}
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
                  Una vez cerrada, las ventas y gastos se guardarán en el historial y la caja se reiniciará.
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
          </div>
        )}
      </div>
    </div>
  );
}
