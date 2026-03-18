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
  title: "Margot — Food & Drinks | Restobar en San José - Manglaralto, Santa Elena Ecuador",
  description: "Cocina de autor, cócteles artesanales y un ambiente único en San José. Reservas, menú y reseñas en margot.rest",
  keywords: ["restaurante", "restobar", "San José", "Ecuador", "cócteles", "cocina de autor", "Margot"],
  openGraph: {
    title: "Margot — Food & Drinks",
    description: "Cocina de autor, cócteles artesanales y un ambiente único en San José, Ecuador.",
    type: "website",
    locale: "es_EC",
    siteName: "Margot Food & Drinks",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={poppins.variable}>
      <body className={`${poppins.className} antialiased`}>
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
