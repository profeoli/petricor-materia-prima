'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Lock, ChevronDown, ChevronRight, Search, X, RotateCcw } from 'lucide-react';
import { sbGet, sbPost, getStockStatus } from '@/lib/stock';
import type { Producto } from '@/lib/stock';

const ALLOWED_IP = '152.168.40.164';
const LS_KEY = 'ptc_relevamiento_borrador';

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
  'Frigorífico Martelli',
  'Dietética',
  'Superbe',
];

const CONVERSIONES: Record<string, { unidadAlt: string; kgPorUnidad: number }> = {
  'Limón':        { unidadAlt: 'unidad', kgPorUnidad: 0.1 },
  'Pera':         { unidadAlt: 'unidad', kgPorUnidad: 0.18 },
  'Ciruela':      { unidadAlt: 'unidad', kgPorUnidad: 0.08 },
  'Manzana':      { unidadAlt: 'unidad', kgPorUnidad: 0.18 },
  'Cebolla':      { unidadAlt: 'unidad', kgPorUnidad: 0.15 },
  'Naranja':      { unidadAlt: 'unidad', kgPorUnidad: 0.2 },
  'Pomelo':       { unidadAlt: 'unidad', kgPorUnidad: 0.35 },
  'Banana':       { unidadAlt: 'unidad', kgPorUnidad: 0.12 },
  'Palta':        { unidadAlt: 'unidad', kgPorUnidad: 0.2 },
  'Romero':       { unidadAlt: 'gr',     kgPorUnidad: 0.001 },
  'Morrón':       { unidadAlt: 'unidad', kgPorUnidad: 0.15 },
  'Papa':         { unidadAlt: 'unidad', kgPorUnidad: 0.15 },
  'Pepino':       { unidadAlt: 'unidad', kgPorUnidad: 0.25 },
  'Remolacha':    { unidadAlt: 'unidad', kgPorUnidad: 0.2 },
  'Tomate':       { unidadAlt: 'unidad', kgPorUnidad: 0.15 },
  'Zanahoria':    { unidadAlt: 'unidad', kgPorUnidad: 0.1 },
  'Zapallo anco': { unidadAlt: 'unidad', kgPorUnidad: 1.5 },
  'Zucchini':     { unidadAlt: 'unidad', kgPorUnidad: 0.25 },
};

function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getOpciones(prod: Producto): string[] {
  const conv = CONVERSIONES[prod.nombre];
  const base = prod.unidad;
  const opcionesPorBase: Record<string, string[]> = {
    'kg':     ['kg', 'unidad'],
    'unidad': ['unidad', 'kg'],
    'atado':  ['atado', 'gr'],
    'litro':  ['litro'],
    'maple':  ['maple'],
  };
  const opciones = [...(opcionesPorBase[base] ?? [base])];
  if (conv && !opciones.includes(conv.unidadAlt)) opciones.push(conv.unidadAlt);
  return opciones;
}

function cantidadEnKg(prod: Producto, raw: string, unidadSeleccionada: string): number {
  const val = parseFloat(raw);
  if (isNaN(val)) return NaN;
  const conv = CONVERSIONES[prod.nombre];
  if (conv && unidadSeleccionada === conv.unidadAlt) return val * conv.kgPorUnidad;
  if (unidadSeleccionada === 'gr') return val / 1000;
  return val;
}

interface Borrador {
  fecha: string;
  encargado: string;
  cantidades: Record<number, string>;
  unidades: Record<number, string>;
}

function cargarBorrador(): Borrador | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function guardarBorrador(encargado: string, cantidades: Record<number, string>, unidades: Record<number, string>) {
  try {
    const fecha = new Date().toISOString().slice(0, 10);
    localStorage.setItem(LS_KEY, JSON.stringify({ fecha, encargado, cantidades, unidades }));
  } catch {}
}

function limpiarBorrador() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

const ENCARGADOS = ['Encargado mañana', 'Encargado tarde'];

