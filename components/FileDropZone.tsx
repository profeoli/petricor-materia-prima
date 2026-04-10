'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileMeta { dateRange: string; recordCount: number; fileName: string; }

interface FileDropZoneProps {
  label: string; sublabel?: string;
  onFileLoaded: (data: unknown[], meta: FileMeta) => void;
  accept?: string;
  parseFile: (buffer: ArrayBuffer) => { data: unknown[]; meta: { dateRange: string; recordCount: number } };
}

export function FileDropZone({ label, sublabel, onFileLoaded, accept = '.xlsx', parseFile }: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedMeta, setLoadedMeta] = useState<FileMeta | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setIsLoading(true); setError(null); setLoadedMeta(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseFile(buffer);
      const meta: FileMeta = { ...result.meta, fileName: file.name };
      setLoadedMeta(meta); onFileLoaded(result.data, meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al leer el archivo.');
    } finally { setIsLoading(false); }
  }, [parseFile, onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) processFile(file);
  }, [processFile]);

  const isSuccess = !!loadedMeta && !error;

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{label}</h3>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200 min-h-[140px] flex flex-col items-center justify-center text-center',
          isDragOver && 'border-blue-400 bg-blue-50 scale-[1.01]',
          !isDragOver && !error && !isSuccess && 'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40',
          error && 'border-red-300 bg-red-50',
          isSuccess && 'border-green-300 bg-green-50',
          isLoading && 'pointer-events-none opacity-70'
        )}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }} className="hidden" />
        {isLoading && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-blue-600">Procesando...</p>
          </div>
        )}
        {!isLoading && !isSuccess && !error && (
          <div className="flex flex-col items-center gap-2">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center transition-colors', isDragOver ? 'bg-blue-100' : 'bg-gray-100')}>
              <Upload className={cn('w-5 h-5', isDragOver ? 'text-blue-500' : 'text-gray-400')} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{isDragOver ? 'Soltar aquí' : 'Arrastrá el archivo o hacé clic'}</p>
              <p className="text-xs text-gray-400 mt-0.5">Solo archivos .xlsx</p>
            </div>
          </div>
        )}
        {!isLoading && isSuccess && loadedMeta && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="w-full">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <p className="text-xs font-medium text-green-700 truncate max-w[200px]">{loadedMeta.fileName}</p>
              </div>
              <p className="text-xs text-gray-600"><span className="font-medium">{loadedMeta.recordCount}</span> registros</p>
              <p className="text-xs text-gray-500">{loadedMeta.dateRange}</p>
            </div>
            <p className="text-xs text-green-600 font-medium">Clic para cambiar</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">Error al leer el archivo</p>
              <p className="text-xs text-red-500 mt-1 max-w-[240px]">{error}</p>
            </div>
            <p className="text-xs text-red-400 font-medium">Clic para intentar de nuevo</p>
          </div>
        )}
      </div>
    </div>
  );
}
