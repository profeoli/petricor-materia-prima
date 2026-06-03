'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Plus, Save, Edit2, X, Check } from 'lucide-react';
import { sbGet, sbPost, sbPatch, CATEGORIAS_ORDEN } from '@/lib/stock';
import type { Producto, Proveedor } from '@/lib/stock';

const ADMIN_PASSWORD = 'petricor2026';
const PROVEEDORES_LISTA = ['La Buena Cosecha','Blancaluna','Verdulería Tucumán','Bufano Alimentos','Fuego Café','Femsa/Juntos+','Tregar','Magbox','Manteca LB'];
const UNIDADES = ['kg','unidad','atado','litro','maple','caja','docena','bolsa','paquete'];
const PROD_VACIO = { nombre: '', categoria: CATEGORIAS_ORDEN[0], proveedor: PROVEEDORES_LISTA[0], unidad: 'kg', stock_minimo: '', activo: true };

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [passError, setPassError] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'productos' | 'proveedores'>('productos');
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Producto> & { stock_minimo: string | number | null }>({ ...PROD_VACIO });
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevoData, setNuevoData] = useState({ ...PROD_VACIO });
  const [editProvId, setEditProvId] = useState<number | null>(null);
  const [editProvNum, setEditProvNum] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [prods, provs] = await Promise.all([
      sbGet<Producto>('productos', 'order=categoria.asc,nombre.asc'),
      sbGet<Proveedor>('proveedores', 'order=nombre.asc'),
    ]);
    setProductos(prods);
    setProveedores(provs);
    setLoading(false);
  }, []);

  useEffect(() => { if (auth) load(); }, [auth, load]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass === ADMIN_PASSWORD) { setAuth(true); setPassError(false); }
    else setPassError(true);
  }

  async function handleSaveProducto(id: number) {
    const minimo = editData.stock_minimo === '' || editData.stock_minimo === null ? null : parseFloat(String(editData.stock_minimo));
    await sbPatch('productos', `id=eq.${id}`, {
      nombre: editData.nombre, categoria: editData.categoria, proveedor: editData.proveedor,
      unidad: editData.unidad, stock_minimo: isNaN(minimo as number) ? null : minimo, activo: editData.activo,
    });
    setEditId(null);
    load();
  }

  async function handleNuevoProducto(e: React.FormEvent) {
    e.preventDefault();
    const minimo = nuevoData.stock_minimo === '' ? null : parseFloat(String(nuevoData.stock_minimo));
    await sbPost('productos', {
      nombre: nuevoData.nombre, categoria: nuevoData.categoria, proveedor: nuevoData.proveedor,
      unidad: nuevoData.unidad, stock_minimo: isNaN(minimo as number) ? null : minimo, activo: true,
    });
    setShowNuevo(false);
    setNuevoData({ ...PROD_VACIO });
    load();
  }

  async function handleSaveProveedor(id: number) {
    await sbPatch('proveedores', `id=eq.${id}`, { numero_whatsapp: editProvNum || null });
    setEditProvId(null);
    load();
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
            <Lock className="w-5 h-5 text-gray-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Administración</h1>
          <p className="text-sm text-gray-500 mb-5">Ingresá la contraseña para continuar.</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={pass}
              onChange={e => { setPass(e.target.value); setPassError(false); }}
              placeholder="Contraseña"
              autoFocus
              className={`w-full text-sm px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 ${passError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
            {passError && <p className="text-xs text-red-500">Contraseña incorrecta.</p>}
            <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const groupedProds = CATEGORIAS_ORDEN.reduce<Record<string, Producto[]>>((acc, cat) => {
    const items = productos.filter(p => p.categoria === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});
  const otrosProds = productos.filter(p => !CATEGORIAS_ORDEN.includes(p.categoria));
  if (otrosProds.length > 0) groupedProds['Otros'] = otrosProds;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stock" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Administración</h1>
              <p className="text-xs text-gray-500 mt-0.5">Productos y proveedores</p>
            </div>
          </div>
          <button
            onClick={() => { setShowNuevo(true); setEditId(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="flex gap-2">
          {(['productos', 'proveedores'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >{t}</button>
          ))}
        </div>

        {showNuevo && tab === 'productos' && (
          <div className="bg-white border border-indigo-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Nuevo producto</h3>
            <form onSubmit={handleNuevoProducto} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input required value={nuevoData.nombre} onChange={e => setNuevoData(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoría</label>
                <select value={nuevoData.categoria} onChange={e => setNuevoData(p => ({ ...p, categoria: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none">
                  {CATEGORIAS_ORDEN.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Proveedor</label>
                <select value={nuevoData.proveedor} onChange={e => setNuevoData(p => ({ ...p, proveedor: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none">
                  {PROVEEDORES_LISTA.map(pr => <option key={pr}>{pr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unidad</label>
                <select value={nuevoData.unidad} onChange={e => setNuevoData(p => ({ ...p, unidad: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none">
                  {UNIDADES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Stock mínimo (opcional)</label>
                <input type="number" min="0" step="0.5" placeholder="—" value={nuevoData.stock_minimo}
                  onChange={e => setNuevoData(p => ({ ...p, stock_minimo: e.target.value }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Guardar</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'productos' && (
          loading ? <div className="text-center py-10 text-sm text-gray-400">Cargando...</div> :
          Object.entries(groupedProds).map(([cat, prods]) => (
            <div key={cat} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {prods.map(prod => (
                  <div key={prod.id} className="px-5 py-3">
                    {editId === prod.id ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <input value={editData.nombre ?? ''} onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))}
                          className="col-span-2 px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                        <select value={editData.categoria ?? ''} onChange={e => setEditData(p => ({ ...p, categoria: e.target.value }))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none">
                          {CATEGORIAS_ORDEN.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select value={editData.proveedor ?? ''} onChange={e => setEditData(p => ({ ...p, proveedor: e.target.value }))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none">
                          {PROVEEDORES_LISTA.map(pr => <option key={pr}>{pr}</option>)}
                        </select>
                        <select value={editData.unidad ?? ''} onChange={e => setEditData(p => ({ ...p, unidad: e.target.value }))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none">
                          {UNIDADES.map(u => <option key={u}>{u}</option>)}
                        </select>
                        <input type="number" min="0" step="0.5" placeholder="Stock mínimo" value={editData.stock_minimo ?? ''}
                          onChange={e => setEditData(p => ({ ...p, stock_minimo: e.target.value }))}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none" />
                        <div className="col-span-2 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={editData.activo ?? true} onChange={e => setEditData(p => ({ ...p, activo: e.target.checked }))} className="rounded" />
                            Activo
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            <button onClick={() => handleSaveProducto(prod.id)} className="p-1.5 text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${prod.activo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{prod.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{prod.proveedor}</span><span>·</span><span>{prod.unidad}</span>
                            {prod.stock_minimo != null && <><span>·</span><span>mín {prod.stock_minimo}</span></>}
                          </div>
                        </div>
                        <button onClick={() => { setEditId(prod.id); setEditData({ nombre: prod.nombre, categoria: prod.categoria, proveedor: prod.proveedor, unidad: prod.unidad, stock_minimo: prod.stock_minimo ?? '', activo: prod.activo }); }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {tab === 'proveedores' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Números de WhatsApp</h2>
            </div>
            {loading ? <div className="p-10 text-center text-sm text-gray-400">Cargando...</div> : (
              <div className="divide-y divide-gray-50">
                {PROVEEDORES_LISTA.map(nombre => {
                  const prov = proveedores.find(p => p.nombre === nombre);
                  const isEditing = editProvId === prov?.id;
                  return (
                    <div key={nombre} className="flex items-center justify-between px-5 py-3 gap-4">
                      <p className="text-sm font-medium text-gray-900 flex-1">{nombre}</p>
                      {isEditing && prov ? (
                        <div className="flex items-center gap-2">
                          <input type="tel" placeholder="+54911..." value={editProvNum} onChange={e => setEditProvNum(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 w-40" />
                          <button onClick={() => setEditProvId(null)} className="p-1.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                          <button onClick={() => handleSaveProveedor(prov.id)} className="p-1.5 text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">{prov?.numero_whatsapp ?? 'Sin número'}</span>
                          {prov && (
                            <button onClick={() => { setEditProvId(prov.id); setEditProvNum(prov.numero_whatsapp ?? ''); }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
