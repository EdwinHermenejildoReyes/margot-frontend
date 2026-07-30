import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menú — Margot Food & Drinks | Hamburguesas, Alitas, Cócteles y más",
  description:
    "Explora el menú completo de Margot: hamburguesas artesanales, alitas, pizzas, mariscos frescos, cócteles de autor y bebidas. Disponible para comer aquí o a domicilio.",
  alternates: {
    canonical: "/menu",
  },
  openGraph: {
    title: "Menú — Margot Food & Drinks",
    description:
      "Hamburguesas artesanales, alitas, pizzas, mariscos frescos y cócteles de autor en San José, Manglaralto.",
    url: "/menu",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://margot.rest",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Menú",
      item: "https://margot.rest/menu",
    },
  ],
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
