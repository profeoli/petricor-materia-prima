'use client';
import React from 'react';

interface ReconciliationSummary {
  total: number;
  matched: number;
  unmatched: number;
  totalNavePoint: number;
  totalMaxirest: number;
  totalDifference: number;
}

interface SummaryCardsProps {
  summary: ReconciliationSummary;
}

function Card({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`flex flex-col gap-1 px-4 py-3 rounded-xl border ${color}`}>
      <span className="text-xs font-medium opacity-70">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      {sub && <span className="text-xs opacity-60">{sub}</span>}
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const matchPct = summary.total > 0
    ? Math.round((summary.matched / summary.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        label="Transacciones"
        value={String(summary.total)}
        sub={`${summary.matched} coinciden · ${summary.unmatched} no coinciden`}
        color="bg-indigo-50 border-indigo-200 text-indigo-800"
      />
      <Card
        label="Coincidencia"
        value={`${matchPct}%`}
        sub={summary.unmatched === 0 ? 'Sin diferencias' : `${summary.unmatched} por revisar`}
        color={matchPct === 100
          ? 'bg-green-50 border-green-200 text-green-800'
          : matchPct >= 80
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'}
      />
      <Card
        label="Total NavePoint"
        value={fmt(summary.totalNavePoint)}
        color="bg-gray-50 border-gray-200 text-gray-800"
      />
      <Card
        label="Diferencia neta"
        value={fmt(Math.abs(summary.totalDifference))}
        sub={summary.totalDifference === 0 ? 'Cuadra perfecto' : summary.totalDifference > 0 ? 'NavePoint mayor' : 'Maxirest mayor'}
        color={summary.totalDifference === 0
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-orange-50 border-orange-200 text-orange-800'}
      />
    </div>
  );
}
