"use client";

import { Bell, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 lg:ml-0 ml-12">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {user?.first_name || user?.username}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-sage text-brand-bronze font-medium">
            {user?.is_staff ? "Admin" : user?.tipo_usuario}
          </span>
        </div>
      </div>
    </header>
  );
}
