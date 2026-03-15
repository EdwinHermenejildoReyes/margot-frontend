"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { MenuItem, Category, PaginatedResponse, Promocion } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  Pencil,
  Plus,
  Minus,
  Trash2,
  Save,
  X,
  Search,
  UtensilsCrossed,
  StickyNote,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import StockInsuficienteModal, {
  type StockErrorResponse,
} from "@/components/StockInsuficienteModal";

/* ── Interfaces ── */

interface DetallePedido {
  id: number;
  menu_item: number;
  menu_item_nombre?: string;
  menu_item_name?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  notas?: string;
}

interface PromocionPedido {
  id: number;
  promocion: number;
  promocion_nombre: string;
  promocion_tipo: string;
  promocion_tipo_display: string;
  menu_item_seleccionado?: number;
  menu_item_seleccionado_nombre?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

interface PedidoDetail {
  id: number;
  numero_pedido: string;
  estado: string;
  tipo_entrega: string;
  subtotal: string;
  impuestos: string;
  descuento: string;
  total: string;
  notas?: string;
  created_at: string;
  fecha_confirmacion?: string;
  fecha_entrega?: string;
  mesa?: number;
  atencion?: number;
  detalles: DetallePedido[];
  promociones?: PromocionPedido[];
  pagos: Array<{
    id: number;
    metodo_pago: string;
    monto: string;
    estado: string;
  }>;
}

interface EditItem {
  menu_item_id: number;
  name: string;
  price: number;
  cantidad: number;
  notas: string;
}

interface EditPromo {
  promocion_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  menu_item_seleccionado?: number;
  menu_item_seleccionado_nombre?: string;
}

/* ── Component ── */

export default function PedidoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [pedido, setPedido] = useState<PedidoDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* edit mode */
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [editPromos, setEditPromos] = useState<EditPromo[]>([]);
  const [editNotas, setEditNotas] = useState("");
  const [saving, setSaving] = useState(false);

