export const SB_URL = 'https://puyhlwuxhyywattyydmf.supabase.co';
export const SB_KEY = 'sb_publishable_eLnTvR4daqXX9OCXkKF68A_GVuvyYfW';

const HEADERS = {
  apikey: SB_KEY,
  Authorization: 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export async function sbGet<T = unknown>(table: string, query = ''): Promise<T[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: HEADERS });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function sbPost<T = unknown>(table: string, body: object | object[]): Promise<T[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export async function sbPatch<T = unknown>(table: string, query: string, body: object): Promise<T[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export async function sbDelete(table: string, query: string): Promise<void> {
  await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
}

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  proveedor: string;
  unidad: string;
  stock_minimo: number | null;
  activo: boolean;
  created_at: string;
}

export interface Relevamiento {
  id: number;
  fecha: string;
  producto_id: number;
  cantidad: number;
  created_at: string;
}

export interface Pedido {
  id: number;
  fecha: string;
  proveedor: string | null;
  estado: string;
  created_at: string;
}

export interface PedidoItem {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  cantidad_ajustada: number | null;
}

export interface Proveedor {
  id: number;
  nombre: string;
  numero_whatsapp: string | null;
}

export const CATEGORIAS_ORDEN = [
  'Verduras', 'Frutas', 'Hierbas', 'Hongos', 'Proteínas',
  'Lácteos', 'Almacén', 'Leches', 'Gaseosas', 'Café',
  'Limpieza', 'Descartables', 'Papelería', 'Especias',
];

export function getStockStatus(cantidad: number, stockMinimo: number | null): 'red' | 'amber' | 'green' | 'neutral' {
  if (cantidad === 0) return 'red';
  if (stockMinimo !== null && cantidad < stockMinimo) return 'amber';
  if (stockMinimo !== null) return 'green';
  return 'neutral';
}
