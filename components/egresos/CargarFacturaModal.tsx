'use client';
import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, Plus, Trash2, ChevronDown, FileText } from 'lucide-react';
import { Egreso, InvoiceItem, InvoiceExtracted, CONCEPTOS, FORMAS_PAGO, generateId } from '@/lib/egresos';
import { formatARS } from '@/lib/utils';

interface CargarFacturaModalProps {
  onClose: () => void;
  onGuardar: (egresos: Egreso[]) => void;
}

interface EditableItem extends InvoiceItem {
  _id: string;
}

const EMPTY_ITEM = (): EditableItem => ({
  _id: generateId(),
  descripcion: '',
  cantidad: 1,
  unidad: 'u',
  precioUnitario: 0,
  precioTotal: 0,
});

function todayDDMMYYYY(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function parseDateToParts(fecha: string): { dia: number; mes: number; anio: number } {
  const parts = fecha.split('/');
  if (parts.length === 3) {
    return { dia: parseInt(parts[0]), mes: parseInt(parts[1]), anio: parseInt(parts[2]) };
  }
  const now = new Date();
  return { dia: now.getDate(), mes: now.getMonth() + 1, anio: now.getFullYear() };
}

export function CargarFacturaModal({ onClose, onGuardar }: CargarFacturaModalProps) {
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Extracted / manual fields
  const [proveedor, setProveedor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fecha, setFecha] = useState(todayDDMMYYYY());
  const [items, setItems] = useState<EditableItem[]>([EMPTY_ITEM()]);
  const [concepto, setConcepto] = useState<string>(CONCEPTOS[0]);
  const [formaDePago, setFormaDePago] = useState<string>(FORMAS_PAGO[0]);
  const [estado, setEstado] = useState<'pagado' | 'pendiente'>('pendiente');
  const [encargado, setEncargado] = useState('');
  const [error, setError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setLoading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: InvoiceExtracted = await res.json();
      if (data.proveedor) setProveedor(data.proveedor);
      if (data.numeroFactura) setNumeroFactura(data.numeroFactura);
      if (data.fecha) setFecha(data.fecha);
      if (data.items && data.items.length > 0) {
        setItems(data.items.map(it => ({ ...it, _id: generateId() })));
      }
      setStep('form');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Solo se aceptan imágenes o PDF');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(file.type.startsWith('image/') ? url : null);
    processFile(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map(it => {
      if (it._id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === 'cantidad' || field === 'precioUnitario') {
        updated.precioTotal = Number(updated.cantidad) * Number(updated.precioUnitario);
      }
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, EMPTY_ITEM()]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.length > 1 ? prev.filter(it => it._id !== id) : prev);
  }

  function handleGuardar() {
    if (!fecha) { setError('La fecha es requerida'); return; }
    if (items.every(it => !it.descripcion && !it.precioTotal)) { setError('Agregá al menos un ítem'); return; }

    const { dia, mes, anio } = parseDateToParts(fecha);
    const egresos: Egreso[] = items
      .filter(it => it.descripcion || it.precioTotal > 0)
      .map(it => ({
        id: generateId(),
        fecha,
        dia,
        mes,
        anio,
        concepto: concepto as Egreso['concepto'],
        insumoRequerido: it.descripcion,
        cantidad: Number(it.cantidad) || 0,
        unidad: it.unidad || 'u',
        precioUnitario: Number(it.precioUnitario) || 0,
        precioFactura: Number(it.precioTotal) || 0,
        proveedor,
        formaDePago: formaDePago as Egreso['formaDePago'],
        numeroFactura,
        comprobante: encargado,
        estado,
        fechaPago: estado === 'pagado' ? todayDDMMYYYY() : null,
      }));

    onGuardar(egresos);
  }

  const totalFactura = items.reduce((s, it) => s + (Number(it.precioTotal) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">
            {step === 'upload' ? 'Nueva factura' : 'Confirmar datos'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !loading && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
                } ${loading ? 'cursor-wait opacity-70' : ''}`}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm text-gray-600 font-medium">Analizando factura con Claude…</p>
                    <p className="text-xs text-gray-400">Esto puede tardar unos segundos</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">Arrastrá una foto o PDF de la factura</p>
                    <p className="text-xs text-gray-400">o hacé clic para seleccionar</p>
                    <p className="text-xs text-gray-300 mt-1">JPG, PNG, PDF</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">o</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Cargar manualmente sin imagen
              </button>
            </>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <>
              {/* Datos generales */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor</label>
                  <input
                    value={proveedor}
                    onChange={e => setProveedor(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">N° Factura</label>
                  <input
                    value={numeroFactura}
                    onChange={e => setNumeroFactura(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="0001-00000001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha entrega (DD/MM/AAAA)</label>
                  <input
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="DD/MM/AAAA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Encargado del pedido</label>
                  <input
                    value={encargado}
                    onChange={e => setEncargado(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                  <div className="relative">
                    <select
                      value={concepto}
                      onChange={e => setConcepto(e.target.value)}
                      className="w-full text-sm px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {CONCEPTOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Forma de pago</label>
                  <div className="relative">
                    <select
                      value={formaDePago}
                      onChange={e => setFormaDePago(e.target.value)}
                      className="w-full text-sm px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {FORMAS_PAGO.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Estado del pago</label>
                <div className="flex gap-3">
                  {(['pendiente', 'pagado'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setEstado(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        estado === s
                          ? s === 'pagado' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {s === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">Ítems de la factura</label>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Plus className="w-3 h-3" /> Agregar ítem
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Descripción</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-16">Cant.</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-500 w-16">Unidad</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-24">P. Unit.</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-24">Total</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map(it => (
                        <tr key={it._id}>
                          <td className="px-2 py-1.5">
                            <input
                              value={it.descripcion}
                              onChange={e => updateItem(it._id, 'descripcion', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
                              placeholder="Descripción"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={it.cantidad}
                              onChange={e => updateItem(it._id, 'cantidad', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs text-right"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={it.unidad}
                              onChange={e => updateItem(it._id, 'unidad', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={it.precioUnitario}
                              onChange={e => updateItem(it._id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs text-right"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              value={it.precioTotal}
                              onChange={e => updateItem(it._id, 'precioTotal', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs text-right font-semibold"
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <button
                              onClick={() => removeItem(it._id)}
                              disabled={items.length === 1}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Total factura:</td>
                        <td className="px-2 py-2 text-right text-sm font-bold text-gray-900">{formatARS(totalFactura)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {step === 'form' && (
            <button
              onClick={() => setStep('upload')}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            {step === 'form' && (
              <button
                onClick={handleGuardar}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Confirmar y guardar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
