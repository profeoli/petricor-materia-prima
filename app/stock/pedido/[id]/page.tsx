'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { sbGet, sbPatch, getStockStatus } from '@/lib/stock';
import type { Pedido, PedidoItem, Producto, Relevamiento } from '@/lib/stock';

interface ItemConDatos extends PedidoItem {
  producto: Producto;
  stock_actual: number;
  status: 'red' | 'amber';
  cantidadEdit: string;
}

export default function PedidoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [items, setItems] = useState<ItemConDatos[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ped] = await sbGet<Pedido>('pedidos', `id=eq.${id}`);
      if (!ped) { setLoading(false); return; }
      setPedido(ped);

      const pedItems = await sbGet<PedidoItem>('pedido_items', `pedido_id=eq.${id}`);
      const productos = await sbGet<Producto>('productos', 'activo=eq.true');
      const relev = await sbGet<Relevamiento>('relevamientos', `fecha=eq.${ped.fecha}`);

      const itemsConDatos: ItemConDatos[] = pedItems.map(item => {
        const prod = productos.find(p => p.id === item.producto_id)!;
        const rev = relev.find(r => r.producto_id === item.producto_id);
        const stockActual = rev?.cantidad ?? 0;
        const status = getStockStatus(stockActual, prod?.stock_minimo ?? null);
        const cantSugerida = item.cantidad_ajustada ?? item.cantidad;
        return { ...item, producto: prod, stock_actual: stockActual, status: status as 'red' | 'amber', cantidadEdit: String(cantSugerida) };
      }).filter(i => i.producto && (i.status === 'red' || i.status === 'amber'));

      setItems(itemsConDatos);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function updateCantidad(itemId: number, value: string) {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, cantidadEdit: value } : i));
  }

  async function handleConfirmar() {
    setSaving(true);
    try {
      for (const item of items) {
        const val = parseFloat(item.cantidadEdit);
        if (!isNaN(val)) {
          await sbPatch('pedido_items', `id=eq.${item.id}`, { cantidad_ajustada: val });
        }
      }
      router.push(`/stock/pedido/${id}/enviar`);
    } catch (err) {
      console.error(err);
      alert('Error al guardar. Intentá de nuevo.');
    }
    setSaving(false);
  }

  const rojos = items.filter(i => i.status === 'red');
  const amarillos = items.filter(i => i.status === 'amber');

  function fmtFecha(fecha: string) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Cargando...</p>
    </div>
  );

  if (!pedido) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-sm text-gray-500">Pedido no encontrado.</p>
        <Link href="/stock" className="text-indigo-600 text-sm mt-2 inline-block">Volver al stock</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/stock" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lista de pedido</h1>
              <p className="text-xs text-gray-500 mt-0.5">Relevamiento del {fmtFecha(pedido.fecha)}</p>
            </div>
          </div>
          <button
            onClick={handleConfirmar}
            disabled={saving || items.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Ver pedido sugerido →'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {items.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-500 mb-4">No hay productos con alerta en este relevamiento.</p>
            <Link
              href="/stock"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        )}

        {rojos.length > 0 && (
          <div className="bg-white border border-red-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Sin stock ({rojos.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {rojos.map(item => <ItemRow key={item.id} item={item} onChangeCantidad={updateCantidad} />)}
            </div>
          </div>
        )}

        {amarillos.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-100 bg-amber-50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Stock bajo ({amarillos.length})</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {amarillos.map(item => <ItemRow key={item.id} item={item} onChangeCantidad={updateCantidad} />)}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="text-center">
            <Link href="/stock" className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors">
              Volver al inicio sin generar pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, onChangeCantidad }: { item: ItemConDatos; onChangeCantidad: (id: number, value: string) => void }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.producto.nombre}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-gray-400">{item.producto.proveedor}</span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">Stock actual: {item.stock_actual} {item.producto.unidad}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-500">Pedir:</span>
        <input
          type="number"
          min="0"
          step="0.5"
          value={item.cantidadEdit}
          onChange={e => onChangeCantidad(item.id, e.target.value)}
          className="w-20 text-right text-sm px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <span className="text-xs text-gray-400 w-10">{item.producto.unidad}</span>
      </div>
    </div>
  );
}
