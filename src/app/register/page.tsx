"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    tipo_usuario: "comercio" as const,
    is_staff: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/users/", form);
      toast.success("Cuenta creada. Inicia sesión.");
      router.push("/login");
    } catch {
      toast.error("Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sage-light via-white to-brand-sage flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo-dark.png"
            alt="Margot Food & Drinks"
            width={180}
            height={120}
            className="mx-auto h-28 w-auto object-contain mb-2"
            priority
          />
          <h1 className="text-3xl font-bold text-brand-dark">Crear Cuenta</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input name="username" value={form.username} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold" minLength={8} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select name="tipo_usuario" value={form.tipo_usuario} onChange={handleChange} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold">
                <option value="comercio">Administrador / Comercio</option>
                <option value="mesero">Mesero</option>
                <option value="cocinero">Cocinero</option>
                <option value="cajero">Cajero</option>
                <option value="cliente">Cliente</option>
                <option value="repartidor">Repartidor</option>
              </select>
            </div>

            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-300 cursor-pointer hover:border-brand-gold transition-colors">
              <input
                type="checkbox"
                name="is_staff"
                checked={form.is_staff}
                onChange={handleCheck}
                className="h-4 w-4 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Administrador (Staff)</span>
                <p className="text-xs text-gray-400">Acceso al panel de administración</p>
              </div>
            </label>

            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 rounded-lg bg-brand-gold text-white font-medium text-sm hover:bg-brand-bronze disabled:opacity-50 transition-colors">
              {loading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-brand-gold hover:text-brand-bronze font-medium">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
