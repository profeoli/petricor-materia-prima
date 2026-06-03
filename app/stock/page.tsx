'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { sbGet, getStockStatus } from '@/lib/stock';
import type { Pedido, Relevamiento, Producto } from '@/lib/stock';

interface RelevamientoResumen {
  fecha: string;
  rojos: number;
  amarillos: number;
}

export default function StockPage() {
  const [ultimos, setUltimos] = useState<RelevamientoResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const pedidos = await sbGet<Pedido>('pedidos', 'order=fecha.desc&limit=5');
        const productos = await sbGet<Producto>('productos', 'activo=eq.true');
        const resumenes: RelevamientoResumen[] = [];
        for (const pedido of pedidos) {
          const items = await sbGet<Relevamiento>('relevamientos', `fecha=eq.${pedido.fecha}`);
          let rojos = 0;
          let amarillos = 0;
          for (const item of items) {
            const prod = productos.find(p => p.id === item.producto_id);
            const status = getStockStatus(item.cantidad, prod?.stock_minimo ?? null);
            if (status === 'red') rojos++;
            if (status === 'amber') amarillos++;
          }
          resumenes.push({ fecha: pedido.fecha, rojos, amarillos });
        }
        setUltimos(resumenes);
      } catch {
        setUltimos([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const ultimo = ultimos[0];

  function fmtFecha(fecha: string) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stock</h1>
            <p className="text-xs text-gray-500 mt-0.5">Control de inventario y pedidos a proveedores</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        <Link
          href="/stock/relevamiento"
          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo relevamiento
        </Link>

        {ultimo && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Último relevamiento</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">{fmtFecha(ultimo.fecha)}</span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {ultimo.rojos > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">{ultimo.rojos} sin stock</span>
                </div>
              )}
              {ultimo.amarillos > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600">{ultimo.amarillos} stock bajo</span>
                </div>
              )}
              {ultimo.rojos === 0 && ultimo.amarillos === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-green-600">Todo OK</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historial de relevamientos</h2>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
          ) : ultimos.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Sin relevamientos aún. Hacé el primero.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {ultimos.map((r, i) => (
                <div key={r.fecha + i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{fmtFecha(r.fecha)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.rojos > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">{r.rojos} sin stock</span>
                    )}
                    {r.amarillos > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">{r.amarillos} bajo</span>
                    )}
                    {r.rojos === 0 && r.amarillos === 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">OK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/stock/admin" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
            Administración
          </Link>
        </div>
      </div>
    </div>
  );
}
