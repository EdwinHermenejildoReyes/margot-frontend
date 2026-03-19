"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Utensils, Search } from "lucide-react";
import clsx from "clsx";

/* ── Tipos ── */
interface MenuItemPublic {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen: string | null;
  es_destacado: boolean;
}

interface CategoriaPublic {
  id: number;
  nombre: string;
  imagen: string | null;
  items: MenuItemPublic[];
}

/* ── API base ── */
function getApiBase(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8005/api/v1";
  return "https://api.margot.rest/api/v1";
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}

function MenuContent() {
  const searchParams = useSearchParams();
  const categoriaParam = searchParams.get("categoria");

  const [menu, setMenu] = useState<CategoriaPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    categoriaParam ? Number(categoriaParam) : null
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const base = getApiBase();
    fetch(`${base}/public/menu/completo/`)
      .then((r) => r.json())
      .then((data) => {
        setMenu(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Update selected category when URL param changes
  useEffect(() => {
    if (categoriaParam) {
      setSelectedCategory(Number(categoriaParam));
    }
  }, [categoriaParam]);

  const filteredMenu = menu
    .filter((cat) => !selectedCategory || cat.id === selectedCategory)
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !searchQuery ||
          item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-light.png" alt="Margot" width={36} height={36} className="rounded-lg" />
              <span className="text-xl font-bold tracking-wide">
                <span className="text-primary">Margot</span> Food & Drinks
              </span>
            </Link>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">
              Nuestro Menú
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-3">
              {selectedCategory
                ? menu.find((c) => c.id === selectedCategory)?.nombre || "Menú"
                : "Menú Completo"}
            </h1>
            <p className="text-neutral-dark mt-4 max-w-xl mx-auto">
              Explora todos nuestros platos y bebidas. ¡Encuentra tu favorito!
            </p>
          </div>

          {/* Search + Category filters */}
          <div className="flex flex-col gap-4 mb-10">
            {/* Search bar */}
            <div className="relative max-w-md mx-auto w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-dark" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={clsx(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  !selectedCategory
                    ? "bg-primary text-dark"
                    : "bg-white/5 text-neutral border border-white/10 hover:border-primary/40 hover:text-primary"
                )}
              >
                Todos
              </button>
              {menu.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(cat.id === selectedCategory ? null : cat.id)
                  }
                  className={clsx(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedCategory === cat.id
                      ? "bg-primary text-dark"
                      : "bg-white/5 text-neutral border border-white/10 hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-20">
              <Utensils className="w-12 h-12 text-neutral-dark/50 mx-auto mb-4" />
              <p className="text-neutral-dark">No se encontraron productos</p>
            </div>
          ) : (
            <div className="space-y-14">
              {filteredMenu.map((cat) => (
                <div key={cat.id}>
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-primary" />
                    {cat.nombre}
                    <span className="text-sm font-normal text-neutral-dark">
                      ({cat.items.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className={clsx(
                          "group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:border-primary/30",
                          item.es_destacado && "ring-1 ring-primary/30"
                        )}
                      >
                        {item.imagen ? (
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {item.es_destacado && (
                              <span className="absolute top-3 right-3 bg-primary text-dark text-xs font-bold px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="relative h-48 bg-dark-deep flex items-center justify-center">
                            <Utensils className="w-10 h-10 text-neutral-dark/30" />
                            {item.es_destacado && (
                              <span className="absolute top-3 right-3 bg-primary text-dark text-xs font-bold px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-white text-lg">{item.nombre}</h3>
                            <span className="text-primary font-bold text-lg whitespace-nowrap">
                              ${item.precio}
                            </span>
                          </div>
                          {item.descripcion && (
                            <p className="text-sm text-neutral-dark mt-2 leading-relaxed">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer simple */}
      <footer className="border-t border-white/10 py-8 text-center text-neutral-dark text-sm">
        <p>&copy; {new Date().getFullYear()} Margot Food & Drinks. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
