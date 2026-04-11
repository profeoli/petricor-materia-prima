'use client';
import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatARS } from '@/lib/utils';

const CONCEPTO_COLORS: Record<string, string> = {
  Proveedores: 'bg-blue-100 text-blue-700',
  Fijos: 'bg-purple-100 text-purple-700',
  RRHH: 'bg-green-100 text-green-700',
  Limpieza: 'bg-cyan-100 text-cyan-700',
  Mantenimiento: 'bg-orange-100 text-orange-700',
  Caja: 'bg-gray-100 text-gray-700',
  Otro: 'bg-rose-100 text-rose-700',
};

interface EgresosKPIsProps {
  totalMes: number;
  pendientePago: number;
  porConcepto: Record<string, number>;
  count: number;
  mesLabel: string;
}

export function EgresosKPIs({ totalMes, pendientePago, porConcepto, count, mesLabel }: EgresosKPIsProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total {mesLabel}</p>
            <p className="text-xl font-bold text-gray-900">{formatARS(totalMes)}</p>
            <p className="text-xs text-gray-400">{count} {count === 1 ? 'registro' : 'registros'}</p>
          </div>
        </div>

        <div className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${pendientePago > 0 ? 'border-amber-300' : 'border-green-200'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${pendientePago > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
            {pendientePago > 0
              ? <AlertCircle className="w-5 h-5 text-amber-500" />
              : <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Pendiente de pago</p>
            <p className={`text-xl font-bold ${pendientePago > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatARS(pendientePago)}
            </p>
            <p className="text-xs text-gray-400">{pendientePago > 0 ? 'Facturas sin pagar' : 'Todo al día ✓'}</p>
          </div>
        </div>
      </div>

      {Object.keys(porConcepto).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Por categoría</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(porConcepto)
              .sort(([, a], [, b]) => b - a)
              .map(([concepto, total]) => (
                <span
                  key={concepto}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${CONCEPTO_COLORS[concepto] || 'bg-gray-100 text-gray-700'}`}
                >
                  {concepto}: <strong>{formatARS(total)}</strong>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
