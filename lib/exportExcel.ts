import type { ReconciliationRow, ReconciliationSummary } from './reconcile';

function escapeCell(value: unknown): string {
  const str = String(value ?? '');
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(
  rows: ReconciliationRow[],
  summary: ReconciliationSummary,
  dateLabel: string
) {
  const summaryHeaders = ['Total', 'Coinciden', 'No coinciden', 'Total NavePoint', 'Total Maxirest', 'Diferencia neta'];
  const summaryRow = [
    summary.total,
    summary.matched,
    summary.unmatched,
    summary.totalNavePoint,
    summary.totalMaxirest,
    summary.totalDifference,
  ];

  const detailHeaders = ['Fecha', 'Descripción', 'NavePoint', 'Maxirest', 'Diferencia', 'Estado'];
  const detailRows = rows.map((r) => [
    r.date,
    r.description,
    r.navePoint ?? '',
    r.maxirest ?? '',
    r.difference ?? '',
    r.status,
  ]);

  const csv = [
    summaryHeaders.map(escapeCell).join(','),
    summaryRow.map(escapeCell).join(','),
    '',
    detailHeaders.map(escapeCell).join(','),
    ...detailRows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  downloadCsv(csv, `conciliacion_${dateLabel}.csv`);
}
