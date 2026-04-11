'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Receipt, Package, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getEgresos, getKPIs } from '@/lib/egresos';
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

export default function HomePage() {
  const [kpis, setKpis] = useState<ReturnType<typeof getKPIs> | null>(null);

  useEffect(() => {
    setKpis(getKPIs(getEgresos()));
  }, []);

  const now = new Date();
  const mesNombre = now.toLocaleString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Petricor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión Administrativa</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Módulos */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/conciliacion" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Conciliación</h3>
              <p className="text-sm text-gray-500">Nave Point vs Maxirest — verificá que los pagos coincidan.</p>
            </Link>

            <Link href="/egresos" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Receipt className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Egresos</h3>
              <p className="text-sm text-gray-500">Registrá facturas de proveedores y controlá pagos pendientes.</p>
            </Link>

            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-1">Stock</h3>
              <p className="text-sm text-gray-400">Próximamente — control de inventario.</p>
            </div>
          </div>
        </section>

        {/* Resumen del mes */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Resumen — {mesNombre}
          </h2>

          {kpis && kpis.count > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total egresos del mes</p>
                    <p className="text-2xl font-bold text-gray-900">{formatARS(kpis.totalMes)}</p>
                    <p className="text-xs text-gray-400">{kpis.count} {kpis.count === 1 ? 'registro' : 'registros'}</p>
                  </div>
                </div>

                <div className={`bg-white border rounded-2xl p-5 flex items-center gap-4 ${kpis.pendientePago > 0 ? 'border-amber-300' : 'border-green-200'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${kpis.pendientePago > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                    {kpis.pendientePago > 0
                      ? <AlertCircle className="w-5 h-5 text-amber-500" />
                      : <CheckCircle2 className="w-5 h-5 text-green-500" />
                    }
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Pendiente de pago</p>
                    <p className={`text-2xl font-bold ${kpis.pendientePago > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {formatARS(kpis.pendientePago)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {kpis.pendientePago > 0 ? 'Hay facturas sin pagar' : 'Todo al día ✓'}
                    </p>
                  </div>
                </div>
              </div>

              {Object.keys(kpis.porConcepto).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Desglose por categoría</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(kpis.porConcepto)
                      .sort(([, a], [, b]) => b - a)
                      .map(([concepto, total]) => (
                        <div
                          key={concepto}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${CONCEPTO_COLORS[concepto] || 'bg-gray-100 text-gray-700'}`}
                        >
                          <span>{concepto}</span>
                          <span className="font-bold">{formatARS(total)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Sin egresos registrados este mes</p>
              <p className="text-xs text-gray-400">Cargá tu primera factura en el módulo Egresos.</p>
              <Link
                href="/egresos"
                className="inline-block mt-5 px-5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ir a Egresos →
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
