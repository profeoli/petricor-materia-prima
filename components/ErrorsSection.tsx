'use client';
import React from 'react';

interface ErrorRow {
  date: string;
  description: string;
  type: string;
  amount?: number;
  status: string;
}

interface ErrorsSectionProps {
  rows: ErrorRow[];
}

export function ErrorsSection({ rows }: ErrorsSectionProps) {
  const errorRows = rows ? rows.filter((r) => r.status === 'error' || r.status === 'warning') : [];

  if (errorRows.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <span>✓</span>
        <span>No se encontraron discrepancias.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">
        Discrepancias encontradas ({errorRows.length})
      </h3>
      <div className="space-y-2">
        {errorRows.map((row, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs ${
              row.status === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
            }`}
          >
            <span className="mt-0.5 text-base">
              {row.status === 'error' ? '✗' : '⚠'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{row.description}</div>
              <div className="mt-0.5 text-xs opacity-75">
                {row.date} · {row.type}
                {row.amount != null && (
                  <span className="ml-2 font-semibold">
                    {row.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
