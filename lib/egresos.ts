// ---------------------------------------------------------------------------
// egresos.ts
// Tipos y helpers del módulo de egresos.
// NOTA: la persistencia ahora es el Google Sheet (vía /api/append-egresos).
// Se conservan tipos y utilidades usados por el modal y la tabla en pantalla.
// ---------------------------------------------------------------------------

// Conceptos reales de facturas de proveedor de Petricor.
export type ConceptoEgreso =
  | 'Verdulería'
  | 'Almacén'
  | 'Carne'
  | 'Café'
  | 'Descartable'
  | 'Limpieza';

export type FormaDePago =
  | 'Transferencia'
  | 'Tarjeta débito'
  | 'Cheque'
  | 'Efectivo';

export interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  precioTotal: number;
}

export interface InvoiceExtracted {
  proveedor: string | null;
  numeroFactura: string | null;
  fecha: string | null;
  items: InvoiceItem[];
  totalFactura: number | null;
}

export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const CONCEPTOS: ConceptoEgreso[] = [
  'Verdulería',
  'Almacén',
  'Carne',
  'Café',
  'Descartable',
  'Limpieza',
];

export const FORMAS_PAGO: FormaDePago[] = [
  'Transferencia',
  'Tarjeta débito',
  'Cheque',
  'Efectivo',
];

// Meses en español para el selector de devengamiento.
export const MESES = [
  { num: 1, nombre: 'Enero' },
  { num: 2, nombre: 'Febrero' },
  { num: 3, nombre: 'Marzo' },
  { num: 4, nombre: 'Abril' },
  { num: 5, nombre: 'Mayo' },
  { num: 6, nombre: 'Junio' },
  { num: 7, nombre: 'Julio' },
  { num: 8, nombre: 'Agosto' },
  { num: 9, nombre: 'Septiembre' },
  { num: 10, nombre: 'Octubre' },
  { num: 11, nombre: 'Noviembre' },
  { num: 12, nombre: 'Diciembre' },
];

export function getMesActual(): { mes: number; anio: number } {
  const now = new Date();
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}
