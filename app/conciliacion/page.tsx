'use client';

/**
 * app/conciliacion/page.tsx
 * Módulo de Conciliación de Ventas (Nave Point × Maxirest).
 * Movido desde app/page.tsx — misma lógica, sin header/footer inline
 * porque el layout global los provee.
 */

import React, { useState, useCallback } from 'react';
import { ReceiptText, Download, RefreshCw, ChevronRight } from 'lucide-react';
import { FileDropZone, type FileMeta } from '@/components/FileDropZone';
import { SummaryCards } from '@/components/SummaryCards';
import { ReconciliationTable } from '@/components/ReconciliationTable';
import { ErrorsSection } from '@/components/ErrorsSection';
import { DateRangePicker } from '@/components/DateRangePicker';
import { parseNavePoint, type NavePointRow } from '@/lib/parseNavePoint';
import { parseMaxirest, type MaxirestRow } from '@/lib/parseMaxirest';
import { reconcile, type ReconciliationResult } from '@/lib/reconcile';
import { exportToExcel } from '@/lib/exportExcel';
import { cn } from '@/lib/utils';

export default function ConciliacionPage() {
  const [navePointData, setNavePointData] = useState<NavePointRow[] | null>(null);
  const [navePointMeta, setNavePointMeta] = useState<FileMeta | null>(null);
  const [maxirestData, setMaxirestData] = useState<MaxirestRow[] | null>(null);
  const [maxirestMeta, setMaxirestMeta] = useState<FileMeta | null>(null);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Estado del filtro de fechas — derivado de la intersección de ambos archivos
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const computeAvailableDates = useCallback((np: NavePointRow[], mx: MaxirestRow[]) => {
    const npDates = new Set(np.map((r) => r.date));
    const mxDates = new Set(mx.map((r) => r.date));
    const common = [...npDates].filter((d) => mxDates.has(d)).sort();
    setAvailableDates(common);
    if (common.length > 0) {
      setDateFrom(common[0]);
      setDateTo(common[common.length - 1]);
    }
  }, []);

  const handleNavePointLoaded = useCallback(
    (data: unknown[], meta: FileMeta) => {
      const np = data as NavePointRow[];
      setNavePointData(np);
      setNavePointMeta(meta);
      setResult(null);
      setReconcileError(null);
      setMaxirestData((mx) => {
        if (mx) computeAvailableDates(np, mx);
        return mx;
      });
    },
    [computeAvailableDates]
  );

  const handleMaxirestLoaded = useCallback(
    (data: unknown[], meta: FileMeta) => {
      const mx = data as MaxirestRow[];
      setMaxirestData(mx);
      setMaxirestMeta(meta);
      setResult(null);
      setReconcileError(null);
      setNavePointData((np) => {
        if (np) computeAvailableDates(np, mx);
        return np;
      });
    },
    [computeAvailableDates]
  );

  const parseNavePointWrapper = useCallback((buffer: ArrayBuffer) => {
    const res = parseNavePoint(buffer);
    return { data: res.data as unknown[], meta: res.meta };
  }, []);

  const parseMaxirestWrapper = useCallback((buffer: ArrayBuffer) => {
    const res = parseMaxirest(buffer);
    return { data: res.data as unknown[], meta: res.meta };
  }, []);

  const handleReconcile = useCallback(async () => {
    if (!navePointData || !maxirestData) return;
    setIsReconciling(true);
    setReconcileError(null);
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      const filteredNP =
        dateFrom && dateTo
          ? navePointData.filter((r) => r.date >= dateFrom && r.date <= dateTo)
          : navePointData;
      const filteredMX =
        dateFrom && dateTo
          ? maxirestData.filter((r) => r.date >= dateFrom && r.date <= dateTo)
          : maxirestData;
      const reconcileResult = reconcile(filteredNP, filteredMX);
      setResult(reconcileResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al conciliar.';
      setReconcileError(msg);
    } finally {
      setIsReconciling(false);
    }
  }, [navePointData, maxirestData, dateFrom, dateTo]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const dateLabel = new Date().toISOString().split('T')[0];
    exportToExcel(result.rows, result.summary, dateLabel);
  }, [result]);

  const handleReset = useCallback(() => {
    setNavePointData(null);
    setNavePointMeta(null);
    setMaxirestData(null);
    setMaxirestMeta(null);
    setResult(null);
    setReconcileError(null);
    setAvailableDates([]);
    setDateFrom('');
    setDateTo('');
  }, []);

  const bothLoaded = !!navePointData && !!maxirestData;
  const canReconcile = bothLoaded && !isReconciling;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Encabezado de página */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Conciliación de Ventas</h2>
            <p className="text-sm text-gray-500 mt-0.5">Nave Point × Maxirest</p>
          </div>
          {result && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Nueva conciliación
            </button>
          )}
        </div>

        {/* Sección de carga de archivos */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Cargar archivos
            </h3>
            <p className="text-sm text-gray-500 mt-1 ml-8">
              Cargá el reporte de Nave Point y el informe de Maxirest en formato .xlsx
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <FileDropZone
              label="Nave Point"
              sublabel="Detalle de operaciones"
              onFileLoaded={handleNavePointLoaded}
              parseFile={parseNavePointWrapper}
            />
            <div className="hidden sm:flex items-center justify-center flex-shrink-0 pt-6">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <FileDropZone
              label="Maxirest"
              sublabel="Informe de ventas"
              onFileLoaded={handleMaxirestLoaded}
              parseFile={parseMaxirestWrapper}
            />
          </div>

          {/* Filtro de fechas — solo cuando ambos archivos están cargados */}
          {bothLoaded && availableDates.length > 0 && (
            <div className="mt-4">
              <DateRangePicker
                availableDates={availableDates}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={(from, to) => {
                  setDateFrom(from);
                  setDateTo(to);
                  setResult(null);
                }}
              />
            </div>
          )}

          {/* Botón de conciliación */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={handleReconcile}
              disabled={!canReconcile}
              className={cn(
                'inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm',
                canReconcile
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {isReconciling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Conciliando...
                </>
              ) : (
                <>
                  <ReceiptText className="w-4 h-4" />
                  Conciliar
                </>
              )}
            </button>
            {!bothLoaded && (
              <p className="text-xs text-gray-400">Cargá ambos archivos para habilitar la conciliación</p>
            )}
          </div>

          {reconcileError && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700 font-medium">Error al conciliar</p>
              <p className="text-xs text-red-500 mt-0.5">{reconcileError}</p>
            </div>
          )}
        </section>

        {/* Resultados */}
        {result && (
          <>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Resultados
              </h3>
              {(navePointMeta || maxirestMeta) && (
                <span className="text-xs text-gray-400">
                  {navePointMeta?.dateRange || maxirestMeta?.dateRange}
                </span>
              )}
            </div>

            <section>
              <SummaryCards summary={result.summary} />
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                Descuadres
              </h3>
              <ErrorsSection rows={result.rows} />
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Detalle completo
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{result.rows.length} filas</p>
                </div>
              </div>
              <ReconciliationTable rows={result.rows} />
              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm hover:shadow-md active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
