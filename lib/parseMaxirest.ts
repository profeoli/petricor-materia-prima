export interface MaxirestRow {
  date: string;
  description: string;
  amount: number;
}

export function parseMaxirest(
  _buffer: ArrayBuffer
): { data: MaxirestRow[]; meta: { dateRange: string; recordCount: number } } {
  throw new Error('parseMaxirest: implementación pendiente');
}
