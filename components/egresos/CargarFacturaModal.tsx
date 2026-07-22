'use client';
import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Loader2, Plus, Trash2, ChevronDown, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InvoiceItem, InvoiceExtracted, CONCEPTOS, FORMAS_PAGO, MESES, generateId, getMesActual } from '@/lib/egresos';
import { formatARS } from '@/lib/utils';

interface CargarFacturaModalProps {
  onClose: () => void;
  onGuardado: (cantidad: number) => void;
}

interface EditableItem extends InvoiceItem {
  _id: string;
}

const EMPTY_ITEM = (): EditableItem => ({
  _id: generateId(),
  descripcion: '',
  cantidad: 1,
  unidad: 'kg',
  precioUnitario: 0,
  precioTotal: 0,
});

// Fecha de hoy en formato DD/MM para las columnas del Sheet.
function todayDDMM(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

// Convierte "YYYY-MM-DD" (del input date) a "DD/MM" para el Sheet.
function isoToDDMM(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  if (!m || !d) return '';
  return `${d}/${m}`;
}

// Fecha de hoy en formato ISO para el valor por defecto del input date.
function todayISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Día del mes (número) a partir de la fecha de la factura "DD/MM/AAAA" o "DD/MM".
function diaDesdeFecha(fecha: string): number {
  const p = fecha.split('/');
  const d = parseInt(p[0]);
  return isNaN(d) ? new Date().getDate() : d;
}

export function CargarFacturaModal({ onClose, onGuardado }: CargarFacturaModalProps) {
  const [step, setStep] = useState<'upload' | 'form'>('upload');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Datos de la factura
  const [proveedor, setProveedor] = useState('');
  const [fechaFactura, setFechaFactura] = useState(''); // DD/MM, lo que se lee de la factura → columna Factura
  const [items, setItems] = useState<EditableItem[]>([EMPTY_ITEM()]);
  const [totalLeido, setTotalLeido] = useState<number | null>(null); // total que declaró la factura

  // Datos del lote (los pone el usuario)
  const [concepto, setConcepto] = useState<string>(CONCEPTOS[0]);
  const [formaDePago, setFormaDePago] = useState<string>(FORMAS_PAGO[0]);
  const [mesDevengado, setMesDevengado] = useState<number>(getMesActual().mes);
  const [fechaPagoISO, setFechaPagoISO] = useState<string>(todayISO());

  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Lectura de factura ---
  async function processFile(file: File) {
    setLoading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/extract-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg' }),
      });
      if (!res.ok) throw new Error(`Error ${res.status} al leer la factura`);
      const data: InvoiceExtracted = await res.json();
      if (data.proveedor) setProveedor(data.proveedor);
      if (data.fecha) setFechaFactura(normalizarFecha(data.fecha));
      if (data.totalFactura) setTotalLeido(Number(data.totalFactura));
      if (data.items && data.items.length > 0) {
        setItems(data.items.map(it => ({
          ...it,
          _id: generateId(),
          precioTotal: it.precioTotal || (Number(it.cantidad) * Number(it.precioUnitario)),
        })));
      }
      setStep('form');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  }

  function normalizarFecha(fecha: string): string {
    // Devuelve DD/MM a partir de "DD/MM/AAAA" o "DD/MM".
    const p = fecha.split('/');
    if (p.length >= 2) return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}`;
    return fecha;
  }

function fileToBase64(file: File): Promise<string> {
    // Los PDF se mandan tal cual (no se comprimen como imagen).
    if (file.type === 'application/pdf') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    // Las imágenes se redimensionan y comprimen para no superar el límite de subida.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxLado = 1600; // px máximo del lado más largo
          let { width, height } = img;
          if (width > height && width > maxLado) {
            height = Math.round((height * maxLado) / width);
            width = maxLado;
          } else if (height >= width && height > maxLado) {
            width = Math.round((width * maxLado) / height);
            height = maxLado;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No se pudo procesar la imagen')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl.split(',')[1]);
        };
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = reader.result as string;
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
    processFile(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  // --- Edición de ítems ---
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

  // Agrega un renglón IIBB con la diferencia exacta contra el total leído.
  function agregarIIBB(diferencia: number) {
    setItems(prev => [...prev, {
      _id: generateId(),
      descripcion: 'IIBB',
      cantidad: 1,
      unidad: 'unidad',
      precioUnitario: diferencia,
      precioTotal: diferencia,
    }]);
  }

  const totalItems = items.reduce((s, it) => s + (Number(it.precioTotal) || 0), 0);
  // Diferencia contra lo que declaró la factura (si se leyó un total).
  const diferencia = totalLeido != null ? Number((totalLeido - totalItems).toFixed(2)) : 0;
  const hayDescuadre = totalLeido != null && Math.abs(diferencia) >= 1;

  // --- Guardar al Sheet ---
  async function handleGuardar() {
    setError('');
    const itemsValidos = items.filter(it => it.descripcion || it.precioTotal > 0);
    if (itemsValidos.length === 0) { setError('Agregá al menos un ítem con datos'); return; }
    if (!mesDevengado) { setError('Elegí el mes de devengamiento'); return; }

    const dia = diaDesdeFecha(fechaFactura || todayDDMM());
    const fechaPago = isoToDDMM(fechaPagoISO);

    // Arma las 12 columnas (A a L) por cada ítem, en el orden EXACTO de la planilla.
    const rows = itemsValidos.map(it => ([
      dia,                                  // A  Dia
      mesDevengado,                         // B  Mes
      concepto,                             // C  Concepto
      it.descripcion,                       // D  Insumo requerido
      Number(it.cantidad) || 0,             // E  Cantidad
      it.unidad || '',                      // F  Unidad
      Number(it.precioUnitario) || 0,       // G  Precio unitario
      Number(it.precioTotal) || 0,          // H  Precio Factura
      proveedor,                            // I  Proveedor
      formaDePago,                          // J  Forma de pago
      fechaFactura,                         // K  Factura (fecha de la factura)
      fechaPago,                            // L  Comprobante de pago (fecha de pago)
    ]));

    setSaving(true);
    try {
      const res = await fetch('/api/append-egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status} al guardar`);
      onGuardado(data.inserted ?? rows.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar en el Sheet');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">
            {step === 'upload' ? 'Nueva factura' : 'Revisar y confirmar'}
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
                    <p className="text-sm text-gray-600 font-medium">Leyendo la factura…</p>
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
              {/* Datos del lote */}
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mes de devengamiento</label>
                  <div className="relative">
                    <select
                      value={mesDevengado}
                      onChange={e => setMesDevengado(Number(e.target.value))}
                      className="w-full text-sm px-3 py-2 pr-8 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      {MESES.map(m => <option key={m.num} value={m.num}>{m.nombre}</option>)}
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
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de la factura</label>
                  <input
                    value={fechaFactura}
                    onChange={e => setFechaFactura(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="DD/MM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de pago</label>
                  <input
                    type="date"
                    value={fechaPagoISO}
                    onChange={e => setFechaPagoISO(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
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
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">Insumo</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-16">Cant.</th>
                        <th className="px-2 py-2 text-left font-semibold text-gray-500 w-16">Unidad</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-24">P. Unit.</th>
                        <th className="px-2 py-2 text-right font-semibold text-gray-500 w-24">P. Factura</th>
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
                              placeholder="Nombre del producto"
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
                        <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Suma de ítems:</td>
                        <td className="px-2 py-2 text-right text-sm font-bold text-gray-900">{formatARS(totalItems)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Aviso de descuadre / IIBB */}
              {hayDescuadre && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-amber-800 font-medium">
                      La suma de ítems no coincide con el total de la factura ({formatARS(totalLeido || 0)}).
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Diferencia: {formatARS(diferencia)}. Puede ser IIBB, IVA cobrado aparte o una oferta.
                    </p>
                    {diferencia > 0 && (
                      <button
                        onClick={() => agregarIIBB(diferencia)}
                        className="mt-2 text-xs font-semibold text-amber-800 underline hover:text-amber-900"
                      >
                        Agregar renglón &quot;IIBB&quot; con la diferencia
                      </button>
                    )}
                  </div>
                </div>
              )}
              {totalLeido != null && !hayDescuadre && (
                <div className="px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <p className="text-xs text-green-700">La suma coincide con el total de la factura.</p>
                </div>
              )}
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
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Guardando…' : 'Confirmar y guardar en el Sheet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
