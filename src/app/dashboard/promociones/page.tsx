"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type {
  Promocion,
  PromocionItem,
  MenuItem,
  Category,
  PaginatedResponse,
} from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  X,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calendar,
  DollarSign,
  Package,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

/* ── Tipo labels ── */
const TIPO_LABELS: Record<string, string> = {
  nxm: "N × M",
  combo: "Combo",
  adicional: "Adicional",
};

const TIPO_COLORS: Record<string, string> = {
  nxm: "bg-blue-100 text-blue-700",
  combo: "bg-purple-100 text-purple-700",
  adicional: "bg-amber-100 text-amber-700",
};

export default function PromocionesPage() {
  const { user } = useAuth();
  const canEdit = canManage(user, "promociones");

  const [promos, setPromos] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promocion | null>(null);

  /* ── Fetch promos ── */
  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (filterTipo) params.tipo = filterTipo;
      if (filterActive) params.is_active = filterActive;
      const { data } = await api.get<PaginatedResponse<Promocion>>(
        "/promociones/",
        { params }
      );
      setPromos(data.results);
      setTotalCount(data.count);
    } catch {
      toast.error("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  }, [page, search, filterTipo, filterActive]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta promoción?")) return;
    try {
      await api.delete(`/promociones/${id}/`);
      toast.success("Promoción eliminada");
      fetchPromos();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  const formatPrice = (p?: string) => (p ? `$${p}` : "—");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Promociones
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} {totalCount === 1 ? "promoción" : "promociones"}{" "}
            registradas
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setEditPromo(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Promoción
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar promociones..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos los tipos</option>
              <option value="nxm">N × M</option>
              <option value="combo">Combo</option>
              <option value="adicional">Adicional</option>
            </select>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promos List */}
      {loading ? (
        <LoadingSpinner />
      ) : promos.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No se encontraron promociones</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Header bar */}
              <div
                className={clsx(
                  "px-5 py-3 flex items-center justify-between",
                  promo.vigente
                    ? "bg-gradient-to-r from-purple-500 to-purple-600"
                    : "bg-gray-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={clsx(
                      "h-4 w-4",
                      promo.vigente ? "text-white" : "text-gray-500"
                    )}
                  />
                  <span
                    className={clsx(
                      "text-xs font-bold uppercase tracking-wide",
                      promo.vigente ? "text-white" : "text-gray-500"
                    )}
                  >
                    {TIPO_LABELS[promo.tipo] || promo.tipo}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditPromo(promo);
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {promo.nombre}
                </h3>
                {promo.descripcion && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                    {promo.descripcion}
                  </p>
                )}

                {/* Prices */}
                <div className="flex flex-wrap gap-3 mb-3">
                  {promo.tipo === "adicional" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
                      <DollarSign className="h-3.5 w-3.5" />+
                      {promo.precio_extra}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatPrice(promo.precio_promocional)}
                    </span>
                  )}
                  {promo.cantidad_requerida && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      <Package className="h-3.5 w-3.5" />
                      {promo.cantidad_requerida} req.
                    </span>
                  )}
                </div>

                {/* Status & dates */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <StatusBadge
                    status={
                      promo.vigente
                        ? "disponible"
                        : promo.is_active
                          ? "pendiente"
                          : "cancelado"
                    }
                  />
                  {promo.fecha_inicio && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(promo.fecha_inicio).toLocaleDateString("es-ES")}
                    </span>
                  )}
                  {promo.fecha_fin && (
                    <span>
                      —{" "}
                      {new Date(promo.fecha_fin).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <PromocionModal
          promo={editPromo}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchPromos();
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Modal de Crear / Editar Promoción
   ═══════════════════════════════════════════════════════ */

function PromocionModal({
  promo,
  onClose,
  onSaved,
}: {
  promo: Promocion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!promo;

  /* ── Load detail for edit ── */
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<Promocion | null>(null);

  useEffect(() => {
    if (!promo) return;
    setDetailLoading(true);
    api
      .get(`/promociones/${promo.id}/`)
      .then(({ data }) => setDetail(data))
      .catch(() => toast.error("Error al cargar detalle"))
      .finally(() => setDetailLoading(false));
  }, [promo]);

  /* ── Load menu items & categories for item picker ── */
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<MenuItem>>("/menu-items/?page_size=200"),
      api.get<PaginatedResponse<Category>>("/categorias/?page_size=50"),
    ]).then(([menuRes, catRes]) => {
      setMenuItems(menuRes.data.results || []);
      setCategories(catRes.data.results || []);
    });
  }, []);

  /* ── Form state ── */
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "nxm" as "nxm" | "combo" | "adicional",
    is_active: true,
    cantidad_requerida: "",
    precio_promocional: "",
    precio_extra: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [items, setItems] = useState<PromocionItem[]>([]);
  const [saving, setSaving] = useState(false);

  /* ── Populate form when detail loads ── */
  useEffect(() => {
    if (!detail) return;
    setForm({
      nombre: detail.nombre,
      descripcion: detail.descripcion || "",
      tipo: detail.tipo,
      is_active: detail.is_active,
      cantidad_requerida: detail.cantidad_requerida?.toString() || "",
      precio_promocional: detail.precio_promocional || "",
      precio_extra: detail.precio_extra || "",
      fecha_inicio: detail.fecha_inicio
        ? detail.fecha_inicio.slice(0, 16)
        : "",
      fecha_fin: detail.fecha_fin ? detail.fecha_fin.slice(0, 16) : "",
    });
    setItems(
      (detail.items || []).map((i) => ({
        rol: i.rol,
        menu_item: i.menu_item || undefined,
        menu_item_nombre: i.menu_item_nombre || undefined,
        category: i.category || undefined,
        category_nombre: i.category_nombre || undefined,
        cantidad: i.cantidad,
        precio_filtro: i.precio_filtro || undefined,
      }))
    );
  }, [detail]);

  /* ── Item helpers ── */
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { rol: "aplica", cantidad: 1 },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, patch: Partial<PromocionItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Agrega al menos un ítem a la promoción");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        tipo: form.tipo,
        is_active: form.is_active,
        cantidad_requerida:
          form.cantidad_requerida ? Number(form.cantidad_requerida) : null,
        precio_promocional:
          form.precio_promocional || null,
        precio_extra: form.precio_extra || null,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        items: items.map((item) => ({
          rol: item.rol,
          menu_item: item.menu_item || null,
          category: item.category || null,
          cantidad: item.cantidad,
          precio_filtro: item.precio_filtro || null,
        })),
      };

      if (isEdit && promo) {
        await api.put(`/promociones/${promo.id}/`, payload);
        toast.success("Promoción actualizada");
      } else {
        await api.post("/promociones/", payload);
        toast.success("Promoción creada");
      }
      onSaved();
    } catch {
      toast.error("Error al guardar la promoción");
    } finally {
      setSaving(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {isEdit ? "Editar Promoción" : "Nueva Promoción"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              value={form.nombre}
              onChange={(e) =>
                setForm({ ...form, nombre: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
              placeholder="Ej: Cócteles 2×5"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Describe la promoción..."
            />
          </div>

          {/* Tipo + Activa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de promoción
              </label>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipo: e.target.value as "nxm" | "combo" | "adicional",
                  })
                }
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="nxm">N × M (ej: 2×5)</option>
                <option value="combo">Combo a precio fijo</option>
                <option value="adicional">Adicional por compra</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Activa
              </label>
            </div>
          </div>

          {/* Pricing fields — conditional on tipo */}
          <div className="grid grid-cols-3 gap-4">
            {(form.tipo === "nxm" || form.tipo === "combo") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio promocional ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_promocional}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      precio_promocional: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="5.00"
                />
              </div>
            )}
            {form.tipo === "adicional" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio extra ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_extra}
                  onChange={(e) =>
                    setForm({ ...form, precio_extra: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="1.00"
                />
              </div>
            )}
            {form.tipo === "nxm" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad requerida (N)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad_requerida}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cantidad_requerida: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="2"
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha inicio (opcional)
              </label>
              <input
                type="datetime-local"
                value={form.fecha_inicio}
                onChange={(e) =>
                  setForm({ ...form, fecha_inicio: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha fin (opcional)
              </label>
              <input
                type="datetime-local"
                value={form.fecha_fin}
                onChange={(e) =>
                  setForm({ ...form, fecha_fin: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ── Items de la promoción ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Ítems de la promoción
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Agregar ítem
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <Tag className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Agrega los productos que participan en esta promoción
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <PromoItemRow
                    key={idx}
                    item={item}
                    menuItems={menuItems}
                    categories={categories}
                    tipo={form.tipo}
                    onChange={(patch) => updateItem(idx, patch)}
                    onRemove={() => removeItem(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Actualizar"
                  : "Crear Promoción"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Row de un ítem de la promoción
   ═══════════════════════════════════════════════════════ */

function PromoItemRow({
  item,
  menuItems,
  categories,
  tipo,
  onChange,
  onRemove,
}: {
  item: PromocionItem;
  menuItems: MenuItem[];
  categories: Category[];
  tipo: string;
  onChange: (patch: Partial<PromocionItem>) => void;
  onRemove: () => void;
}) {
  const [useCategory, setUseCategory] = useState(!!item.category);

  return (
    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
      <div className="flex items-center gap-2">
        {/* Rol */}
        <select
          value={item.rol}
          onChange={(e) =>
            onChange({ rol: e.target.value as "aplica" | "adicional" })
          }
          className="px-2 py-1.5 rounded-lg border text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="aplica">
            {tipo === "adicional" ? "Gatillo" : "Aplica"}
          </option>
          <option value="adicional">Bonus / Se agrega</option>
        </select>

        {/* Toggle: product vs category */}
        <div className="flex rounded-lg bg-white border border-gray-200 text-xs overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setUseCategory(false);
              onChange({ category: undefined, category_nombre: undefined });
            }}
            className={clsx(
              "px-2 py-1 transition-colors",
              !useCategory
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            Producto
          </button>
          <button
            type="button"
            onClick={() => {
              setUseCategory(true);
              onChange({
                menu_item: undefined,
                menu_item_nombre: undefined,
              });
            }}
            className={clsx(
              "px-2 py-1 transition-colors",
              useCategory
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            Categoría
          </button>
        </div>

        <div className="flex-1" />
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex gap-2">
        {/* Selector */}
        {useCategory ? (
          <select
            value={item.category || ""}
            onChange={(e) =>
              onChange({
                category: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="flex-1 px-2 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={item.menu_item || ""}
            onChange={(e) =>
              onChange({
                menu_item: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            className="flex-1 px-2 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">Seleccionar producto...</option>
            {menuItems.map((mi) => (
              <option key={mi.id} value={mi.id}>
                {mi.name} — ${mi.price}
              </option>
            ))}
          </select>
        )}

        {/* Cantidad */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              onChange({ cantidad: Math.max(1, item.cantidad - 1) })
            }
            className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-xs"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-xs font-semibold w-5 text-center">
            {item.cantidad}
          </span>
          <button
            type="button"
            onClick={() => onChange({ cantidad: item.cantidad + 1 })}
            className="h-7 w-7 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-xs"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Precio filtro (solo NxM) */}
        {tipo === "nxm" && (
          <input
            type="number"
            step="0.01"
            min="0"
            value={item.precio_filtro || ""}
            onChange={(e) =>
              onChange({
                precio_filtro: e.target.value || undefined,
              })
            }
            placeholder="P. filtro"
            className="w-20 px-2 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}
