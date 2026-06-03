'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Check, Info } from 'lucide-react';
import { sbGet, sbPatch, getStockStatus } from '@/lib/stock';
import type { Pedido, PedidoItem, Producto, Relevamiento, Proveedor } from '@/lib/stock';

interface ItemEnvio {
  nombre: string;
  cantidad: number;
  unidad: string;
  proveedor: string;
}

interface GrupoProveedor {
  proveedor: string;
  numero: string | null;
  items: ItemEnvio[];
  enviado: boolean;
}

export default function EnviarPage() {
  const params = useParams();
  const id = params.id as string;

  const [grupos, setGrupos] = useState<GrupoProveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoFecha, setPedidoFecha] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ped] = await sbGet<Pedido>('pedidos', `id=eq.${id}`);
      if (!ped) { setLoading(false); return; }
      setPedidoFecha(ped.fecha);

      const pedItems = await sbGet<PedidoItem>('pedido_items', `pedido_id=eq.${id}`);
      const productos = await sbGet<Producto>('productos', 'activo=eq.true');
      const relev = await sbGet<Relevamiento>('relevamientos', `fecha=eq.${ped.fecha}`);
      const proveedores = await sbGet<Proveedor>('proveedores', 'order=nombre.asc');

      const itemsEnvio: ItemEnvio[] = pedItems.map(item => {
        const prod = productos.find(p => p.id === item.producto_id);
        if (!prod) return null;
        const rev = relev.find(r => r.producto_id === item.producto_id);
        const stockActual = rev?.cantidad ?? 0;
        const status = getStockStatus(stockActual, prod.stock_minimo);
        if (status !== 'red' && status !== 'amber') return null;
        const cant = item.cantidad_ajustada ?? item.cantidad;
        if (cant <= 0) return null;
        return { nombre: prod.nombre, cantidad: cant, unidad: prod.unidad, proveedor: prod.proveedor };
      }).filter((i): i is ItemEnvio => i !== null);

      const proveedoresUnicos = [...new Set(itemsEnvio.map(i => i.proveedor))];
      const gruposData: GrupoProveedor[] = proveedoresUnicos.map(prov => {
        const provInfo = proveedores.find(p => p.nombre === prov);
        return { proveedor: prov, numero: provInfo?.numero_whatsapp ?? null, items: itemsEnvio.filter(i => i.proveedor === prov), enviado: false };
      });

      setGrupos(gruposData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function buildMensaje(grupo: GrupoProveedor): string {
    const fecha = pedidoFecha ? (() => { const [y, m, d] = pedidoFecha.split('-'); return `${d}/${m}/${y}`; })() : '';
    const lineas = grupo.items.map(i => `• ${i.nombre}: ${i.cantidad} ${i.unidad}`).join('\n');
    return `Hola, buen día! Soy de Petricor. Necesitamos el siguiente pedido para el ${fecha}:\n\n${lineas}\n\n¡Gracias!`;
  }

  function buildWALink(grupo: GrupoProveedor): string {
    const numero = grupo.numero!.replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(buildMensaje(grupo))}`;
  }

  async function marcarEnviado(index: number) {
    const nuevosGrupos = grupos.map((g, i) => i === index ? { ...g, enviado: true } : g);
    setGrupos(nuevosGrupos);
    if (nuevosGrupos.every(g => g.enviado)) {
      await sbPatch('pedidos', `id=eq.${id}`, { estado: 'enviado' });
    }
  }

  function fmtFecha(fecha: string) {
    const [y, m, d] = fecha.split('-');
    return `${d}/${m}/${y}`;
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-sm text-gray-400">Cargando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href={`/stock/pedido/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Enviar pedidos</h1>
            {pedidoFecha && <p className="text-xs text-gray-500 mt-0.5">Relevamiento del {fmtFecha(pedidoFecha)}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {grupos.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <p className="text-sm text-gray-500">No hay productos para pedir.</p>
          </div>
        )}

        {grupos.map((grupo, index) => (
          <div key={grupo.proveedor} className={`bg-white border rounded-2xl overflow-hidden transition-colors ${grupo.enviado ? 'border-green-200' : 'border-gray-200'}`}>
            <div className={`px-5 py-3 border-b flex items-center justify-between ${grupo.enviado ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                {grupo.enviado && <Check className="w-4 h-4 text-green-500" />}
                <h2 className={`text-sm font-semibold ${grupo.enviado ? 'text-green-700' : 'text-gray-700'}`}>{grupo.proveedor}</h2>
              </div>
              {grupo.numero ? (
                <a
                  href={buildWALink(grupo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => marcarEnviado(index), 1000)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Abrir en WhatsApp
                </a>
              ) : (
                <div className="relative group">
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-xl cursor-not-allowed">
                    <MessageCircle className="w-4 h-4" />
                    Abrir en WhatsApp
                  </button>
                  <div className="absolute right-0 top-full mt-1 z-10 hidden group-hover:flex items-center gap-1.5 bg-gray-900 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap">
                    <Info className="w-3 h-3" />
                    Agregar número desde Administración
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{buildMensaje(grupo)}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
