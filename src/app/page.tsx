"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Instagram,
  Send,
  ChevronDown,
  Utensils,
  Wine,
  Heart,
  Users,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

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
  items: MenuItemPublic[];
}

interface ResenaPublic {
  id: number;
  nombre: string;
  calificacion: number;
  comentario: string;
  created_at: string;
}

/* ── API base ── */
function getApiBase(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8005/api/v1";
  return "https://api.margot.rest/api/v1";
}

/* ── Componente de estrellas ── */
function StarsDisplay({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx("transition-colors", i <= count ? "text-amber-400 fill-amber-400" : "text-gray-300")}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}

/* ── Componente de estrellas interactivas ── */
function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-125"
        >
          <Star
            className={clsx("w-7 h-7 transition-colors", i <= value ? "text-amber-400 fill-amber-400" : "text-gray-400 hover:text-amber-300")}
          />
        </button>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const [menu, setMenu] = useState<CategoriaPublic[]>([]);
  const [resenas, setResenas] = useState<ResenaPublic[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  /* Reseña form */
  const [nombre, setNombre] = useState("");
  const [calificacion, setCalificacion] = useState(5);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const base = getApiBase();
    Promise.all([
      fetch(`${base}/public/menu/landing/`).then((r) => r.json()).catch(() => []),
      fetch(`${base}/public/resenas/`).then((r) => r.json()).catch(() => ({ results: [] })),
    ]).then(([menuData, resenasData]) => {
      setMenu(menuData);
      setResenas(Array.isArray(resenasData) ? resenasData : resenasData.results || []);
      setLoadingMenu(false);
    });
  }, []);

  const handleSubmitResena = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !comentario.trim()) {
      toast.error("Por favor completa tu nombre y comentario");
      return;
    }
    setEnviando(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/public/resenas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), calificacion, comentario: comentario.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("¡Gracias! Tu reseña será revisada y publicada pronto.");
      setNombre("");
      setCalificacion(5);
      setComentario("");
    } catch {
      toast.error("Error al enviar la reseña. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const promedioResenas = resenas.length > 0
    ? (resenas.reduce((acc, r) => acc + r.calificacion, 0) / resenas.length).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* ═══ NAVBAR ═══ */}
      <nav className="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-light.png" alt="Margot" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold tracking-wide">
              <span className="text-primary">Margot</span> Food & Drinks
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <a href="#menu" className="text-neutral hover:text-primary transition-colors">Menú</a>
            <a href="#nosotros" className="text-neutral hover:text-primary transition-colors">Nosotros</a>
            <a href="#resenas" className="text-neutral hover:text-primary transition-colors">Reseñas</a>
            <a href="#contacto" className="text-neutral hover:text-primary transition-colors">Contacto</a>
            <Link
              href="/dashboard"
              className="bg-primary hover:bg-secondary text-dark px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
            >
              Acceso Staff
            </Link>
          </div>
          <Link href="/dashboard" className="sm:hidden bg-primary hover:bg-secondary text-dark px-3 py-1.5 rounded-lg text-xs font-semibold">
            Staff
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background image */}
        <Image
          src="/fondo_margot.png"
          alt=""
          fill
          className="object-cover opacity-25"
          priority
        />
        {/* Overlay al 25% para mostrar la imagen */}
        <div className="absolute inset-0 bg-dark/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-transparent to-dark/60" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-dark/40 text-neutral px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border border-neutral/20">
            <Sparkles className="w-4 h-4" />
            Restobar en San José, Santa Elena
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight mb-6 drop-shadow-lg">
            Donde cada plato{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary-light">
              cuenta una historia
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-md">
            Cocina de autor, cócteles artesanales y un ambiente único para compartir.
            Vive la experiencia <span className="text-primary font-semibold">Margot</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-dark px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 shadow-lg shadow-primary/30"
            >
              <Utensils className="w-5 h-5" />
              Ver Menú
            </a>
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-2 bg-dark/40 hover:bg-dark/60 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all border border-neutral/30 backdrop-blur-sm"
            >
              <Phone className="w-5 h-5" />
              Reservar
            </a>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-bold text-primary drop-shadow-md">{promedioResenas}</p>
              <p className="text-xs text-neutral/70 mt-1">Calificación</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary drop-shadow-md">100%</p>
              <p className="text-xs text-neutral/70 mt-1">Sabor casero</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                <Heart className="w-7 h-7 inline text-primary fill-primary drop-shadow-md" />
              </p>
              <p className="text-xs text-neutral/70 mt-1">Hecho con amor</p>
            </div>
          </div>

          <div className="mt-16 animate-bounce">
            <ChevronDown className="w-6 h-6 text-neutral/50 mx-auto" />
          </div>
        </div>
      </section>

      {/* ═══ NOSOTROS ═══ */}
      <section id="nosotros" className="py-24 bg-dark-deep">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Nuestra Esencia</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3">
              Más que un restaurante,{" "}
              <span className="text-primary">una experiencia</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Utensils className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Cocina de Autor</h3>
              <p className="text-neutral-dark leading-relaxed">
                Platos elaborados con ingredientes frescos y recetas que fusionan lo tradicional con lo moderno. Cada bocado es una sorpresa.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Wine className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Cócteles Artesanales</h3>
              <p className="text-neutral-dark leading-relaxed">
                Nuestra barra ofrece cócteles creativos preparados con técnicas mixológicas. Desde clásicos hasta creaciones de la casa.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 bg-primary/15 rounded-xl flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ambiente Único</h3>
              <p className="text-neutral-dark leading-relaxed">
                Un espacio diseñado para que disfrutes con amigos, familia o pareja. Música, luces y la mejor vibra de San José.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MENÚ DESTACADO ═══ */}
      <section id="menu" className="py-24 bg-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Nuestro Menú</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3">
              Descubre nuestros{" "}
              <span className="text-primary">sabores</span>
            </h2>
            <p className="text-neutral-dark mt-4 max-w-xl mx-auto">
              Una selección de nuestros platos y bebidas más populares. ¡Ven y pruébalos todos!
            </p>
          </div>

          {loadingMenu ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : menu.length === 0 ? (
            <p className="text-center text-neutral-dark py-12">Pronto publicaremos nuestro menú. ¡Visítanos para descubrirlo!</p>
          ) : (
            <div className="space-y-16">
              {menu.map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-primary" />
                    {cat.nombre}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className={clsx(
                          "group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all hover:border-primary/30",
                          item.es_destacado && "ring-1 ring-primary/30"
                        )}
                      >
                        {item.imagen && (
                          <div className="relative h-44 overflow-hidden">
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
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-white">{item.nombre}</h4>
                            <span className="text-primary font-bold whitespace-nowrap">${item.precio}</span>
                          </div>
                          {item.descripcion && (
                            <p className="text-sm text-neutral-dark mt-1 line-clamp-2">{item.descripcion}</p>
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
      </section>

      {/* ═══ RESEÑAS ═══ */}
      <section id="resenas" className="py-24 bg-dark-deep">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Opiniones</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3">
              Lo que dicen nuestros{" "}
              <span className="text-primary">clientes</span>
            </h2>
          </div>

          {resenas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {resenas.slice(0, 6).map((r) => (
                <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <StarsDisplay count={r.calificacion} />
                  <p className="text-neutral mt-4 leading-relaxed text-sm">&ldquo;{r.comentario}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{r.nombre.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{r.nombre}</p>
                      <p className="text-xs text-neutral-dark">
                        {new Date(r.created_at).toLocaleDateString("es-EC", { year: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de reseña */}
          <div className="max-w-xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-center mb-6">
                ¿Ya nos visitaste? <span className="text-primary">¡Déjanos tu reseña!</span>
              </h3>
              <form onSubmit={handleSubmitResena} className="space-y-5">
                <div>
                  <label className="block text-sm text-neutral-dark mb-1.5">Tu nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: María García"
                    maxLength={100}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-dark mb-2">Calificación</label>
                  <StarsInput value={calificacion} onChange={setCalificacion} />
                </div>

                <div>
                  <label className="block text-sm text-neutral-dark mb-1.5">Tu experiencia</label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Cuéntanos qué te pareció..."
                    maxLength={500}
                    rows={3}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-neutral-dark focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none"
                  />
                  <p className="text-xs text-neutral-dark mt-1 text-right">{comentario.length}/500</p>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-dark py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-4 h-4" />
                  {enviando ? "Enviando..." : "Enviar Reseña"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACTO ═══ */}
      <section id="contacto" className="py-24 bg-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Encuéntranos</span>
            <h2 className="text-4xl sm:text-5xl font-bold mt-3">
              Te esperamos en{" "}
              <span className="text-primary">Margot</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ubicación</h3>
                  <p className="text-neutral-dark mt-1">San José, Parroquia Manglaralto, Santa Elena - Ecuador</p>
                  <a
                    href="https://maps.google.com/?q=Margot+Food+Drinks+San+Jose+Manglaralto+Santa+Elena"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Horario</h3>
                  <div className="text-neutral-dark mt-1 space-y-1 text-sm">
                    <p>Jueves y Domingo: 17:00 – 21:00</p>
                    <p>Viernes y Sábado: 18:00 – 22:00</p>
                    <p className="text-neutral-dark/60">Lunes a Miércoles: Cerrado</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Reservas</h3>
                  <p className="text-neutral-dark mt-1">WhatsApp / Llamadas</p>
                  <a
                    href="https://wa.me/593999999999"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Escribir por WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Instagram className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Síguenos</h3>
                  <a
                    href="https://instagram.com/margot.restobar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-1 inline-block"
                  >
                    @margot.restobar
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden min-h-[350px] flex items-center justify-center">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15949.5!2d-80.75!3d-1.83!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sManglaralto%2C+Santa+Elena!5e0!3m2!1ses!2sec!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "350px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Margot"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 bg-dark-deep border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo-light.png" alt="Margot" width={28} height={28} className="rounded-lg" />
              <span className="font-bold text-lg">
                <span className="text-primary">Margot</span> Food & Drinks
              </span>
            </div>
            <p className="text-neutral-dark text-sm">
              &copy; {new Date().getFullYear()} Margot Restobar. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