export default function RelevamientoPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [unidades, setUnidades] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ipOk, setIpOk] = useState<boolean | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [borradorFecha, setBorradorFecha] = useState<string | null>(null);
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [encargado, setEncargado] = useState<string | null>(null);

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
      const initUnidades: Record<number, string> = {};
      data.forEach(p => { initUnidades[p.id] = p.unidad; });
      const borrador = cargarBorrador();
      if (borrador && Object.keys(borrador.cantidades).length > 0) {
        setBorradorFecha(borrador.fecha);
        setMostrarBanner(true);
        setEncargado(borrador.encargado ?? null);
        setUnidades({ ...initUnidades, ...borrador.unidades });
        setCantidades(borrador.cantidades);
      } else {
        setUnidades(initUnidades);
      }
    } catch {
      setProductos([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProductos(); }, [loadProductos]);

  useEffect(() => {
    if (encargado && Object.keys(cantidades).length > 0) {
      guardarBorrador(encargado, cantidades, unidades);
    }
  }, [cantidades, unidades, encargado]);

  function descartarBorrador() {
    limpiarBorrador();
    setMostrarBanner(false);
    setBorradorFecha(null);
    setEncargado(null);
    const initUnidades: Record<number, string> = {};
    productos.forEach(p => { initUnidades[p.id] = p.unidad; });
    setCantidades({});
    setUnidades(initUnidades);
  }

  const busquedaNorm = normalizarTexto(busqueda.trim());

  const grouped = PROVEEDORES_ORDEN.reduce<Record<string, Producto[]>>((acc, prov) => {
    const items = productos
      .filter(p => p.proveedor === prov)
      .filter(p => busquedaNorm === '' || normalizarTexto(p.nombre).includes(busquedaNorm));
    if (items.length > 0) acc[prov] = items;
    return acc;
  }, {});
  const otrosProds = productos
    .filter(p => !PROVEEDORES_ORDEN.includes(p.proveedor))
    .filter(p => busquedaNorm === '' || normalizarTexto(p.nombre).includes(busquedaNorm));
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
    const unidadSel = unidades[prod.id] ?? prod.unidad;
    const valKg = cantidadEnKg(prod, raw, unidadSel);
    if (isNaN(valKg)) return 'border-gray-200 focus:ring-indigo-400';
    const status = getStockStatus(valKg, prod.stock_minimo);
    if (status === 'red') return 'border-red-300 bg-red-50 focus:ring-red-400 text-red-700';
    if (status === 'amber') return 'border-amber-300 bg-amber-50 focus:ring-amber-400 text-amber-700';
    if (status === 'green') return 'border-green-300 bg-green-50 focus:ring-green-400 text-green-700';
    return 'border-gray-200 focus:ring-indigo-400';
  }

  async function handleGuardar() {
    if (!encargado) return;
    setSaving(true);
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      const entries = Object.entries(cantidades)
        .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
        .map(([id, v]) => {
          const prod = productos.find(p => p.id === parseInt(id))!;
          const unidadSel = unidades[parseInt(id)] ?? prod.unidad;
          const cantidad = cantidadEnKg(prod, v, unidadSel);
          return { fecha, producto_id: parseInt(id), cantidad, encargado };
        });

      if (entries.length === 0) {
        alert('Ingresa al menos un producto antes de continuar.');
        setSaving(false);
        return;
      }

      await sbPost('relevamientos', entries);

      const alertas = entries.filter(e => {
        const prod = productos.find(p => p.id === e.producto_id);
        const status = getStockStatus(e.cantidad, prod?.stock_minimo ?? null);
        return status === 'red' || status === 'amber';
      });

      const [pedido] = await sbPost<{ id: number }>('pedidos', { fecha, estado: 'borrador', encargado });

      if (alertas.length > 0 && pedido?.id) {
        const items = alertas.map(e => {
          const prod = productos.find(p => p.id === e.producto_id);
          const sugerida = prod?.stock_minimo != null ? Math.max(0, prod.stock_minimo - e.cantidad) : 1;
          return { pedido_id: pedido.id, producto_id: e.producto_id, cantidad: sugerida, cantidad_ajustada: null };
        });
        await sbPost('pedido_items', items);
      }

      limpiarBorrador();
      router.push(`/stock/pedido/${pedido?.id ?? ''}`);
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Intenta de nuevo.');
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

  if (!encargado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Quien esta relevando?</h2>
            <p className="text-sm text-gray-500">Elegi tu turno para continuar</p>
          </div>
          <div className="space-y-3">
            {ENCARGADOS.map(e => (
              <button
                key={e}
                onClick={() => setEncargado(e)}
                className="w-full py-4 px-5 text-left border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{e}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/stock" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hayAlertas = Object.entries(cantidades).some(([id, v]) => {
    if (v === '' || isNaN(parseFloat(v))) return false;
    const prod = productos.find(p => p.id === parseInt(id));
    if (!prod) return false;
    const unidadSel = unidades[parseInt(id)] ?? prod.unidad;
    const valKg = cantidadEnKg(prod, v, unidadSel);
    return ['red', 'amber'].includes(getStockStatus(valKg, prod?.stock_minimo ?? null));
  });

  const ingresados = Object.values(cantidades).filter(v => v !== '' && !isNaN(parseFloat(v))).length;

  function fmtFecha(fecha: string) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setEncargado(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Relevamiento</h1>
              <p className="text-xs text-gray-500 mt-0.5">{encargado} · {ingresados} productos ingresados</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/stock"
              onClick={limpiarBorrador}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleGuardar}
              disabled={saving || ingresados === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              {saving ? 'Guardando...' : hayAlertas ? 'Ver alertas' : 'Guardar'}
            </button>
          </div>
        </div>

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

      {mostrarBanner && borradorFecha && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Relevamiento del <span className="font-semibold">{fmtFecha(borradorFecha)}</span> recuperado — {ingresados} productos ingresados
              </p>
            </div>
            <button
              onClick={descartarBorrador}
              className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 flex-shrink-0"
            >
              Descartar y empezar de cero
            </button>
          </div>
        </div>
      )}

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
            const unidadSel = unidades[p.id] ?? p.unidad;
            const valKg = cantidadEnKg(p, v, unidadSel);
            return ['red', 'amber'].includes(getStockStatus(valKg, p.stock_minimo ?? null));
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
                    const unidadSel = unidades[prod.id] ?? prod.unidad;
                    const valKg = raw !== '' && !isNaN(parseFloat(raw))
                      ? cantidadEnKg(prod, raw, unidadSel)
                      : NaN;
                    const status = !isNaN(valKg) ? getStockStatus(valKg, prod.stock_minimo) : null;
                    const opciones = getOpciones(prod);
                    const muestraConversion = unidadSel !== prod.unidad && raw !== '' && !isNaN(parseFloat(raw)) && !isNaN(valKg);

                    return (
                      <div key={prod.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{prod.nombre}</p>
                            {prod.stock_minimo != null && (
                              <p className="text-xs text-gray-400 mt-0.5">min {prod.stock_minimo} {prod.unidad}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {status === 'red' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Sin stock</span>}
                            {status === 'amber' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Bajo</span>}
                            {status === 'green' && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-600">OK</span>}
                            {opciones.length > 1 ? (
                              <select
                                value={unidadSel}
                                onChange={e => setUnidades(prev => ({ ...prev, [prod.id]: e.target.value }))}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              >
                                {opciones.map(op => (
                                  <option key={op} value={op}>{op}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-gray-400 min-w-[36px] text-right">{prod.unidad}</span>
                            )}
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="—"
                              value={cantidades[prod.id] ?? ''}
                              onChange={e => setCantidades(prev => ({ ...prev, [prod.id]: e.target.value }))}
                              className={`w-20 text-right text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${inputColor(prod)}`}
                            />
                          </div>
                        </div>
                        {muestraConversion && (
                          <p className="text-xs text-gray-400 mt-1 text-right">
                            aprox {valKg.toFixed(2)} {prod.unidad}
                          </p>
                        )}
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
