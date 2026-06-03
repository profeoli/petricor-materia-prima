'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Lock, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { sbGet, sbPost, getStockStatus } from '@/lib/stock';
import type { Producto } from '@/lib/stock';

const ALLOWED_IP = '152.168.40.164';

const PROVEEDORES_ORDEN = [
  'La Buena Cosecha',
  'Blancaluna',
  'Verdulería Tucumán',
  'Bufano Alimentos',
  'Fuego Café',
  'Femsa/Juntos+',
  'Tregar',
  'Magbox',
  'Manteca LB',
];

export default function RelevamientoPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipOk, setIpOk] = useState<boolean | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/check-ip')
      .then(r => r.json())
      .then(({ ip }) => setIpOk(ip === ALLOWED_IP))
      .catch(() => setIpOk(false));
  }, []);

  const loadProductos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sbGet<Producto>('productos', 'activo=eq.true&order=nombre.asc');
      setProductos(data);
    } catch {
      setProductos([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProductos(); }, [loadProductos]);

  const busquedaNorm = busqueda.toLowerCase().trim();

  const grouped = PROVEEDORES_ORDEN.reduce<Record<string, Producto[]>>((acc, prov) => {
    const items = productos
      .filter(p => p.proveedor === prov)
      .filter(p => busquedaNorm === '' || p.nombre.toLowerCase().includes(busquedaNorm));
    if (items.length > 0) acc[prov] = items;
    return acc;
  }, {});
  const otrosProds = productos
    .filter(p => !PROVEEDORES_ORDEN.includes(p.proveedor))
    .filter(p => busquedaNorm === '' || p.nombre.toLowerCase().includes(busquedaNorm));
  if (otrosProds.length > 0) grouped['Otros'] = otrosProds;

  function toggleProveedor(prov: string) {
    setAbiertos(prev => ({ ...prev, [prov]: !prev[prov] }));
  }

  function isAbierto(prov: string): boolean {
    if (busquedaNorm !== '') return true;
    return abiertos[prov] ?? false;
  }

  function inputColor(prod: Producto): string {
    const raw = cantidades[prod.id];
    if (raw === undefined || raw === '') return 'border-gray-200 focus:ring-indigo-400';
    const val = parseFloat(raw);
    if (isNaN(val)) return 'border-gray-200 focus:ring-indigo-400';
    const status = getStockStatus(val, prod.stock_minimo);
    if (status === 'red') return 'border-red-300 bg-red-50 focus:ring-red-400 text-red-700';
    if (status === 'amber') return 'border-amber-300 bg-amber-50 focus:ring-amber-400 text-amber-700';
    if (status === 'green') return 'border-green-300 bg-green-50 focus:ring-green-400 text-green-700';
    return 'border-gray-200 focus:ring-indigo-400';
  }

  async function handleGuardar() {
    setSaving(true);
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      const entries = Object.entries(cantidades)
        .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
        .map(([id, v]) => ({ fecha, producto_id: parseInt(id), cantidad: parseFloat(v) }));

      if (entries.length === 0) {
        alert('Ingresá al menos un producto antes de continuar.');
        setSaving(false);
        return;
      }

      await sbPost('relevamientos', entries);

      const alertas = entries.filter(e => {
        const prod = productos.find(p => p.id === e.producto_id);
        const status = getStockStatus(e.cantidad, prod?.stock_minimo ?? null);
        return status === 'red' || status === 'amber';
      });

      const [pedido] = await sbPost<{ id: number }>('pedidos', { fecha, estado: 'borrador' });

      if (alertas.length > 0 && pedido?.id) {
        const items = alertas.map(e => {
          const prod = productos.find(p => p.id === e.producto_id);
          const sugerida = prod?.stock_minimo != null ? Math.max(0, prod.stock_minimo - e.cantidad) : 1;
          return { pedido_id: pedido.id, producto_id: e.producto_id, cantidad: sugerida, cantidad_ajustada: null };
        });
        await sbPost('pedido_items', items);
      }

      router.push(`/stock/pedido/${pedido?.id ?? ''}`);
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Intentá de nuevo.');
    }
    setSaving(false);
  }

  if (ipOk === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="font-bold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-sm text-gray-500">Esta pantalla solo es accesible desde la red del local.</p>
        </div>
      </div>
    );
  }

  if (ipOk === null || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando...</p>
      </div>
    );
  }

  const hayAlertas = Object.entries(cantidades).some(([id, v]) => {
    if (v === '' || isNaN(parseFloat(v))) return false;
    const prod = productos.find(p => p.id === parseInt(id));
    return ['red', 'amber'].includes(getStockStatus(parseFloat(v), prod?.stock_minimo ?? null));
  });

  const ingresados = Object.values(cantidades).filter(v => v !== '' && !isNaN(parseFloat(v))).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stock" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Relevamiento</h1>
              <p className="text-xs text-gray-500 mt-0.5">{ingresados} productos ingresados</p>
            </div>
          </div>
          <button
            onClick={handleGuardar}
            disabled={saving || ingresados === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {saving ? 'Guardando…' : hayAlertas ? 'Ver alertas' : 'Guardar'}
          </button>
        </div>

        {/* Buscador */}
        <div className="max-w-5xl mx-auto mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
            />
            {busqueda !== '' && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-3">
        {Object.keys(grouped).length === 0 && busquedaNorm !== '' && (
          <div className="text-center py-10 text-sm text-gray-400">
            No se encontraron productos para "{busqueda}"
          </div>
        )}

        {Object.entries(grouped).map(([proveedor, prods]) => {
          const open = isAbierto(proveedor);
          const ingresadosEnProv = prods.filter(p => {
            const v = cantidades[p.id];
            return v !== undefined && v !== '' && !isNaN(parseFloat(v));
          }).length;
          const alertasEnProv = prods.filter(p => {
            const v = cantidades[p.id];
            if (!v || isNaN(parseFloat(v))) return false;
            return ['red', 'amber'].includes(getStockStatus(parseFloat(v), p.stock_minimo ?? null));
          }).length;

          return (
            <div key={proveedor} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleProveedor(proveedor)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {open
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                  <span className="text-sm font-semibold text-gray-700">{proveedor}</span>
                  <span className="text-xs text-gray-400">{prods.length} productos</span>
                </div>
                <div className="flex items-center gap-2">
                  {ingresadosEnProv > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                      {ingresadosEnProv} ingresados
                    </span>
                  )}
                  {alertasEnProv > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                      {alertasEnProv} alertas
                    </span>
                  )}
                </div>
              </button>

              {open && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {prods.map(prod => {
                    const raw = cantidades[prod.id] ?? '';
                    const val = parseFloat(raw);
                    const status = raw !== '' && !isNaN(val) ? getStockStatus(val, prod.stock_minimo) : null;
                    return (
                      <div key={prod.id} className="flex items-center justify-between px-5 py-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{prod.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{prod.unidad}</span>
                            {prod.stock_minimo != null && (
                              <span className="text-xs text-gray-400">· mín {prod.stock_minimo}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {status === 'red' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Sin stock</span>}
                          {status === 'amber' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Bajo</span>}
                          {status === 'green' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">OK</span>}
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="—"
                            value={cantidades[prod.id] ?? ''}
                            onChange={e => setCantidades(prev => ({ ...prev, [prod.id]: e.target.value }))}
                            className={`w-24 text-right text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${inputColor(prod)}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
