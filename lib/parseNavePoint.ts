export interface NavePointRow {
  date: string;
  description: string;
  amount: number;
}

export function parseNavePoint(
  _buffer: ArrayBuffer
): { data: NavePointRow[]; meta: { dateRange: string; recordCount: number } } {
  throw new Error('parseNavePoint: implementación pendiente');
}
