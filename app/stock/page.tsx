/**
 * app/stock/page.tsx
 * Placeholder del módulo de Stock — Fase 3 (por implementar).
 */

import { Package, Clock } from 'lucide-react';

export default function StockPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-violet-400" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Control de Stock</h2>
      <p className="text-gray-500 mt-3 max-w-md leading-relaxed text-sm">
        Este módulo está en desarrollo. Acá vas a poder gestionar el inventario del restaurante,
        registrar entradas y salidas de mercadería, y recibir alertas cuando el stock de algún
        insumo baje del mínimo definido.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-600 bg-violet-50 px-4 py-2 rounded-full border border-violet-200">
        <Clock className="w-4 h-4" />
        Próximamente
      </div>
    </main>
  );
}
