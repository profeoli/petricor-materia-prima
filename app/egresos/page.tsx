'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Egreso, getEgresos, addEgresos, updateEgreso, deleteEgreso, getKPIs, getMesActual } from '@/lib/egresos';
import { EgresosKPIs } from '@/components/egresos/EgresosKPIs';
import { EgresosTable } from '@/components/egresos/EgresosTable';
import { CargarFacturaModal } from '@/components/egresos/CargarFacturaModal';
import { exportEgresos } from '@/lib/exportExcel';

export default function EgresosPage() {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(() => setEgresos(getEgresos()), []);

  useEffect(() => {
    load();
  }, [load]);

  function handleGuardar(nuevos: Egreso[]) {
    addEgresos(nuevos);
    load();
    setShowModal(false);
  }

  function handleMarcarPagado(id: string) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    updateEgreso(id, { estado: 'pagado', fechaPago: `${dd}/${mm}/${today.getFullYear()}` });
    load();
  }

  function handleEliminar(id: string) {
    deleteEgreso(id);
    load();
  }

  function handleExportar() {
    exportEgresos(egresos);
  }

  const { anio } = getMesActual();
  const kpis = getKPIs(egresos);
  const now = new Date();
  const mesLabel = now.toLocaleString('es-AR', { month: 'long' }) + ' ' + anio;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Egresos</h1>
            <p className="text-xs text-gray-500 mt-0.5">Control de facturas y pagos a proveedores</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva factura
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <EgresosKPIs
          totalMes={kpis.totalMes}
          pendientePago={kpis.pendientePago}
          porConcepto={kpis.porConcepto}
          count={kpis.count}
          mesLabel={mesLabel}
        />

        <EgresosTable
          egresos={egresos}
          onMarcarPagado={handleMarcarPagado}
          onEliminar={handleEliminar}
          onExportar={handleExportar}
        />
      </div>

      {showModal && (
        <CargarFacturaModal
          onClose={() => setShowModal(false)}
          onGuardar={handleGuardar}
        />
      )}
    </div>
  );
}
