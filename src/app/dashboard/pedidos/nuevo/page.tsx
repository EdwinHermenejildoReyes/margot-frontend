"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { MenuItem, Category, Mesa, Atencion, PaginatedResponse, TipoEmpaque, Promocion, ExtraSeleccionado, Extra } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UtensilsCrossed,
  Armchair,
  StickyNote,
  X,
  ChevronDown,
  Package,
  Truck,
  Sparkles,
  Tag,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import StockInsuficienteModal, {
  type StockErrorResponse,
  type FaltantePorProducto,
} from "@/components/StockInsuficienteModal";

/* ── Cart item type ── */
interface CartItem {
  menuItem: MenuItem;
  cantidad: number;
  notas: string;
  salsas_seleccionadas?: string[];
  extras_seleccionados?: ExtraSeleccionado[];
}

/* ── Alitas sauce config ── */
const SALSAS_DISPONIBLES = ["BBQ", "Maracuyá", "Cheddar", "Honey Mustard"];

function getMaxSalsas(item: MenuItem): number {
  if (item.category_name?.toLowerCase() !== "alitas") return 0;
  const match = item.name.match(/^(\d+)/);
  return match ? Math.floor(parseInt(match[1]) / 5) : 0;
}

interface CartPromo {
  promocion: Promocion;
  cantidad: number;
  selectedItem?: MenuItem; // For "adicional" promos: the trigger item chosen by user
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Pre-fill from query params (when coming from Mesas page)
  const preselectedMesa = searchParams.get("mesa");
  const preselectedAtencion = searchParams.get("atencion");

