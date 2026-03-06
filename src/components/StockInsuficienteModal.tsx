"use client";

import { X, AlertTriangle, Package, ShoppingCart, ChefHat } from "lucide-react";
import clsx from "clsx";

/* ─── Types ─── */
interface IngredienteFaltante {
  insumo: string;
  necesario: number;
  disponible: number;
  unidad: string;
  deficit: number;
}

export interface FaltantePorProducto {
  producto: string;
  cantidad_pedida: number;
  porciones_posibles: number;
  ingredientes_faltantes: IngredienteFaltante[];
}

export interface StockErrorResponse {
  error: "stock_insuficiente";
  message: string;
  faltantes: FaltantePorProducto[];
}

interface Props {
  data: StockErrorResponse;
  onClose: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("es-EC", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

export default function StockInsuficienteModal({ data, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 p-5 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-900">
              Stock Insuficiente
            </h2>
            <p className="text-sm text-red-600">
              No se puede confirmar el pedido
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {data.faltantes.map((prod, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Product header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-brand-gold" />
                  <span className="font-semibold text-gray-900 text-sm">
                    {prod.producto}
                  </span>
                  <span className="text-xs text-gray-400">
                    ×{prod.cantidad_pedida} pedidas
                  </span>
                </div>
              </div>

              {/* Ingredients table */}
              <div className="px-4 py-3 space-y-2">
                {prod.ingredientes_faltantes.map((ing, i) => {
                  const porcentaje =
                    ing.necesario > 0
                      ? Math.min((ing.disponible / ing.necesario) * 100, 100)
                      : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {ing.insumo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-red-600 font-semibold">
                            Faltan {fmt(ing.deficit)} {ing.unidad}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full transition-all",
                              porcentaje > 60
                                ? "bg-yellow-400"
                                : porcentaje > 30
                                ? "bg-orange-400"
                                : "bg-red-400"
                            )}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap w-32 text-right">
                          {fmt(ing.disponible)} / {fmt(ing.necesario)}{" "}
                          {ing.unidad}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Porciones posibles */}
              <div
                className={clsx(
                  "px-4 py-3 border-t flex items-center gap-2",
                  prod.porciones_posibles > 0
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                )}
              >
                <ShoppingCart
                  className={clsx(
                    "h-4 w-4",
                    prod.porciones_posibles > 0
                      ? "text-amber-600"
                      : "text-red-500"
                  )}
                />
                {prod.porciones_posibles > 0 ? (
                  <p className="text-sm text-amber-800">
                    Con el stock actual puedes preparar hasta{" "}
                    <span className="font-bold">
                      {prod.porciones_posibles}{" "}
                      {prod.porciones_posibles === 1 ? "porción" : "porciones"}
                    </span>{" "}
                    de {prod.cantidad_pedida} pedidas.
                  </p>
                ) : (
                  <p className="text-sm text-red-700">
                    <span className="font-bold">
                      No es posible preparar ninguna porción
                    </span>{" "}
                    con el stock actual. Necesitas reabastecer insumos.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
