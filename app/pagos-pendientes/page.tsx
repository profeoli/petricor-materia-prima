'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Egreso, getEgresos, updateEgreso } from '@/lib/egresos';
import { formatARS } from '@/lib/utils';

function parseFecha(fecha: string): Date {
  const [dd, mm, aaaa] = fecha.split('/');
  return new Date(Number(aaaa), Number(mm) - 1, Number(dd));
}

function diasHastaVencimiento(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = parseFecha(fecha);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PagosPendientesPage() {
  const [pendientes, setPendientes] = useState<Egreso[]>([]);
  const [pagadas, setPagadas] = useState<Egreso[]>([]);
  const [mostrarPagadas, setMostrarPagadas] = useState(false);

  const load = useCallback(() => {
    const todos = getEgresos();
    setPendientes(
      todos
        .filter((e) => e.estado === 'pendiente')
        .sort((a, b) => parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime())
    );
    setPagadas(
      todos
        .filter((e) => e.estado === 'pagado')
        .sort((a, b) => {
          const fechaA = a.fechaPago ? parseFecha(a.fechaPago) : parseFecha(a.fecha);
          const fechaB = b.fechaPago ? parseFecha(b.fechaPago) : parseFecha(b.fecha);
          return fechaB.getTime() - fechaA.getTime();
        })
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleMarcarPagado(id: string) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    updateEgreso(id, { estado: 'pagado', fechaPago: `${dd}/${mm}/${today.getFullYear()}` });
    load();
  }

  const total = pendientes.reduce((s, e) => s + (e.precioFactura || 0), 0);

  function getBadge(fecha: string) {
    const dias = diasHastaVencimiento(fecha);
    if (dias < 0)
      return { label: `Vencida hace ${Math.abs(dias)}d`, clase: 'bg-red-100 text-red-600' };
    if (dias === 0)
      return { label: 'Vence hoy', clase: 'bg-red-100 text-red-600' };
    if (dias <= 7)
      return { label: `Vence en ${dias}d`, clase: 'bg-amber-100 text-amber-600' };
    return { label: `Vence en ${dias}d`, clase: 'bg-gray-100 text-gray-500' };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagos pendientes</h1>
            <p className="text-xs text-gray-500 mt-0.5">Facturas sin pagar ordenadas por vencimiento</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* Total pendiente */}
        <div className={`rounded-2xl p-5 flex items-center gap-4 ${total > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${total > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
            {total > 0
              ? <AlertCircle className="w-5 h-5 text-amber-500" />
              : <CheckCircle2 className="w-5 h-5 text-green-500" />
            }
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total a pagar</p>
            <p className={`text-3xl font-bold ${total > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatARS(total)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {pendientes.length === 0
                ? 'Todo al día ✓'
                : `${pendientes.length} ${pendientes.length === 1 ? 'factura pendiente' : 'facturas pendientes'}`}
            </p>
          </div>
        </div>

        {/* Pendientes */}
        {pendientes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">No hay pagos pendientes</p>
            <p className="text-xs text-gray-400">Todas las facturas están al día.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Por pagar</h2>
            {pendientes.map((e) => {
              const badge = getBadge(e.fecha);
              return (
                <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4">
                  <button
                    onClick={() => handleMarcarPagado(e.id)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all flex-shrink-0 flex items-center justify-center group"
                    title="Marcar como pagado"
                  >
                    <CheckCircle2 className="w-4 h-4 text-transparent group-hover:text-green-500 transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.proveedor}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.clase}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{e.concepto}</span>
                      {e.numeroFactura && (
                        <span className="text-xs text-gray-400">Nº {e.numeroFactura}</span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {e.fecha}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {formatARS(e.precioFactura)}
                  </p>
                </div>
              );
            })}
            <p className="text-xs text-center text-gray-400">
              Tocá el círculo para marcar una factura como pagada.
            </p>
          </div>
        )}

        {/* Pagadas */}
        {pagadas.length > 0 && (
          <div>
            <button
              onClick={() => setMostrarPagadas(!mostrarPagadas)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors mb-3"
            >
              {mostrarPagadas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Historial de pagos ({pagadas.length})
            </button>

            {mostrarPagadas && (
              <div className="space-y-3">
                {pagadas.map((e) => (
                  <div key={e.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-700 truncate line-through">{e.proveedor}</p>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                          Pagada
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{e.concepto}</span>
                        {e.numeroFactura && (
                          <span className="text-xs text-gray-400">Nº {e.numeroFactura}</span>
                        )}
                        {e.fechaPago && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Pagada el {e.fechaPago}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-400 flex-shrink-0 line-through">
                      {formatARS(e.precioFactura)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
