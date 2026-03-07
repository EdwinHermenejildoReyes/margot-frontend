"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManage } from "@/lib/permissions";
import type { MenuItem, Category, PaginatedResponse } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  X,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function MenuPage() {
  const { user } = useAuth();
  const canEdit = canManage(user, "menu");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      const { data } = await api.get<PaginatedResponse<MenuItem>>("/menu-items/", { params });
      setItems(data.results);
      setTotalCount(data.count);
    } catch {
      toast.error("Error al cargar el menú");
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Category>>("/categorias/");
      setCategories(data.results || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este ítem?")) return;
    try {
      await api.delete(`/menu-items/${id}/`);
      toast.success("Ítem eliminado");
      fetchItems();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} ítems en el menú</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditItem(null); setShowAddModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-white rounded-lg text-sm font-medium hover:bg-brand-bronze transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ítem
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
              placeholder="Buscar platos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value === "" ? "" : Number(e.target.value)); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No se encontraron ítems</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-brand-sage to-brand-sage-light relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <DollarSign className="h-12 w-12 text-brand-gold-light" />
                  </div>
                )}
                {item.is_featured && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-gold text-white text-xs font-medium">
                    <Star className="h-3 w-3" /> Destacado
                  </span>
                )}
                {/* Actions overlay */}
                {canEdit && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditItem(item); setShowAddModal(true); }}
                      className="p-2 rounded-lg bg-white/90 text-gray-700 hover:bg-white shadow-sm"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-white/90 text-red-600 hover:bg-white shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-400">{item.category_name}</p>
                  </div>
                  <span className="text-lg font-bold text-brand-gold">${item.price}</span>
                </div>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {item.preparation_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.preparation_time} min
                    </span>
                  )}
                  {item.calories && (
                    <span>{item.calories} cal</span>
                  )}
                  <StatusBadge status={item.is_available ? "disponible" : "cancelado"} />
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <MenuItemModal
          item={editItem}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSaved={() => { setShowAddModal(false); fetchItems(); }}
        />
      )}
    </div>
  );
}

// ── Modal for Add/Edit ──
function MenuItemModal({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price || "",
    category: item?.category || (categories[0]?.id || ""),
    is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false,
    preparation_time: item?.preparation_time || "",
    calories: item?.calories || "",
  });
  const [saving, setSaving] = useState(false);

  /* ── Image state ── */
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5 MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", String(form.price));
      formData.append("category", String(form.category));
      formData.append("is_available", String(form.is_available));
      formData.append("is_featured", String(form.is_featured));
      if (form.preparation_time) formData.append("preparation_time", String(form.preparation_time));
      if (form.calories) formData.append("calories", String(form.calories));

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (removeImage) {
        formData.append("image", "");
      }

      const config = { headers: { "Content-Type": "multipart/form-data" } };

      if (item) {
        await api.patch(`/menu-items/${item.id}/`, formData, config);
        toast.success("Ítem actualizado");
      } else {
        await api.post("/menu-items/", formData, config);
        toast.success("Ítem creado");
      }
      onSaved();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{item ? "Editar Ítem" : "Nuevo Ítem"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* ── Image Upload ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  "flex flex-col items-center justify-center gap-2 h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                  dragActive
                    ? "border-brand-gold bg-brand-gold/5"
                    : "border-gray-300 hover:border-brand-gold/50 hover:bg-gray-50"
                )}
              >
                {dragActive ? (
                  <Upload className="h-8 w-8 text-brand-gold" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-300" />
                )}
                <p className="text-sm text-gray-500">
                  {dragActive ? "Suelta aquí la imagen" : "Arrastra una imagen o haz clic para seleccionar"}
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP — máx. 5 MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo prep. (min)</label>
              <input type="number" value={form.preparation_time} onChange={(e) => setForm({ ...form, preparation_time: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calorías</label>
              <input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} className="w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold" />
              Disponible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-gray-300 text-brand-gold focus:ring-brand-gold" />
              Destacado
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold text-white text-sm font-medium hover:bg-brand-bronze disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
