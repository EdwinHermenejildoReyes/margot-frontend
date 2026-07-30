import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://margot.rest"),
  title: "Margot — Food & Drinks | Restobar en San José - Manglaralto, Santa Elena Ecuador",
  description: "Cocina de autor, cócteles artesanales y un ambiente único en San José. Reservas, menú y reseñas en margot.rest",
  keywords: ["restaurante", "restobar", "San José", "Manglaralto", "Santa Elena", "Ecuador", "cócteles", "cocina de autor", "Margot", "hamburguesas", "mariscos"],
  openGraph: {
    title: "Margot — Food & Drinks",
    description: "Restobar frente al mar en San José, Manglaralto. Cocina de autor, cócteles artesanales y el mejor ambiente de la costa ecuatoriana.",
    type: "website",
    locale: "es_EC",
    siteName: "Margot Food & Drinks",
    url: "https://margot.rest",
  },
  twitter: {
    card: "summary_large_image",
    title: "Margot — Food & Drinks",
    description: "Restobar frente al mar en San José, Manglaralto. Cocina de autor, cócteles artesanales y el mejor ambiente de la costa ecuatoriana.",
  },
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Margot Food & Drinks",
  description:
    "Restobar frente al mar en San José, Manglaralto. Cocina de autor, cócteles artesanales, hamburguesas, alitas, pizzas y mariscos.",
  url: "https://margot.rest",
  logo: "https://margot.rest/logo-light.png",
  image: "https://margot.rest/opengraph-image",
  telephone: "+593997012527",
  servesCuisine: ["Ecuatoriana", "Americana", "Fusión", "Mariscos"],
  priceRange: "$$",
  hasMenu: "https://margot.rest/menu",
  menu: "https://margot.rest/menu",
  address: {
    "@type": "PostalAddress",
    streetAddress: "San José",
    addressLocality: "Manglaralto",
    addressRegion: "Santa Elena",
    addressCountry: "EC",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -1.7596217,
    longitude: -80.7681302,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Thursday", "Sunday"],
      opens: "17:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Friday", "Saturday"],
      opens: "18:00",
      closes: "22:00",
    },
  ],
  sameAs: ["https://www.instagram.com/margotfooddrink"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className={`${poppins.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: "10px", background: "#2F353B", color: "#fff", fontFamily: "var(--font-poppins)" },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
