"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success("¡Bienvenido!");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number } };
        if (axiosErr.response?.status === 401) {
          toast.error("Credenciales incorrectas");
        } else {
          toast.error(`Error del servidor (${axiosErr.response?.status})`);
        }
      } else if (err && typeof err === "object" && "request" in err) {
        toast.error("No se pudo conectar al servidor");
      } else {
        toast.error("Error inesperado al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sage-light via-white to-brand-sage flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo-dark.png"
            alt="Margot Food & Drinks"
            width={180}
            height={120}
            className="mx-auto h-28 w-auto object-contain mb-2"
            priority
          />
          <p className="text-gray-500 mt-1">Sistema de Gestión de Restaurante</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
          <h2 className="text-xl font-semibold text-brand-dark mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-shadow"
                placeholder="Tu nombre de usuario"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-gold text-white font-medium text-sm hover:bg-brand-bronze focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          {/* <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-brand-gold hover:text-brand-bronze font-medium">
              Regístrate
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}
