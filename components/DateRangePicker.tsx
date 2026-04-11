'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  availableDates: string[];
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({
  availableDates,
  dateFrom,
  dateTo,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200')}>
      <span className="text-xs font-medium text-gray-600">Filtrar por fecha:</span>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Desde</label>
        <select
          value={dateFrom}
          onChange={(e) => onChange(e.target.value, dateTo)}
          className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Hasta</label>
        <select
          value={dateTo}
          onChange={(e) => onChange(dateFrom, e.target.value)}
          className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
