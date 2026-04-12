import type { NavePointRow } from './parseNavePoint';
import type { MaxirestRow } from './parseMaxirest';

export interface ReconciliationRow {
  date: string;
  description: string;
  type: string;
  navePoint?: number;
  maxirest?: number;
  difference?: number;
  amount?: number;
  status: 'ok' | 'warning' | 'error';
}

export interface ReconciliationSummary {
  total: number;
  matched: number;
  unmatched: number;
  totalNavePoint: number;
  totalMaxirest: number;
  totalDifference: number;
}

export interface ReconciliationResult {
  rows: ReconciliationRow[];
  summary: ReconciliationSummary;
}

export function reconcile(
  _navePoint: NavePointRow[],
  _maxirest: MaxirestRow[]
): ReconciliationResult {
  throw new Error('reconcile: implementación pendiente');
}