  /* ── Data states ── */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Form states ── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartPromos, setCartPromos] = useState<CartPromo[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<string>(preselectedMesa ? "local" : "local");
  const [mesaId, setMesaId] = useState<number | "">(preselectedMesa ? Number(preselectedMesa) : "");
  const [atencionId, setAtencionId] = useState<number | "">(preselectedAtencion ? Number(preselectedAtencion) : "");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Filter states ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "promociones" | null>(null);
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null);

  /* ── Stock check ── */
  const [stockError, setStockError] = useState<StockErrorResponse | null>(null);
  const [stockWarnings, setStockWarnings] = useState<Map<number, number>>(new Map()); // menuItemId → porciones_posibles

  /* ── Empaque warning ── */
  const [showEmpaqueWarning, setShowEmpaqueWarning] = useState(false);

  /* ── Adicional/NxM promo selection modal ── */
  const [selectionPromo, setSelectionPromo] = useState<Promocion | null>(null);

  /* ── Empaques states ── */
  const [tiposEmpaque, setTiposEmpaque] = useState<TipoEmpaque[]>([]);
  const [cartEmpaques, setCartEmpaques] = useState<Map<number, number>>(new Map()); // tipoEmpaqueId → cantidad
  const [costoDelivery, setCostoDelivery] = useState<string>("");

  /* ── Extras sueltos states ── */
  const [allExtras, setAllExtras] = useState<Extra[]>([]);
  const [cartExtrasSueltos, setCartExtrasSueltos] = useState<Map<number, number>>(new Map()); // extraId → cantidad

  /* ── Código de descuento ── */
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoDescuento, setCodigoDescuento] = useState<{
    codigo_id: number;
    tipo: string;
    nombre_titular: string;
    porcentaje: string;
    subtotal_aplicable: string;
    monto_descuento: string;
    secciones: string[];
  } | null>(null);
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  /* ── Fecha personalizada (solo staff) ── */
  const [fechaPedido, setFechaPedido] = useState("");

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuRes, catRes, mesasRes, atencionesRes, empaquesRes, promosRes, extrasRes] = await Promise.all([
          api.get<PaginatedResponse<MenuItem>>("/menu-items/?page_size=200&is_available=true"),
          api.get<PaginatedResponse<Category>>("/categorias/?page_size=50"),
          api.get<PaginatedResponse<Mesa>>("/mesas/"),
          api.get("/atenciones/activas/"),
          api.get<PaginatedResponse<TipoEmpaque>>("/tipos-empaque/?page_size=50"),
          api.get("/promociones/vigentes/"),
          api.get<PaginatedResponse<Extra>>("/extras/?page_size=100"),
        ]);
        setMenuItems(menuRes.data.results || []);
        setCategories(catRes.data.results || []);
        setMesas(mesasRes.data.results || []);
        setAtenciones(Array.isArray(atencionesRes.data) ? atencionesRes.data : atencionesRes.data.results || []);
        setTiposEmpaque(empaquesRes.data.results || []);
        setPromociones(Array.isArray(promosRes.data) ? promosRes.data : promosRes.data.results || []);
        setAllExtras(extrasRes.data.results || []);
      } catch {
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── Filtered & grouped menu items ── */
  const groupedItems = useMemo(() => {
    if (selectedCategory === "promociones") return [];
    let items = menuItems;
    if (selectedCategory) {
      items = items.filter((i) => i.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
      );
    }
    // Group by category, preserving category order from backend
    const groups: { category: Category; items: MenuItem[] }[] = [];
    const catMap = new Map<number, MenuItem[]>();
    for (const item of items) {
      const list = catMap.get(item.category) || [];
      list.push(item);
      catMap.set(item.category, list);
    }
    // Sort groups by category order (from categories list)
    const catOrder = new Map(categories.map((c, idx) => [c.id, idx]));
    for (const [catId, catItems] of [...catMap.entries()].sort(
      (a, b) => (catOrder.get(a[0]) ?? 999) - (catOrder.get(b[0]) ?? 999)
    )) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) groups.push({ category: cat, items: catItems });
    }
    return groups;
  }, [menuItems, categories, selectedCategory, searchQuery]);

  const totalFilteredItems = useMemo(
    () => groupedItems.reduce((sum, g) => sum + g.items.length, 0),
    [groupedItems]
  );

  /* ── Filtered promociones ── */
  const filteredPromos = useMemo(() => {
    if (selectedCategory !== "promociones" && selectedCategory !== null) return [];
    if (!searchQuery.trim()) return promociones;
    const q = searchQuery.toLowerCase();
    return promociones.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
    );
  }, [promociones, selectedCategory, searchQuery]);

  /* ── Cart helpers ── */
  const addToCart = async (item: MenuItem) => {
    const existing = cart.find((c) => c.menuItem.id === item.id);
    const newCantidad = existing ? existing.cantidad + 1 : 1;

    // Check stock availability
    try {
      const { data } = await api.get(
        `/menu-items/${item.id}/verificar_stock/?cantidad=${newCantidad}`
      );

      if (!data.disponible) {
        // Build the modal data
        const faltante: FaltantePorProducto = {
          producto: data.producto,
          cantidad_pedida: data.cantidad_pedida,
          porciones_posibles: data.porciones_posibles,
          ingredientes_faltantes: data.ingredientes_faltantes,
        };
        setStockError({
          error: "stock_insuficiente",
          message: `Stock insuficiente para ${item.name}`,
          faltantes: [faltante],
        });
        // Track the warning so the card shows a badge
        setStockWarnings((prev) => new Map(prev).set(item.id, data.porciones_posibles));
        return; // Don't add to cart
      }

      // Clear warning if resolved
      setStockWarnings((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    } catch {
      // If check fails, allow adding (don't block the workflow)
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((c) =>
          c.menuItem.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c
        );
      }
      return [...prev, { menuItem: item, cantidad: 1, notas: "", salsas_seleccionadas: [], extras_seleccionados: [] }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItem.id === itemId ? { ...c, cantidad: Math.max(0, c.cantidad + delta) } : c
        )
        .filter((c) => c.cantidad > 0)
    );
  };

  const updateItemNotes = (itemId: number, notas: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItem.id === itemId ? { ...c, notas } : c))
    );
  };

  const toggleSalsa = (itemId: number, salsa: string) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.menuItem.id !== itemId) return c;
        const max = getMaxSalsas(c.menuItem);
        const current = c.salsas_seleccionadas || [];
        if (current.includes(salsa)) {
          return { ...c, salsas_seleccionadas: current.filter((s) => s !== salsa) };
        }
        if (current.length >= max) return c;
        return { ...c, salsas_seleccionadas: [...current, salsa] };
      })
    );
  };

  const toggleExtra = (itemId: number, extra: { id: number; nombre: string; precio: string }) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.menuItem.id !== itemId) return c;
        const current = c.extras_seleccionados || [];
        const exists = current.find((e) => e.extra_id === extra.id);
        if (exists) {
          return { ...c, extras_seleccionados: current.filter((e) => e.extra_id !== extra.id) };
        }
        return {
          ...c,
          extras_seleccionados: [...current, { extra_id: extra.id, nombre: extra.nombre, precio: extra.precio }],
        };
      })
    );
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => {
      const extrasTotal = (c.extras_seleccionados || []).reduce((s, e) => s + parseFloat(e.precio), 0);
      return sum + (parseFloat(c.menuItem.price) + extrasTotal) * c.cantidad;
    }, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.cantidad, 0), [cart]);

  /* ── Promo cart helpers ── */
  const promoNeedsSelection = (promo: Promocion) => {
    if (promo.tipo === "adicional") return true;
    if (promo.tipo === "nxm") {
      const aplicaItems = promo.items?.filter((i) => i.rol === "aplica") || [];
      // Need selection if: no items, multiple items (user must choose),
      // any item uses category, precio_filtro, or no menu_item
      if (
        aplicaItems.length === 0 ||
        aplicaItems.length > 1 ||
        aplicaItems.some((i) => i.category || !i.menu_item || i.precio_filtro)
      ) return true;
    }
    return false;
  };

  const addPromoToCart = (promo: Promocion) => {
    if (promoNeedsSelection(promo)) {
      setSelectionPromo(promo);
      return;
    }
    // Auto-resolve selectedItem when there's exactly 1 aplica menu_item
    const aplicaItems = promo.items?.filter((i) => i.rol === "aplica") || [];
    const singleMenuItem = aplicaItems.length === 1 && aplicaItems[0].menu_item
      ? menuItems.find((m) => m.id === aplicaItems[0].menu_item)
      : undefined;

    setCartPromos((prev) => {
      const existing = prev.find(
        (p) => p.promocion.id === promo.id && p.selectedItem?.id === singleMenuItem?.id
      );
      if (existing) {
        return prev.map((p) =>
          p.promocion.id === promo.id && p.selectedItem?.id === singleMenuItem?.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { promocion: promo, cantidad: 1, selectedItem: singleMenuItem }];
    });
  };

  const addPromoWithSelectedItem = (promo: Promocion, item: MenuItem) => {
    setCartPromos((prev) => {
      const existing = prev.find(
        (p) => p.promocion.id === promo.id && p.selectedItem?.id === item.id
      );
      if (existing) {
        return prev.map((p) =>
          p.promocion.id === promo.id && p.selectedItem?.id === item.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { promocion: promo, cantidad: 1, selectedItem: item }];
    });
    setSelectionPromo(null);
  };

  // Items available for the promo selection modal
  const selectionTriggerItems = useMemo(() => {
    if (!selectionPromo) return [];
    const aplicaItems = (selectionPromo.items || []).filter((i) => i.rol === "aplica");
    const precioFiltro = aplicaItems.find((i) => i.precio_filtro)?.precio_filtro;

    // Collect all possible category IDs: explicit category + menu_item_category from backend
    const categoryIds = new Set<number>();
    for (const item of aplicaItems) {
      if (item.category) categoryIds.add(item.category);
      if (item.menu_item_category) categoryIds.add(item.menu_item_category);
    }
    // Also try to infer from loaded menuItems if the referenced item is available
    for (const item of aplicaItems) {
      if (item.menu_item) {
        const mi = menuItems.find((m) => m.id === item.menu_item);
        if (mi) categoryIds.add(mi.category);
      }
    }

    const specificItemIds = aplicaItems.map((i) => i.menu_item).filter(Boolean) as number[];

    // 1st try: category + precio_filtro
    let results = menuItems.filter((mi) => {
      const matchesCategory = categoryIds.has(mi.category);
      const matchesItem = specificItemIds.includes(mi.id);
      if (!matchesCategory && !matchesItem) return false;
      if (precioFiltro && parseFloat(mi.price) !== parseFloat(precioFiltro)) return false;
      return true;
    });

    // 2nd try: category only (ignore price filter)
    if (results.length === 0 && categoryIds.size > 0) {
      results = menuItems.filter((mi) => categoryIds.has(mi.category));
    }

    // 3rd try: all items at that exact price
    if (results.length === 0 && precioFiltro) {
      results = menuItems.filter((mi) => parseFloat(mi.price) === parseFloat(precioFiltro));
    }

    return results;
  }, [selectionPromo, menuItems]);

  const removePromoFromCart = (promoId: number, selectedItemId?: number) => {
    setCartPromos((prev) =>
      prev.filter((p) => !(p.promocion.id === promoId && p.selectedItem?.id === selectedItemId))
    );
  };

  const updatePromoQuantity = (promoId: number, delta: number, selectedItemId?: number) => {
    setCartPromos((prev) =>
      prev
        .map((p) =>
          p.promocion.id === promoId && p.selectedItem?.id === selectedItemId
            ? { ...p, cantidad: Math.max(0, p.cantidad + delta) }
            : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  const promoPrice = (p: Promocion, selectedItem?: MenuItem) =>
    p.tipo === "adicional"
      ? parseFloat(selectedItem?.price || "0") + parseFloat(p.precio_extra || "0")
      : parseFloat(p.precio_promocional || "0");

  const promosTotal = useMemo(
    () => cartPromos.reduce((sum, cp) => sum + promoPrice(cp.promocion, cp.selectedItem) * cp.cantidad, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cartPromos]
  );

  const empaquesTotal = useMemo(() => {
    let total = 0;
    cartEmpaques.forEach((cantidad, tipoId) => {
      const tipo = tiposEmpaque.find((t) => t.id === tipoId);
      if (tipo) total += parseFloat(tipo.precio) * cantidad;
    });
    return total;
  }, [cartEmpaques, tiposEmpaque]);

  const deliveryTotal = useMemo(
    () => (costoDelivery ? parseFloat(costoDelivery) || 0 : 0),
    [costoDelivery]
  );

  /* ── Pizza detection & empaque filtering ── */
  const hasPizzaInCart = useMemo(
    () => cart.some((c) => c.menuItem.category_name?.toLowerCase().includes("pizza")),
    [cart]
  );

  const filteredEmpaques = useMemo(
    () => tiposEmpaque.filter((t) => {
      if (t.nombre.toLowerCase().includes("pizza") && !hasPizzaInCart) return false;
      return true;
    }),
    [tiposEmpaque, hasPizzaInCart]
  );

  const extrasSueltosTotal = useMemo(() => {
    let total = 0;
    cartExtrasSueltos.forEach((cantidad, extraId) => {
      const extra = allExtras.find((e) => e.id === extraId);
      if (extra) total += parseFloat(extra.precio) * cantidad;
    });
    return total;
  }, [cartExtrasSueltos, allExtras]);

  const grandTotal = useMemo(
    () => cartTotal + promosTotal + empaquesTotal + extrasSueltosTotal + deliveryTotal - (codigoDescuento ? parseFloat(codigoDescuento.monto_descuento) : 0),
    [cartTotal, promosTotal, empaquesTotal, extrasSueltosTotal, deliveryTotal, codigoDescuento]
  );

  /* ── Auto-select caja de pizza when pizza is in cart ── */
  useEffect(() => {
    if (tipoEntrega === "local") return;
    const cajaPizza = tiposEmpaque.find((t) => t.nombre.toLowerCase().includes("pizza"));
    if (!cajaPizza) return;

    if (hasPizzaInCart) {
      setCartEmpaques((prev) => {
        if (prev.has(cajaPizza.id)) return prev;
        const next = new Map(prev);
        next.set(cajaPizza.id, 1);
        return next;
      });
    } else {
      setCartEmpaques((prev) => {
        if (!prev.has(cajaPizza.id)) return prev;
        const next = new Map(prev);
        next.delete(cajaPizza.id);
        return next;
      });
    }
  }, [hasPizzaInCart, tipoEntrega, tiposEmpaque]);

  /* ── Empaques helpers ── */
  const updateEmpaqueCantidad = (tipoId: number, delta: number) => {
    setCartEmpaques((prev) => {
      const next = new Map(prev);
      const current = next.get(tipoId) || 0;
      const newVal = Math.max(0, current + delta);
      if (newVal === 0) next.delete(tipoId);
      else next.set(tipoId, newVal);
      return next;
    });
  };

  /* ── Extras sueltos helpers ── */
  const updateExtraSueltoCantidad = (extraId: number, delta: number) => {
    setCartExtrasSueltos((prev) => {
      const next = new Map(prev);
      const current = next.get(extraId) || 0;
      const newVal = Math.max(0, current + delta);
      if (newVal === 0) next.delete(extraId);
      else next.set(extraId, newVal);
      return next;
    });
  };

  /* ── Submit order ── */
  const handleValidarCodigo = async () => {
    const code = codigoInput.trim();
    if (!code) {
      toast.error("Ingresa un código de descuento");
      return;
    }
    if (cart.length === 0) {
      toast.error("Agrega ítems regulares al pedido antes de validar el código (no aplica a promociones)");
      return;
    }
    setValidandoCodigo(true);
    try {
      const res = await api.post("/codigos-descuento/validar/", {
        codigo: code,
        detalles: cart.map((c) => ({ menu_item: c.menuItem.id, cantidad: c.cantidad })),
      });
      setCodigoDescuento(res.data);
      toast.success(`Descuento ${res.data.porcentaje}% aplicado — ${res.data.nombre_titular}`);
    } catch {
      setCodigoDescuento(null);
      toast.error("Código inválido o inactivo");
    } finally {
      setValidandoCodigo(false);
    }
  };

  const handleRemoverCodigo = () => {
    setCodigoDescuento(null);
    setCodigoInput("");
  };

  const handleSubmit = async (skipEmpaqueCheck = false) => {
    if (cart.length === 0 && cartPromos.length === 0 && cartExtrasSueltos.size === 0) {
      toast.error("Agrega al menos un ítem, promoción o extra al pedido");
      return;
    }

    // Validate salsas for alitas
    for (const c of cart) {
      const max = getMaxSalsas(c.menuItem);
      if (max > 0 && (!c.salsas_seleccionadas || c.salsas_seleccionadas.length !== max)) {
        toast.error(`Selecciona ${max} salsa(s) para ${c.menuItem.name}`);
        return;
      }
    }

    if (tipoEntrega === "local" && !mesaId) {
      toast.error("Selecciona una mesa para consumo en local");
      return;
    }

    // Warn if "para llevar" or "domicilio" and no empaques selected
    if (!skipEmpaqueCheck && tipoEntrega !== "local" && cartEmpaques.size === 0) {
      if (tipoEntrega === "domicilio") {
        toast.error("Selecciona al menos un empaque para delivery");
        return;
      }
      setShowEmpaqueWarning(true);
      return;
    }

    // Validate delivery cost for domicilio
    if (tipoEntrega === "domicilio" && deliveryTotal <= 0) {
      toast.error("Indica el costo de delivery para pedidos a domicilio");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        tipo_entrega: tipoEntrega,
        notas: notas || undefined,
        detalles: cart.map((c) => ({
          menu_item: c.menuItem.id,
          cantidad: c.cantidad,
          notas: c.notas || undefined,
          ...(c.salsas_seleccionadas && c.salsas_seleccionadas.length > 0
            ? { salsas_seleccionadas: c.salsas_seleccionadas }
            : {}),
          ...(c.extras_seleccionados && c.extras_seleccionados.length > 0
            ? { extras_seleccionados: c.extras_seleccionados }
            : {}),
        })),
        promociones: cartPromos.map((cp) => ({
          promocion: cp.promocion.id,
          cantidad: cp.cantidad,
          ...(cp.selectedItem ? { menu_item_seleccionado: cp.selectedItem.id } : {}),
        })),
        ...(codigoDescuento ? { codigo_descuento: codigoDescuento.codigo_id } : {}),
        ...(fechaPedido && user?.is_staff ? { fecha_pedido: new Date(fechaPedido).toISOString() } : {}),
      };

      if (tipoEntrega === "local") {
        if (mesaId) payload.mesa = mesaId;
        if (atencionId) payload.atencion = atencionId;
      }

      // Empaques (solo para llevar / domicilio)
      if (tipoEntrega !== "local" && cartEmpaques.size > 0) {
        const empaques: { tipo_empaque: number; cantidad: number }[] = [];
        cartEmpaques.forEach((cantidad, tipoId) => {
          if (cantidad > 0) empaques.push({ tipo_empaque: tipoId, cantidad });
        });
        if (empaques.length > 0) payload.empaques = empaques;
      }

      // Extras sueltos
      if (cartExtrasSueltos.size > 0) {
        const extrasSueltos: { extra: number; cantidad: number }[] = [];
        cartExtrasSueltos.forEach((cantidad, extraId) => {
          if (cantidad > 0) extrasSueltos.push({ extra: extraId, cantidad });
        });
        if (extrasSueltos.length > 0) payload.extras_sueltos = extrasSueltos;
      }

      // Costo delivery (solo domicilio)
      if (tipoEntrega === "domicilio" && deliveryTotal > 0) {
        payload.costo_delivery = deliveryTotal;
      }

      await api.post("/pedidos/", payload);
      toast.success("¡Pedido creado exitosamente!");
      router.push("/dashboard/pedidos");
    } catch (err: unknown) {
      const error = err as { response?: { data?: Record<string, string[]> } };
      const msg = error.response?.data
        ? Object.values(error.response.data).flat().join(", ")
        : "Error al crear el pedido";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── Get atencion for a mesa ── */
  const getAtencionForMesa = (mId: number) => atenciones.find((a) => a.mesa === mId);

  const handleMesaChange = (mId: number | "") => {
    setMesaId(mId);
    if (mId) {
      const atencion = getAtencionForMesa(Number(mId));
      setAtencionId(atencion ? atencion.id : "");
    } else {
      setAtencionId("");
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      {/* ══════════ LEFT: Menu Catalog ══════════ */}
      <div className="flex-1 flex flex-col lg:min-h-0">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
            <p className="text-sm text-gray-500">Selecciona los ítems del menú</p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ítems del menú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                !selectedCategory
                  ? "bg-brand-gold text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "bg-brand-gold text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.name}
              </button>
            ))}
            {promociones.length > 0 && (
              <button
                onClick={() => setSelectedCategory("promociones")}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                  selectedCategory === "promociones"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                )}
              >
                <Sparkles className="h-3 w-3" />
                Promociones
              </button>
            )}
          </div>
        </div>

        {/* Menu Items Grid – grouped by category */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[50vh] lg:min-h-0">
          {totalFilteredItems === 0 && filteredPromos.length === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron ítems</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ── Promociones section ── */}
              {filteredPromos.length > 0 && (selectedCategory === null || selectedCategory === "promociones") && (
                <div>
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 -mx-1 px-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wide">
                      Promociones
                    </h3>
                    <span className="text-xs text-gray-400">
                      ({filteredPromos.length})
                    </span>
                    <div className="flex-1 border-t border-purple-200 ml-2" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredPromos.map((promo) => {
                      const inCartCount = cartPromos
                        .filter((cp) => cp.promocion.id === promo.id)
                        .reduce((s, cp) => s + cp.cantidad, 0);
                      const isAdicional = promo.tipo === "adicional";
                      const precio = isAdicional
                        ? parseFloat(promo.precio_extra || "0")
                        : parseFloat(promo.precio_promocional || "0");
                      return (
                        <button
                          key={`promo-${promo.id}`}
                          onClick={() => addPromoToCart(promo)}
                          className={clsx(
                            "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-md",
                            inCartCount > 0
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 bg-white hover:border-purple-300"
                          )}
                        >
                          <div className="h-14 w-14 rounded-lg bg-purple-100 flex-shrink-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{promo.nombre}</p>
                            <p className="text-xs text-purple-500 truncate">{promo.tipo_display}</p>
                            <p className="text-sm font-bold text-purple-600 mt-0.5">
                              {isAdicional ? `+ $${precio.toFixed(2)}` : `$${precio.toFixed(2)}`}
                            </p>
                          </div>
                          {inCartCount > 0 && (
                            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow">
                              {inCartCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Menu items by category ── */}
              {groupedItems.map((group) => (
                <div key={group.category.id}>
                  {/* Category heading */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2 -mx-1 px-1">
                    <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                      {group.category.name}
                    </h3>
                    <span className="text-xs text-gray-400">
                      ({group.items.length})
                    </span>
                    <div className="flex-1 border-t border-gray-200 ml-2" />
                  </div>
                  {/* Items grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.items.map((item) => {
                      const inCart = cart.find((c) => c.menuItem.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => addToCart(item)}
                          className={clsx(
                            "relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-md",
                            inCart
                              ? "border-brand-gold bg-brand-sage/30"
                              : "border-gray-200 bg-white hover:border-brand-gold/50"
                          )}
                        >
                          {/* Image or placeholder */}
                          <div className="h-14 w-14 rounded-lg bg-brand-sage flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={56}
                                height={56}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <UtensilsCrossed className="h-6 w-6 text-brand-sage-dark" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-400 truncate">{item.description}</p>
                            <p className="text-sm font-bold text-brand-gold mt-0.5">${item.price}</p>
                          </div>
                          {inCart && (
                            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-brand-gold text-white text-xs font-bold flex items-center justify-center shadow">
                              {inCart.cantidad}
                            </span>
                          )}
                          {stockWarnings.has(item.id) && (
                            <span
                              className="absolute -bottom-1 -right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold border border-amber-200 shadow-sm"
                              title={`Máximo ${stockWarnings.get(item.id)} porciones con stock actual`}
                            >
                              máx {stockWarnings.get(item.id)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ RIGHT: Cart / Order Summary ══════════ */}
      <div className="w-full lg:w-96 flex flex-col bg-white rounded-xl border border-gray-200 lg:min-h-0">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-gold" />
            <h2 className="font-semibold text-gray-900">Pedido</h2>
          </div>
          <span className="text-xs bg-brand-sage text-brand-dark px-2 py-0.5 rounded-full font-medium">
            {cartCount + cartPromos.reduce((s, p) => s + p.cantidad, 0)} {cartCount + cartPromos.reduce((s, p) => s + p.cantidad, 0) === 1 ? "ítem" : "ítems"}
          </span>
        </div>

        {/* Scrollable middle: config + cart + notes */}
        <div className="flex-1 overflow-y-auto lg:min-h-0">

        {/* Order Config */}
        <div className="px-5 py-3 border-b border-gray-100 space-y-3">
          {/* Tipo de entrega */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de Entrega</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "local", label: "Local", icon: Armchair },
                { value: "para_llevar", label: "Llevar", icon: ShoppingCart },
                { value: "domicilio", label: "Delivery", icon: Truck },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTipoEntrega(opt.value);
                    if (opt.value === "local") {
                      setCartEmpaques(new Map());
                      setCostoDelivery("");
                    }
                    if (opt.value !== "domicilio") {
                      setCostoDelivery("");
                    }
                  }}
                  className={clsx(
                    "flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all border",
                    tipoEntrega === opt.value
                      ? "border-brand-gold bg-brand-gold/10 text-brand-bronze"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mesa selection (only for local) */}
          {tipoEntrega === "local" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Mesa</label>
              <div className="relative">
                <Armchair className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={mesaId}
                  onChange={(e) => handleMesaChange(e.target.value ? Number(e.target.value) : "")}
                  className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none appearance-none bg-white"
                >
                  <option value="">Seleccionar mesa...</option>
                  {mesas
                    .filter((m) => m.estado === "disponible" || m.estado === "ocupada")
                    .sort((a, b) => a.numero - b.numero)
                    .map((m) => {
                      const atencion = getAtencionForMesa(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          Mesa {m.numero} ({m.capacidad} pers.) — {m.estado === "disponible" ? "🟢 Libre" : "🟡 Ocupada"}
                          {atencion ? ` — Atención ${atencion.numero_atencion}` : ""}
                        </option>
                      );
                    })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {mesaId && (() => {
                const mesa = mesas.find((m) => m.id === mesaId);
                if (mesa?.estado === "disponible" && !atencionId) {
                  return (
                    <p className="text-xs text-emerald-600 mt-1">
                      ✓ Mesa libre — se asignará automáticamente al crear el pedido.
                    </p>
                  );
                }
                if (atencionId) {
                  return (
                    <p className="text-xs text-brand-bronze mt-1">
                      Vinculado a atención #{atenciones.find((a) => a.id === atencionId)?.numero_atencion}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Empaques selector (para llevar / domicilio) */}
          {tipoEntrega !== "local" && filteredEmpaques.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                <Package className="h-3.5 w-3.5" />
                Empaques {tipoEntrega === "domicilio" && <span className="text-red-400">(mín. 1)</span>}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredEmpaques.map((tipo) => {
                  const cant = cartEmpaques.get(tipo.id) || 0;
                  return (
                    <div key={tipo.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{tipo.nombre}</p>
                        <p className="text-[10px] text-gray-400">${tipo.precio}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateEmpaqueCantidad(tipo.id, -1)}
                          className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-xs"
                          disabled={cant === 0}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-semibold w-5 text-center">{cant}</span>
                        <button
                          onClick={() => updateEmpaqueCantidad(tipo.id, 1)}
                          className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-xs"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras sueltos selector */}
          {allExtras.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                <Plus className="h-3.5 w-3.5" />
                Extras sueltos (sin plato)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allExtras.map((extra) => {
                  const cant = cartExtrasSueltos.get(extra.id) || 0;
                  return (
                    <div key={extra.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{extra.nombre}</p>
                        <p className="text-[10px] text-gray-400">${extra.precio}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateExtraSueltoCantidad(extra.id, -1)}
                          className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-xs"
                          disabled={cant === 0}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-semibold w-5 text-center">{cant}</span>
                        <button
                          onClick={() => updateExtraSueltoCantidad(extra.id, 1)}
                          className="h-6 w-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-xs"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery cost (solo domicilio) */}
          {tipoEntrega === "domicilio" && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <Truck className="h-3.5 w-3.5" />
                Costo de Delivery
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costoDelivery}
                onChange={(e) => setCostoDelivery(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          )}

          {/* Fecha personalizada (solo staff/superusuario) */}
          {user?.is_staff && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Fecha del Pedido
              </label>
              <input
                type="datetime-local"
                value={fechaPedido}
                onChange={(e) => setFechaPedido(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none"
              />
              {fechaPedido && (
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-amber-600">Se registrará con esta fecha</p>
                  <button
                    onClick={() => setFechaPedido("")}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    Usar fecha actual
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="px-5 py-3">
          {cart.length === 0 && cartPromos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Agrega ítems del menú</p>
              <p className="text-xs text-gray-300 mt-1">Haz clic en un plato o promoción para agregarlo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="group">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.menuItem.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        ${item.menuItem.price} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 w-16 text-right">
                      ${((parseFloat(item.menuItem.price) + (item.extras_seleccionados || []).reduce((s, e) => s + parseFloat(e.precio), 0)) * item.cantidad).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.menuItem.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Item notes */}
                  {showNotesFor === item.menuItem.id ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ej: sin cebolla, extra queso..."
                        value={item.notas}
                        onChange={(e) => updateItemNotes(item.menuItem.id, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => setShowNotesFor(null)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNotesFor(item.menuItem.id)}
                      className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-brand-gold transition-colors"
                    >
                      <StickyNote className="h-3 w-3" />
                      {item.notas || "Agregar nota"}
                    </button>
                  )}

                  {/* Sauce selector for Alitas */}
                  {getMaxSalsas(item.menuItem) > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs font-medium text-amber-800 mb-1.5">
                        🍗 Elige {getMaxSalsas(item.menuItem)} salsa{getMaxSalsas(item.menuItem) > 1 ? "s" : ""}:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {SALSAS_DISPONIBLES.map((salsa) => {
                          const selected = item.salsas_seleccionadas?.includes(salsa);
                          const maxReached =
                            !selected &&
                            (item.salsas_seleccionadas?.length || 0) >= getMaxSalsas(item.menuItem);
                          return (
                            <button
                              key={salsa}
                              type="button"
                              onClick={() => toggleSalsa(item.menuItem.id, salsa)}
                              disabled={maxReached}
                              className={clsx(
                                "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                selected
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : maxReached
                                    ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                    : "bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
                              )}
                            >
                              {salsa}
                            </button>
                          );
                        })}
                      </div>
                      {(item.salsas_seleccionadas?.length || 0) < getMaxSalsas(item.menuItem) && (
                        <p className="text-[10px] text-amber-600 mt-1">
                          Faltan {getMaxSalsas(item.menuItem) - (item.salsas_seleccionadas?.length || 0)} por elegir
                        </p>
                      )}
                    </div>
                  )}

                  {/* Extras selector */}
                  {item.menuItem.extras_disponibles && item.menuItem.extras_disponibles.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-medium text-blue-800 mb-1.5">
                        ➕ Extras disponibles:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {item.menuItem.extras_disponibles.map((extra) => {
                          const selected = item.extras_seleccionados?.some((e) => e.extra_id === extra.id);
                          return (
                            <button
                              key={extra.id}
                              type="button"
                              onClick={() => toggleExtra(item.menuItem.id, extra)}
                              className={clsx(
                                "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                selected
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
                              )}
                            >
                              {extra.nombre} (+${extra.precio})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* ── Promo items in cart ── */}
              {cartPromos.length > 0 && (
                <>
                  {cart.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      <span className="text-xs font-semibold text-purple-600 uppercase">Promociones</span>
                      <div className="flex-1 border-t border-purple-200" />
                    </div>
                  )}
                  {cartPromos.map((cp) => {
                    const precio = promoPrice(cp.promocion, cp.selectedItem);
                    const cartKey = `promo-${cp.promocion.id}-${cp.selectedItem?.id || ""}`;
                    return (
                      <div key={cartKey} className="group">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {cp.promocion.nombre}
                            </p>
                            {cp.selectedItem && (
                              <p className="text-xs text-gray-600 truncate">
                                → {cp.selectedItem.name}
                              </p>
                            )}
                            <p className="text-xs text-purple-500">
                              ${precio.toFixed(2)} c/u · {cp.promocion.tipo_display}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updatePromoQuantity(cp.promocion.id, -1, cp.selectedItem?.id)}
                              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">{cp.cantidad}</span>
                            <button
                              onClick={() => updatePromoQuantity(cp.promocion.id, 1, cp.selectedItem?.id)}
                              className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 w-16 text-right">
                            ${(precio * cp.cantidad).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removePromoFromCart(cp.promocion.id, cp.selectedItem?.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* General notes */}
        <div className="px-5 py-3 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-1">Notas generales</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones del pedido..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-gold focus:outline-none resize-none"
          />
        </div>

        {/* Discount code */}
        <div className="px-5 py-3 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            <Tag className="inline h-3 w-3 mr-1" />
            Código de descuento (opcional)
          </label>
          {codigoDescuento ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-green-700">
                  {codigoDescuento.porcentaje}% — {codigoDescuento.nombre_titular}
                </p>
                <p className="text-[10px] text-green-600">
                  {codigoDescuento.tipo === "socio" ? "Socio" : "Empleado"}
                  {codigoDescuento.secciones.length > 0
                    ? ` · Solo: ${codigoDescuento.secciones.join(", ")}`
                    : " · Todo el menú"}
                  {" · No aplica a promos"}
                </p>
                <p className="text-[10px] text-green-700 font-medium mt-0.5">
                  Base: ${parseFloat(codigoDescuento.subtotal_aplicable).toFixed(2)} → Dcto: -${parseFloat(codigoDescuento.monto_descuento).toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleRemoverCodigo}
                className="p-1 rounded hover:bg-green-100 text-green-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: SOCIO-001"
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleValidarCodigo()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-gold focus:outline-none uppercase"
              />
              <button
                onClick={handleValidarCodigo}
                disabled={validandoCodigo || !codigoInput.trim()}
                className="px-3 py-2 rounded-lg bg-brand-gold text-white text-xs font-medium hover:bg-brand-bronze disabled:opacity-50 transition-colors"
              >
                {validandoCodigo ? "..." : "Aplicar"}
              </button>
            </div>
          )}
        </div>

        </div>{/* end scrollable middle */}

        {/* Total & Submit */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Subtotal Ítems</span>
            <span className="text-sm text-gray-700">${cartTotal.toFixed(2)}</span>
          </div>
          {promosTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Promociones</span>
              <span className="text-sm text-purple-600">${promosTotal.toFixed(2)}</span>
            </div>
          )}
          {empaquesTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Empaques</span>
              <span className="text-sm text-gray-700">${empaquesTotal.toFixed(2)}</span>
            </div>
          )}
          {extrasSueltosTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Extras sueltos</span>
              <span className="text-sm text-blue-600">${extrasSueltosTotal.toFixed(2)}</span>
            </div>
          )}
          {deliveryTotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Delivery</span>
              <span className="text-sm text-gray-700">${deliveryTotal.toFixed(2)}</span>
            </div>
          )}
          {codigoDescuento && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-green-600">
                Dcto {codigoDescuento.porcentaje}% sobre ${parseFloat(codigoDescuento.subtotal_aplicable).toFixed(2)}
              </span>
              <span className="text-sm font-medium text-green-600">-${parseFloat(codigoDescuento.monto_descuento).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-brand-gold">${grandTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => handleSubmit()}
            disabled={saving || (cart.length === 0 && cartPromos.length === 0 && cartExtrasSueltos.size === 0)}
            className="w-full py-3 px-4 rounded-xl bg-brand-gold text-white font-semibold text-sm hover:bg-brand-bronze focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              "Creando pedido..."
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Crear Pedido — ${grandTotal.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══ STOCK INSUFICIENTE MODAL ═══ */}
      {stockError && (
        <StockInsuficienteModal
          data={stockError}
          onClose={() => setStockError(null)}
        />
      )}

      {/* ═══ EMPAQUE WARNING MODAL ═══ */}
      {showEmpaqueWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sin empaques seleccionados</h3>
            </div>
            <p className="text-gray-600 mb-6">
              No has indicado la cantidad de empaques que vas a utilizar para este pedido.
              ¿Deseas continuar sin empaques?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEmpaqueWarning(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                Seleccionar empaques
              </button>
              <button
                onClick={() => {
                  setShowEmpaqueWarning(false);
                  handleSubmit(true);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium"
              >
                Continuar sin empaques
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROMO SELECTION MODAL ═══ */}
      {selectionPromo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectionPromo.nombre}
                </h3>
                <p className="text-sm text-purple-600">
                  {selectionPromo.tipo === "adicional"
                    ? `Selecciona el producto base (+$${parseFloat(selectionPromo.precio_extra || "0").toFixed(2)} adicional)`
                    : `Selecciona el producto (${selectionPromo.cantidad_requerida || 2} unidades por $${parseFloat(selectionPromo.precio_promocional || "0").toFixed(2)})`}
                </p>
              </div>
              <button
                onClick={() => setSelectionPromo(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectionTriggerItems.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay productos disponibles para esta promoción</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectionTriggerItems.map((item) => {
                    const isAdicional = selectionPromo.tipo === "adicional";
                    const displayPrice = isAdicional
                      ? parseFloat(item.price) + parseFloat(selectionPromo.precio_extra || "0")
                      : parseFloat(selectionPromo.precio_promocional || "0");
                    return (
                      <button
                        key={item.id}
                        onClick={() => addPromoWithSelectedItem(selectionPromo, item)}
                        className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-white hover:border-purple-400 hover:shadow-md text-left transition-all"
                      >
                        <div className="h-12 w-12 rounded-lg bg-brand-sage flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <UtensilsCrossed className="h-5 w-5 text-brand-sage-dark" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">${item.price} c/u</p>
                          <p className="text-sm font-bold text-purple-600">
                            {isAdicional ? `Total: $${displayPrice.toFixed(2)}` : `${selectionPromo.cantidad_requerida || 2} × $${displayPrice.toFixed(2)}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
