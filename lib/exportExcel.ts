import { Egreso } from './egresos';
import type { ReconciliationRow, ReconciliationSummary } from './reconcile';

export function exportEgresos(egresos: Egreso[]) {
  const headers = [
    'Fecha', 'Concepto', 'Insumo requerido', 'Cantidad', 'Unidad',
    'Precio unitario', 'Precio factura', 'Proveedor', 'Forma de pago',
    'Nú Factura', 'Estado', 'Encargado'
  ];

  const rows = egresos.map((e) => [
    e.fecha,
    e.concepto,
    e.insumoRequerido,
    e.cantidad,
    e.unidad,
    e.precioUnitario,
    e.precioFactura,
    e.proveedor,
    e.formaDePago,
    e.numeroFactura,
    e.estado,
    e.comprobante,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    )
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  a.download = `egresos_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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
