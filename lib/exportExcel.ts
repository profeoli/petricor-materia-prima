import { Egreso } from './egresos';

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
