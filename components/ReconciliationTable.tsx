'use client';
import React from 'react';

interface ReconciliationRow {
  date: string;
  description: string;
  navePoint?: number;
  maxirest?: number;
  difference?: number;
  status: 'ok' | 'warning' | 'error';
}

interface ReconciliationTableProps {
  rows: ReconciliationRow[];
}

export function ReconciliationTable({ rows }: ReconciliationTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No hay datos para mostrar.
      </div>
    );
  }

  const statusColor = (status: string) => {
    if (status === 'ok') return 'bg-green-50 text-green-700';
    if (status === 'warning') return 'bg-yellow-50 text-yellow-700';
    return 'bg-red-50 text-red-700';
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-600">Fecha</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-600">Descripcion</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600">NavePoint</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600">Maxirest</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-600">Diferencia</th>
            <th className="px-3 py-2 text-center font-semibold text-gray-600">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 text-gray-700">{row.date}</td>
              <td className="px-3 py-2 text-gray-700">{row.description}</td>
              <td className="px-3 py-2 text-right text-gray-700">
                {row.navePoint != null ? row.navePoint.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {row.maxirest != null ? row.maxirest.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {row.difference != null ? row.difference.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'}
              </td>
              <td className="px-3 py-2 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(row.status)}`}>
                  {row.status === 'ok' ? 'OK' : row.status === 'warning' ? 'Revisar' : 'Error'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
