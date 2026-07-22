'use client';
import React, { useState } from 'react';
import { Plus, CheckCircle2, ExternalLink } from 'lucide-react';
import { CargarFacturaModal } from '@/components/egresos/CargarFacturaModal';

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1GdD338RH3X3QOj5L9F67D8Ny72I4Qo2zdKeD0nX2ep0/edit';

export default function EgresosPage() {
  const [showModal, setShowModal] = useState(false);
  const [ultimaCarga, setUltimaCarga] = useState<number | null>(null);

  function handleGuardado(cantidad: number) {
    setUltimaCarga(cantidad);
    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Carga de egresos</h1>
            <p className="text-xs text-gray-500 mt-0.5">Subí las facturas y se cargan solas en la planilla</p>
          </div>
          <button
            onClick={() => { setUltimaCarga(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva factura
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {ultimaCarga != null && (
          <div className="mb-6 px-5 py-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-800">
                {ultimaCarga} {ultimaCarga === 1 ? 'ítem cargado' : 'ítems cargados'} en la planilla
              </p>
              <p className="text-xs text-green-600 mt-0.5">Se agregaron al final de la pestaña Carga Egresos.</p>
            </div>
            
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900 underline"
            >
              Ver planilla <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-indigo-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1.5">Cargar una factura</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
            Sacá o subí la foto de la factura. Se leen los productos, cantidades y precios,
            los revisás, y se escriben directo en tu Google Sheet de egresos.
          </p>
          <button
            onClick={() => { setUltimaCarga(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva factura
          </button>
        </div>
      </div>

      {showModal && (
        <CargarFacturaModal
          onClose={() => setShowModal(false)}
          onGuardado={handleGuardado}
        />
      )}
    </div>
  );
}
