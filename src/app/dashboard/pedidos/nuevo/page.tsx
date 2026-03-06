"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";
import type { MenuItem, Category, Mesa, Atencion, PaginatedResponse } from "@/lib/types";
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
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from query params (when coming from Mesas page)
  const preselectedMesa = searchParams.get("mesa");
  const preselectedAtencion = searchParams.get("atencion");

  /* ── Data states ── */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [atenciones, setAtenciones] = useState<Atencion[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── Form states ── */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<string>(preselectedMesa ? "local" : "local");
  const [mesaId, setMesaId] = useState<number | "">(preselectedMesa ? Number(preselectedMesa) : "");
  const [atencionId, setAtencionId] = useState<number | "">(preselectedAtencion ? Number(preselectedAtencion) : "");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  /* ── Filter states ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null);

  /* ── Stock check ── */
  const [stockError, setStockError] = useState<StockErrorResponse | null>(null);
  const [stockWarnings, setStockWarnings] = useState<Map<number, number>>(new Map()); // menuItemId → porciones_posibles

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [menuRes, catRes, mesasRes, atencionesRes] = await Promise.all([
          api.get<PaginatedResponse<MenuItem>>("/menu-items/?page_size=200&is_available=true"),
          api.get<PaginatedResponse<Category>>("/categorias/?page_size=50"),
          api.get<PaginatedResponse<Mesa>>("/mesas/"),
          api.get("/atenciones/activas/"),
        ]);
        setMenuItems(menuRes.data.results || []);
        setCategories(catRes.data.results || []);
        setMesas(mesasRes.data.results || []);
        setAtenciones(Array.isArray(atencionesRes.data) ? atencionesRes.data : atencionesRes.data.results || []);
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
      return [...prev, { menuItem: item, cantidad: 1, notas: "" }];
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

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + parseFloat(c.menuItem.price) * c.cantidad, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.cantidad, 0), [cart]);

  /* ── Submit order ── */
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un ítem al pedido");
      return;
    }

    if (tipoEntrega === "local" && !mesaId) {
      toast.error("Selecciona una mesa para consumo en local");
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
        })),
      };

      if (tipoEntrega === "local") {
        if (mesaId) payload.mesa = mesaId;
        if (atencionId) payload.atencion = atencionId;
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
          </div>
        </div>

        {/* Menu Items Grid – grouped by category */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[50vh] lg:min-h-0">
          {totalFilteredItems === 0 ? (
            <div className="text-center py-16">
              <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">No se encontraron ítems</p>
            </div>
          ) : (
            <div className="space-y-6">
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
            {cartCount} {cartCount === 1 ? "ítem" : "ítems"}
          </span>
        </div>

        {/* Order Config */}
        <div className="px-5 py-3 border-b border-gray-100 space-y-3">
          {/* Tipo de entrega */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de Entrega</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "local", label: "Local", icon: Armchair },
                { value: "para_llevar", label: "Llevar", icon: ShoppingCart },
                { value: "domicilio", label: "Delivery", icon: UtensilsCrossed },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTipoEntrega(opt.value)}
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
                    .filter((m) => m.estado === "ocupada" || m.estado === "disponible")
                    .sort((a, b) => a.numero - b.numero)
                    .map((m) => {
                      const atencion = getAtencionForMesa(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          Mesa {m.numero} ({m.capacidad} pers.) — {m.estado}
                          {atencion ? ` — Atención ${atencion.numero_atencion}` : ""}
                        </option>
                      );
                    })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              {mesaId && atencionId && (
                <p className="text-xs text-brand-bronze mt-1">
                  Vinculado a atención #{atenciones.find((a) => a.id === atencionId)?.numero_atencion}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Agrega ítems del menú</p>
              <p className="text-xs text-gray-300 mt-1">Haz clic en un plato para agregarlo</p>
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
                      ${(parseFloat(item.menuItem.price) * item.cantidad).toFixed(2)}
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
                </div>
              ))}
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

        {/* Total & Submit */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50/50 rounded-b-xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm text-gray-700">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-brand-gold">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || cart.length === 0}
            className="w-full py-3 px-4 rounded-xl bg-brand-gold text-white font-semibold text-sm hover:bg-brand-bronze focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              "Creando pedido..."
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Crear Pedido — ${cartTotal.toFixed(2)}
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
    </div>
  );
}
