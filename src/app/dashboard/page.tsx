"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  UtensilsCrossed,
  ShoppingCart,
  Armchair,
  Package,
  AlertTriangle,
  TrendingUp,
  Clock,
  ChefHat,
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  menuItems: number;
  pedidosPendientes: number;
  mesasDisponibles: number;
  stockBajo: number;
}

function StatCard({ title, value, icon: Icon, color, href }: {
  title: string; value: number | string; icon: React.ElementType; color: string; href: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    menuItems: 0,
    pedidosPendientes: 0,
    mesasDisponibles: 0,
    stockBajo: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Array<{ id: number; numero_pedido: string; estado: string; total: string; created_at: string }>>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [menuRes, pedidosRes, mesasRes, invRes] = await Promise.all([
          api.get("/menu-items/?page_size=1").catch(() => ({ data: { count: 0 } })),
          api.get("/pedidos/?estado=pendiente&page_size=1").catch(() => ({ data: { count: 0 } })),
          api.get("/mesas/disponibles/").catch(() => ({ data: [] })),
          api.get("/inventario/stock_bajo/").catch(() => ({ data: { results: [] } })),
        ]);
        setStats({
          menuItems: menuRes.data.count || 0,
          pedidosPendientes: pedidosRes.data.count || 0,
          mesasDisponibles: Array.isArray(mesasRes.data) ? mesasRes.data.length : (mesasRes.data.results?.length || 0),
          stockBajo: Array.isArray(invRes.data) ? invRes.data.length : (invRes.data.results?.length || 0),
        });
      } catch { /* ignore */ }
    };

    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/pedidos/?ordering=-created_at&page_size=5");
        setRecentOrders(data.results || []);
      } catch { /* ignore */ }
    };

    fetchStats();
    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Hola, {user?.first_name || user?.username}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen de tu restaurante</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Ítems del Menú" value={stats.menuItems} icon={UtensilsCrossed} color="bg-brand-gold" href="/dashboard/menu" />
        <StatCard title="Pedidos Pendientes" value={stats.pedidosPendientes} icon={ShoppingCart} color="bg-blue-500" href="/dashboard/pedidos" />
        <StatCard title="Mesas Disponibles" value={stats.mesasDisponibles} icon={Armchair} color="bg-green-500" href="/dashboard/mesas" />
        <StatCard title="Stock Bajo" value={stats.stockBajo} icon={AlertTriangle} color="bg-red-500" href="/dashboard/inventario" />
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/pedidos" className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-medium">Ver Pedidos</span>
            </Link>
            <Link href="/dashboard/cocina" className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors">
              <ChefHat className="h-5 w-5" />
              <span className="text-sm font-medium">Cocina</span>
            </Link>
            <Link href="/dashboard/mesas" className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
              <Armchair className="h-5 w-5" />
              <span className="text-sm font-medium">Mesas</span>
            </Link>
            <Link href="/dashboard/inventario" className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Inventario</span>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Últimos Pedidos</h2>
            <Link href="/dashboard/pedidos" className="text-sm text-brand-gold hover:text-brand-bronze font-medium">Ver todos →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay pedidos recientes</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/pedidos/${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-sage flex items-center justify-center">
                      <ShoppingCart className="h-4 w-4 text-brand-bronze" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.numero_pedido}</p>
                      <p className="text-xs text-gray-400">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${order.total}</p>
                    <span className="text-xs capitalize text-gray-500">{order.estado?.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
