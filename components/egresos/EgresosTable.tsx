'use client';
import React, { useState } from 'react';
import { Trash2, CheckCircle, ChevronDown } from 'lucide-react';
import { Egreso, ConceptoEgreso, FormaDePago, CONCEPTOS, FORMAS_PAGO } from '@/lib/egresos';
import { formatARS } from '@/lib/utils';

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

interface EgresosTableProps {
  egresos: Egreso[];
  onMarcarPagado: (id: string) => void;
  onEliminar: (id: string) => void;
  onExportar: () => void;
}

export function EgresosTable({ egresos, onMarcarPagado, onEliminar, onExportar }: EgresosTableProps) {
  const now = new Date();
  const [filtroMes, setFiltroMes] = useState(now.getMonth() + 1);
  const [filtroAnio, setFiltroAnio] = useState(now.getFullYear());
  const [filtroConcepto, setFiltroConcepto] = useState<ConceptoEgreso | ''>('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pagado' | 'pendiente'>('todos');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const anos = Array.from(new Set(egresos.map(e => e.anio))).sort((a, b) => b - a);
  if (!anos.includes(now.getFullYear())) anos.unshift(now.getFullYear());

  const filtrados = egresos.filter(e => {
    if (e.mes !== filtroMes) return false;
    if (e.anio !== filtroAnio) return false;
    if (filtroConcepto && e.concepto !== filtroConcepto) return false;
    if (filtroProveedor && !e.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())) return false;
    if (filtroEstado !== 'todos' && e.estado !== filtroEstado) return false;
    return true;
  });

  const proveedores = Array.from(new Set(egresos.map(e => e.proveedor).filter(Boolean)));

  function handleEliminar(id: string) {
    if (confirmDelete === id) {
      onEliminar(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Mes</label>
            <div className="relative">
              <select
                value={filtroMes}
                onChange={e => setFiltroMes(Number(e.target.value))}
                className="pl-2.5 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Anio</label>
            <div className="relative">
              <select
                value={filtroAnio}
                onChange={e => setFiltroAnio(Number(e.target.value))}
                className="pl-2.5 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Concepto</label>
            <div className="relative">
              <select
                value={filtroConcepto}
                onChange={e => setFiltroConcepto(e.target.value as ConceptoEgreso | '')}
                className="pl-2.5 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Todos</option>
                {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Proveedor</label>
            <input
              type="text"
              value={filtroProveedor}
              onChange={e => setFiltroProveedor(e.target.value)}
              placeholder="Buscar..."
              className="pl-2.5 pr-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-32"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Estado</label>
            <div className="relative">
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as 'todos' | 'pagado' | 'pendiente')}
                className="pl-2.5 pr-7 py-1.5 text-xs border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="todos">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={onExportar}
            className="ml-auto px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Sin registros para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Fecha','Concepto','Insumo','Cant.','Unidad','P. Unit.','P. Factura','Proveedor','Forma pago','Estado','Acciones'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(egreso => (
                  <tr
                    key={egreso.id}
                    className={egreso.estado === 'pendiente' ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-gray-50'}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{egreso.fecha}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{egreso.concepto}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[120px] truncate">{egreso.insumoRequerido || '-'}</td>
                    <td className="px-3 py-2.5 text-gray-700 text-right tabular-nums">{egreso.cantidad || '-'}</td>
                    <td className="px-3 py-2.5 text-gray-500">{egreso.unidad || '-'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{egreso.precioUnitario ? formatARS(egreso.precioUnitario) : '-'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-900">{formatARS(egreso.precioFactura)}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[100px] truncate">{egreso.proveedor || '-'}</td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{egreso.formaDePago}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {egreso.estado === 'pagado'
                        ? <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Pagado</span>
                        : <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pendiente</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {egreso.estado === 'pendiente' && (
                          <button
                            onClick={() => onMarcarPagado(egreso.id)}
                            className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                            title="Marcar como pagado"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEliminar(egreso.id)}
                          className={`p-1 rounded transition-colors ${confirmDelete === egreso.id ? 'bg-red-100 text-red-600' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                          title={confirmDelete === egreso.id ? 'Clic para confirmar' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={6} className="px-3 py-2.5 text-xs text-gray-500 font-semibold">
                    {filtrados.length} registro{filtrados.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-gray-900 tabular-nums">
                    {formatARS(filtrados.reduce((s, e) => s + (e.precioFactura || 0), 0))}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
