export type ConceptoEgreso =
  | 'Proveedores'
  | 'Fijos'
  | 'RRHH'
  | 'Limpieza'
  | 'Mantenimiento'
  | 'Caja'
  | 'Otro';

export type FormaDePago =
  | 'Transferencia'
  | 'Tarjeta débito'
  | 'Cheque'
  | 'Efectivo';

export interface Egreso {
  id: string;
  fecha: string; // DD/MM/AAAA
  dia: number;
  mes: number;
  anio: number;
  concepto: ConceptoEgreso;
  insumoRequerido: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  precioFactura: number;
  proveedor: string;
  formaDePago: FormaDePago;
  numeroFactura: string;
  comprobante: string;
  estado: 'pagado' | 'pendiente';
  fechaPago: string | null;
}

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

const LS_KEY = 'petricor_egresos';

export function getEgresos(): Egreso[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEgresos(egresos: Egreso[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(egresos));
}

export function addEgresos(nuevos: Egreso[]): void {
  saveEgresos([...getEgresos(), ...nuevos]);
}

export function updateEgreso(id: string, updates: Partial<Egreso>): void {
  saveEgresos(getEgresos().map((e) => (e.id === id ? { ...e, ...updates } : e)));
}

export function deleteEgreso(id: string): void {
  saveEgresos(getEgresos().filter((e) => e.id !== id));
}

export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const CONCEPTOS: ConceptoEgreso[] = [
  'Proveedores',
  'Fijos',
  'RRHH',
  'Limpieza',
  'Mantenimiento',
  'Caja',
  'Otro',
];

export const FORMAS_PAGO: FormaDePago[] = [
  'Transferencia',
  'Tarjeta débito',
  'Cheque',
  'Efectivo',
];

export function getMesActual(): { mes: number; anio: number } {
  const now = new Date();
  return { mes: now.getMonth() + 1, anio: now.getFullYear() };
}

export function getKPIs(egresos: Egreso[]) {
  const { mes, anio } = getMesActual();
  const delMes = egresos.filter((e) => e.mes === mes && e.anio === anio);
  const totalMes = delMes.reduce((s, e) => s + (e.precioFactura || 0), 0);
  const pendientePago = delMes
    .filter((e) => e.estado === 'pendiente')
    .reduce((s, e) => s + (e.precioFactura || 0), 0);
  const porConcepto: Record<string, number> = {};
  for (const eg of delMes) {
    porConcepto[eg.concepto] = (porConcepto[eg.concepto] || 0) + (eg.precioFactura || 0);
  }
  return { totalMes, pendientePago, porConcepto, count: delMes.length };
}
