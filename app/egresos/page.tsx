'use client';

/**
 * app/egresos/page.tsx
 * Módulo de Egresos — listado, KPIs, filtros y carga de facturas.
 * Persistencia en localStorage (preparado para migrar a DB en el futuro).
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Clock } from 'lucide-react';
import { cargarEgresos, type Egreso } from '@/lib/egresos';
import { CargarFacturaModal } from '@/components/egresos/CargarFacturaModal';
import { EgresosKPIs } from '@/components/egresos/EgresosKPIs';
import { EgresosTable } from '@/components/egresos/EgresosTable';
import { cn } from '@/lib/utils';

export default function EgresosPage() {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Recarga egresos desde localStorage
  const recargar = useCallback(() => {
    setEgresos(cargarEgresos());
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  // Aplicar filtros locales al array de egresos
  const egresosFiltrados = egresos
    .filter((e) => !soloPendientes || !e.fechaPago)
    .filter((e) => {
      const q = busqueda.trim().toLowerCase();
      if (!q) return true;
      return (
        e.proveedor.toLowerCase().includes(q) ||
        e.rubro.toLowerCase().includes(q) ||
        (e.numeroFactura ?? '').toLowerCase().includes(q) ||
        (e.encargado ?? '').toLowerCase().includes(q) ||
        (e.tipoEgreso ?? '').toLowerCase().includes(q)
      );
    });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Encabezado de página */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Egresos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Registrá y controlá los gastos del restaurante
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Cargar factura</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>

      {/* KPIs */}
      <EgresosKPIs egresos={egresos} />

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por proveedor, rubro, factura, encargado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
        </div>
        <button
          onClick={() => setSoloPendientes((prev) => !prev)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors shadow-sm whitespace-nowrap',
            soloPendientes
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          )}
        >
          <Clock className="w-4 h-4" />
          Pendientes de pago
        </button>
      </div>

      {/* Tabla de egresos */}
      <EgresosTable egresos={egresosFiltrados} onActualizar={recargar} />

      {/* Modal de carga de facturas */}
      {modalAbierto && (
        <CargarFacturaModal
          onCerrar={() => setModalAbierto(false)}
          onGuardado={() => {
            setModalAbierto(false);
            recargar();
          }}
        />
      )}
    </main>
  );
}