  /* add-item modal */
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allPromos, setAllPromos] = useState<Promocion[]>([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCategory, setMenuCategory] = useState<number | "promociones" | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [notesOpenFor, setNotesOpenFor] = useState<number | null>(null);
  const [stockError, setStockError] = useState<StockErrorResponse | null>(null);
  const [stockAction, setStockAction] = useState<"confirmar" | "preparar">("confirmar");

  /* ── Fetch pedido ── */
  const fetchPedido = async () => {
    try {
      const { data } = await api.get(`/pedidos/${params.id}/`);
      setPedido(data);
    } catch {
      toast.error("Error al cargar el pedido");
      router.push("/dashboard/pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Auto-refresh every 10s to reflect state changes from other users
  useEffect(() => {
    if (editing) return; // Don't refresh while editing
    const interval = setInterval(fetchPedido, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, editing]);

  /* ── Actions ── */
  const handleAction = async (action: string) => {
    try {
      await api.post(`/pedidos/${params.id}/${action}/`);
      toast.success(`Pedido ${action} exitosamente`);
      fetchPedido();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: StockErrorResponse } };
      if (
        axiosErr.response?.status === 409 &&
        axiosErr.response.data?.error === "stock_insuficiente"
      ) {
        setStockError(axiosErr.response.data);
        setStockAction(action === "preparar" ? "preparar" : "confirmar");
      } else {
        toast.error(`Error al ${action} el pedido`);
      }
    }
  };

  /* ── Edit mode helpers ── */
  const startEditing = () => {
    if (!pedido) return;
    setEditItems(
      pedido.detalles.map((d) => ({
        menu_item_id: d.menu_item,
        name: d.menu_item_nombre || d.menu_item_name || `Ítem #${d.menu_item}`,
        price: parseFloat(d.precio_unitario),
        cantidad: d.cantidad,
        notas: d.notas || "",
      }))
    );
    setEditPromos(
      (pedido.promociones || []).map((p) => ({
        promocion_id: p.promocion,
        nombre: p.promocion_nombre,
        precio: parseFloat(p.precio_unitario),
        cantidad: p.cantidad,
        menu_item_seleccionado: p.menu_item_seleccionado,
        menu_item_seleccionado_nombre: p.menu_item_seleccionado_nombre,
      }))
    );
    setEditNotas(pedido.notas || "");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditItems([]);
    setEditPromos([]);
    setShowAddModal(false);
  };

  const updateQty = (idx: number, delta: number) => {
    setEditItems((prev) =>
      prev
        .map((item, i) =>
          i === idx ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemNotes = (idx: number, notas: string) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, notas } : item))
    );
  };

  const addItemFromMenu = (menuItem: MenuItem) => {
    setEditItems((prev) => {
      const existing = prev.findIndex((e) => e.menu_item_id === menuItem.id);
      if (existing >= 0) {
        return prev.map((item, i) =>
          i === existing ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [
        ...prev,
        {
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price: parseFloat(menuItem.price),
          cantidad: 1,
          notas: "",
        },
      ];
    });
    toast.success(`${menuItem.name} agregado`);
  };

  const addPromoFromList = (promo: Promocion) => {
    const precio = promo.tipo === "adicional"
      ? parseFloat(promo.precio_extra || "0")
      : parseFloat(promo.precio_promocional || "0");
    setEditPromos((prev) => {
      const existing = prev.findIndex((e) => e.promocion_id === promo.id);
      if (existing >= 0) {
        return prev.map((item, i) =>
          i === existing ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { promocion_id: promo.id, nombre: promo.nombre, precio, cantidad: 1 }];
    });
    toast.success(`${promo.nombre} agregado`);
  };

  const updatePromoQty = (idx: number, delta: number) => {
    setEditPromos((prev) =>
      prev
        .map((item, i) =>
          i === idx ? { ...item, cantidad: Math.max(0, item.cantidad + delta) } : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const removePromo = (idx: number) => {
    setEditPromos((prev) => prev.filter((_, i) => i !== idx));
  };

  const editTotal = useMemo(
    () =>
      editItems.reduce((sum, item) => sum + item.price * item.cantidad, 0) +
      editPromos.reduce((sum, p) => sum + p.precio * p.cantidad, 0),
    [editItems, editPromos]
  );

  /* ── Save edits ── */
  const saveEdits = async () => {
    if (editItems.length === 0 && editPromos.length === 0) {
      toast.error("El pedido debe tener al menos un ítem o promoción");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put(`/pedidos/${params.id}/editar_detalles/`, {
        notas: editNotas,
        detalles: editItems.map((item) => ({
          menu_item: item.menu_item_id,
          cantidad: item.cantidad,
          notas: item.notas || "",
        })),
        promociones: editPromos.map((p) => ({
          promocion: p.promocion_id,
          cantidad: p.cantidad,
          ...(p.menu_item_seleccionado ? { menu_item_seleccionado: p.menu_item_seleccionado } : {}),
        })),
      });
      setPedido(data);
      setEditing(false);
      toast.success("Pedido actualizado correctamente");
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  /* ── Fetch menu for add modal ── */
  const openAddModal = async () => {
    setShowAddModal(true);
    if (menuItems.length === 0) {
      setMenuLoading(true);
      try {
        const [menuRes, catRes, promosRes] = await Promise.all([
          api.get<PaginatedResponse<MenuItem>>("/menu-items/?page_size=200&is_available=true"),
          api.get<PaginatedResponse<Category>>("/categorias/?page_size=50"),
          api.get("/promociones/vigentes/"),
        ]);
        setMenuItems(menuRes.data.results || []);
        setCategories(catRes.data.results || []);
        setAllPromos(Array.isArray(promosRes.data) ? promosRes.data : promosRes.data.results || []);
      } catch {
        toast.error("Error al cargar el menú");
      } finally {
        setMenuLoading(false);
      }
    }
  };

  const filteredMenu = useMemo(() => {
    if (menuCategory === "promociones") return [];
    let items = menuItems;
    if (menuCategory) items = items.filter((i) => i.category === menuCategory);
    if (menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [menuItems, menuCategory, menuSearch]);

  const filteredModalPromos = useMemo(() => {
    if (menuCategory !== null && menuCategory !== "promociones") return [];
    if (!menuSearch.trim()) return allPromos;
    const q = menuSearch.toLowerCase();
    return allPromos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [allPromos, menuCategory, menuSearch]);

  /* ── Render ── */
  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!pedido) return null;

  const isPendiente = pedido.estado === "pendiente";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            Pedido {pedido.numero_pedido}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={pedido.estado} />
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(pedido.created_at).toLocaleString("es-ES")}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Edit button (only pendiente & not already editing) */}
          {isPendiente && !editing && (
            <button
              onClick={startEditing}
              className="px-4 py-2 rounded-lg bg-brand-gold text-white text-sm font-medium hover:bg-brand-bronze transition-colors flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          )}
          {/* Save / cancel while editing */}
          {editing && (
            <>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                onClick={saveEdits}
                disabled={saving || editItems.length === 0}
                className="px-4 py-2 rounded-lg bg-brand-gold text-white text-sm font-medium hover:bg-brand-bronze disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
          {/* ── Role-based workflow actions ── */}
          {!editing && (() => {
            const tipo = user?.tipo_usuario;
            const isAdmin = user?.is_staff || tipo === "comercio";
            const isMeseroCajero = tipo === "mesero" || tipo === "cajero";
            const isCocinero = tipo === "cocinero";

            return (
              <>
                {/* Mesero/Cajero/Admin: Confirmar pedido pendiente */}
                {isPendiente && (isAdmin || isMeseroCajero) && (
                  <>
                    <button
                      onClick={() => handleAction("confirmar")}
                      className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      ✅ Confirmar Pedido
                    </button>
                    <button
                      onClick={() => handleAction("cancelar")}
                      className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Cancelar Pedido
                    </button>
                  </>
                )}

                {/* Cocinero/Admin: Iniciar preparación de pedido confirmado */}
                {pedido?.estado === "confirmado" && (isAdmin || isCocinero) && (
                  <button
                    onClick={() => handleAction("preparar")}
                    className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    🔥 Iniciar Preparación
                  </button>
                )}

                {/* Cocinero/Admin: Marcar listo */}
                {pedido?.estado === "en_preparacion" && (isAdmin || isCocinero) && (
                  <button
                    onClick={() => handleAction("listo")}
                    className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                  >
                    ✅ Marcar Listo
                  </button>
                )}

                {/* Mesero/Cajero/Admin: Entregar pedido listo */}
                {pedido?.estado === "listo" && (isAdmin || isMeseroCajero) && (
                  <button
                    onClick={() => handleAction("entregar")}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                  >
                    🍽️ Entregar
                  </button>
                )}

                {/* Admin: cancel any non-final state */}
                {isAdmin && !["entregado", "cancelado"].includes(pedido?.estado || "") && !isPendiente && (
                  <button
                    onClick={() => handleAction("cancelar")}
                    className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Items panel ═══ */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ítems del Pedido</h2>
            {editing && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-sage text-brand-dark text-xs font-medium hover:bg-brand-sage-dark transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Ítem
              </button>
            )}
          </div>

          {/* ── View mode ── */}
          {!editing && (
            <div className="divide-y divide-gray-100">
              {pedido.detalles?.map((det) => (
                <div key={det.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {det.menu_item_nombre || det.menu_item_name || `Ítem #${det.menu_item}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      Cantidad: {det.cantidad} × ${det.precio_unitario}
                    </p>
                    {det.notas && (
                      <p className="text-xs text-gray-400 italic mt-1">📝 {det.notas}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${det.subtotal}</span>
                </div>
              ))}
              {/* Promotions in view mode */}
              {pedido.promociones && pedido.promociones.length > 0 && (
                <>
                  <div className="px-6 py-2 bg-purple-50 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700 uppercase">Promociones</span>
                  </div>
                  {pedido.promociones.map((pp) => (
                    <div key={`promo-${pp.id}`} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pp.promocion_nombre}</p>
                        {pp.menu_item_seleccionado_nombre && (
                          <p className="text-xs text-gray-600">→ {pp.menu_item_seleccionado_nombre}</p>
                        )}
                        <p className="text-xs text-purple-500">
                          {pp.promocion_tipo_display} · Cantidad: {pp.cantidad} × ${pp.precio_unitario}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">${pp.subtotal}</span>
                    </div>
                  ))}
                </>
              )}
              {(!pedido.detalles || pedido.detalles.length === 0) && (!pedido.promociones || pedido.promociones.length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-gray-400">Sin ítems</div>
              )}
            </div>
          )}

          {/* ── Edit mode ── */}
          {editing && (
            <div className="divide-y divide-gray-100">
              {editItems.map((item, idx) => (
                <div key={`${item.menu_item_id}-${idx}`} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">${item.price.toFixed(2)} c/u</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-8 text-center">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                      ${(item.price * item.cantidad).toFixed(2)}
                    </p>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Per-item notes */}
                  {notesOpenFor === idx ? (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={item.notas}
                        onChange={(e) => updateItemNotes(idx, e.target.value)}
                        placeholder="Ej: sin cebolla, extra queso..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-brand-gold focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => setNotesOpenFor(null)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <X className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNotesOpenFor(idx)}
                      className="mt-1 flex items-center gap-1 text-xs text-gray-400 hover:text-brand-gold transition-colors"
                    >
                      <StickyNote className="h-3 w-3" />
                      {item.notas || "Agregar nota"}
                    </button>
                  )}
                </div>
              ))}

              {/* Promotions in edit mode */}
              {editPromos.length > 0 && (
                <>
                  <div className="px-6 py-2 bg-purple-50 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-700 uppercase">Promociones</span>
                  </div>
                  {editPromos.map((p, idx) => (
                    <div key={`edit-promo-${p.promocion_id}-${idx}`} className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                          {p.menu_item_seleccionado_nombre && (
                            <p className="text-xs text-gray-600">→ {p.menu_item_seleccionado_nombre}</p>
                          )}
                          <p className="text-xs text-purple-500">${p.precio.toFixed(2)} c/u</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updatePromoQty(idx, -1)}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-semibold w-8 text-center">{p.cantidad}</span>
                          <button
                            onClick={() => updatePromoQty(idx, 1)}
                            className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                          ${(p.precio * p.cantidad).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removePromo(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {editItems.length === 0 && editPromos.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-gray-400">
                  Sin ítems. Agrega al menos uno para guardar.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ Sidebar (summary, info, pagos) ═══ */}
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  ${editing ? editTotal.toFixed(2) : pedido.subtotal}
                </span>
              </div>
              {!editing && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Impuestos</span>
                    <span className="text-gray-900">${pedido.impuestos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Descuento</span>
                    <span className="text-green-600">-${pedido.descuento}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-brand-gold text-lg">
                  ${editing ? editTotal.toFixed(2) : pedido.total}
                </span>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Información</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="capitalize">
                  {pedido.tipo_entrega?.replace(/_/g, " ")}
                </span>
              </div>
              {editing ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Notas del pedido
                  </label>
                  <textarea
                    value={editNotas}
                    onChange={(e) => setEditNotas(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-brand-gold focus:outline-none resize-none"
                    placeholder="Observaciones..."
                  />
                </div>
              ) : (
                pedido.notas && (
                  <div className="p-3 rounded-lg bg-yellow-50 text-yellow-800 text-xs">
                    <strong>Notas:</strong> {pedido.notas}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Pagos */}
          {pedido.pagos && pedido.pagos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Pagos</h2>
              <div className="space-y-2">
                {pedido.pagos.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-gray-600">
                      <CreditCard className="h-4 w-4" />
                      <span className="capitalize">
                        {pago.metodo_pago?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${pago.monto}</span>
                      <StatusBadge status={pago.estado} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STOCK INSUFICIENTE MODAL ═══ */}
      {stockError && (
        <StockInsuficienteModal
          data={stockError}
          onClose={() => setStockError(null)}
          action={stockAction}
        />
      )}

      {/* ═══ ADD ITEM MODAL ═══ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Agregar Ítems al Pedido
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & category filters */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ítems..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setMenuCategory(null)}
                  className={
                    !menuCategory
                      ? "px-3 py-1 rounded-full text-xs font-medium bg-brand-gold text-white"
                      : "px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setMenuCategory(cat.id)}
                    className={
                      menuCategory === cat.id
                        ? "px-3 py-1 rounded-full text-xs font-medium bg-brand-gold text-white"
                        : "px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
                  >
                    {cat.name}
                  </button>
                ))}
                {allPromos.length > 0 && (
                  <button
                    onClick={() => setMenuCategory("promociones")}
                    className={
                      menuCategory === "promociones"
                        ? "px-3 py-1 rounded-full text-xs font-medium bg-purple-600 text-white flex items-center gap-1"
                        : "px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1"
                    }
                  >
                    <Sparkles className="h-3 w-3" />
                    Promos
                  </button>
                )}
              </div>
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {menuLoading ? (
                <LoadingSpinner />
              ) : filteredMenu.length === 0 && filteredModalPromos.length === 0 ? (
                <div className="text-center py-12">
                  <UtensilsCrossed className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No se encontraron ítems</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Promotions grid in modal */}
                  {filteredModalPromos.length > 0 && (
                    <div>
                      {filteredMenu.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-700 uppercase">Promociones</span>
                          <div className="flex-1 border-t border-purple-200" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredModalPromos.map((promo) => {
                          const inEdit = editPromos.find((e) => e.promocion_id === promo.id);
                          const precio = promo.tipo === "adicional"
                            ? parseFloat(promo.precio_extra || "0")
                            : parseFloat(promo.precio_promocional || "0");
                          return (
                            <button
                              key={`promo-${promo.id}`}
                              onClick={() => addPromoFromList(promo)}
                              className={
                                inEdit
                                  ? "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm border-purple-500 bg-purple-50"
                                  : "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm border-gray-200 bg-white hover:border-purple-300"
                              }
                            >
                              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-purple-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{promo.nombre}</p>
                                <p className="text-xs text-purple-500">{promo.tipo_display}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-purple-600">${precio.toFixed(2)}</p>
                                {inEdit && (
                                  <span className="text-xs text-purple-500">×{inEdit.cantidad}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Menu items grid in modal */}
                  {filteredMenu.length > 0 && (
                    <div>
                      {filteredModalPromos.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <UtensilsCrossed className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-500 uppercase">Ítems del menú</span>
                          <div className="flex-1 border-t border-gray-200" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredMenu.map((mi) => {
                          const inEdit = editItems.find((e) => e.menu_item_id === mi.id);
                          return (
                            <button
                              key={mi.id}
                              onClick={() => addItemFromMenu(mi)}
                              className={
                                inEdit
                                  ? "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm border-brand-gold bg-brand-sage/30"
                                  : "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm border-gray-200 bg-white hover:border-brand-gold/50"
                              }
                            >
                              <div className="h-10 w-10 rounded-lg bg-brand-sage flex items-center justify-center flex-shrink-0">
                                <UtensilsCrossed className="h-5 w-5 text-brand-dark" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{mi.name}</p>
                                <p className="text-xs text-gray-400">{mi.category_name}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-brand-gold">${mi.price}</p>
                                {inEdit && (
                                  <span className="text-xs text-brand-bronze">×{inEdit.cantidad}</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {editItems.length + editPromos.length} ítem{editItems.length + editPromos.length !== 1 ? "s" : ""} ·
                Total:{" "}
                <span className="font-semibold text-brand-gold">
                  ${editTotal.toFixed(2)}
                </span>
              </p>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-brand-gold text-white text-sm font-medium hover:bg-brand-bronze transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
