import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Phone, Instagram, Utensils } from "lucide-react";
import { SEO_PAGES } from "@/lib/seo-pages";

interface MenuItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
  imagen: string | null;
  es_destacado: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
  imagen: string | null;
  items: MenuItem[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.margot.rest/api/v1";

async function getMenu(): Promise<Categoria[]> {
  try {
    const res = await fetch(`${API_BASE}/public/menu/completo/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return Object.keys(SEO_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = SEO_PAGES[slug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: `/${slug}`,
      type: "website",
    },
  };
}

export default async function SeoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = SEO_PAGES[slug];
  if (!page) notFound();

  const categorias = await getMenu();

  const itemsFiltrados: MenuItem[] = page.categoriaKeyword
    ? categorias
        .filter((c) =>
          c.nombre.toLowerCase().includes(page.categoriaKeyword.toLowerCase())
        )
        .flatMap((c) => c.items)
        .slice(0, 6)
    : categorias.flatMap((c) => c.items.slice(0, 2)).slice(0, 6);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://margot.rest" },
      { "@type": "ListItem", position: 2, name: page.h1, item: `https://margot.rest/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo-light.png" alt="Margot" width={36} height={36} className="rounded-lg" />
            <span className="text-xl font-bold tracking-wide">
              <span className="text-primary">Margot</span> Food & Drinks
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link href="/#menu" className="text-neutral hover:text-primary transition-colors">Menú</Link>
            <Link href="/#nosotros" className="text-neutral hover:text-primary transition-colors">Nosotros</Link>
            <Link href="/#resenas" className="text-neutral hover:text-primary transition-colors">Reseñas</Link>
            <Link href="/#contacto" className="text-neutral hover:text-primary transition-colors">Contacto</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-primary/20">
            <MapPin className="w-4 h-4" />
            San José, Manglaralto · Santa Elena, Ecuador
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">
            {page.h1.split(" ").map((word, i) =>
              i === 0 ? (
                <span key={i} className="text-primary">{word} </span>
              ) : (
                <span key={i}>{word} </span>
              )
            )}
          </h1>
          <p className="text-xl text-neutral-dark max-w-xl mx-auto mb-8">{page.subtitulo}</p>
          <a
            href="https://wa.me/593997012527"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 shadow-lg"
          >
            <Phone className="w-5 h-5" />
            Reservar por WhatsApp
          </a>
        </div>
      </section>

      {/* ── Descripción ── */}
      <section className="py-16 bg-dark-deep">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-lg text-neutral leading-relaxed">{page.descripcion}</p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-sm text-neutral-dark mt-1">Ingredientes frescos</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-2xl font-bold text-primary">Jue–Dom</p>
              <p className="text-sm text-neutral-dark mt-1">Abierto</p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 border border-white/10">
              <p className="text-2xl font-bold text-primary">★ 5.0</p>
              <p className="text-sm text-neutral-dark mt-1">Calificación</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Menú relacionado ── */}
      {itemsFiltrados.length > 0 && (
        <section className="py-20 bg-dark">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary text-sm font-semibold uppercase tracking-widest">Nuestro Menú</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3">
                Descubre nuestros <span className="text-primary">platos</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {itemsFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/40 transition-all"
                >
                  <div className="relative h-44 bg-dark-deep">
                    {item.imagen ? (
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Utensils className="w-10 h-10 text-neutral-dark/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-lg leading-tight">{item.nombre}</h3>
                      <span className="text-primary font-bold whitespace-nowrap">${item.precio}</span>
                    </div>
                    {item.descripcion && (
                      <p className="text-sm text-neutral-dark mt-2 line-clamp-2">{item.descripcion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-dark px-8 py-3.5 rounded-xl font-bold transition-colors"
              >
                <Utensils className="w-5 h-5" />
                Ver menú completo
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Contacto y mapa ── */}
      <section className="py-20 bg-dark-deep">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Encuéntranos</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              Te esperamos en <span className="text-primary">Margot</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Ubicación</h3>
                  <p className="text-neutral-dark text-sm mt-1">San José, Parroquia Manglaralto, Santa Elena — Ecuador</p>
                  <a
                    href="https://www.google.com/maps/place/MARGOT+Food%26Drink/@-1.7596217,-80.7681302,17z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Horario</h3>
                  <div className="text-sm text-neutral-dark mt-1 space-y-0.5">
                    <p>Jueves y Domingo: 17:00 – 21:00</p>
                    <p>Viernes y Sábado: 18:00 – 22:00</p>
                    <p className="text-neutral-dark/50">Lunes a Miércoles: Cerrado</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Instagram className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Síguenos</h3>
                  <a
                    href="https://instagram.com/margotfooddrink"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline mt-1 inline-block"
                  >
                    @margotfooddrink
                  </a>
                </div>
              </div>
              <a
                href="https://wa.me/593997012527"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                <Phone className="w-4 h-4" />
                Reservar por WhatsApp
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden min-h-[300px] border border-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3987.2!2d-80.7681302!3d-1.7596217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x902c2b90f0e58a1b%3A0x5e5dd1e44275da42!2sMARGOT%20Food%26Drink!5e0!3m2!1ses!2sec!4v1"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Margot Food & Drinks"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 bg-dark border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-dark">
          <div className="flex items-center gap-2">
            <Image src="/logo-light.png" alt="Margot" width={24} height={24} className="rounded" />
            <span className="font-bold"><span className="text-primary">Margot</span> Food & Drinks</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Margot Restobar · San José, Manglaralto</p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:text-primary transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-primary transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
