'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Clock, TrendingUp, AlertCircle, Link2, Check } from 'lucide-react';

const SB_URL = 'https://puyhlwuxhyywattyydmf.supabase.co';
const SB_KEY = 'sb_publishable_eLnTvR4daqXX9OCXkKF68A_GVuvyYfW';
const TABLE = 'Fichajes';
const HORA_EXTRA_DESDE = 9;
const FICHAJE_URL = 'https://petricor-materia-prima.vercel.app/fichaje.html';

const EMPLEADOS = [
  'Galnares Martina',
  'Alexis DAngelo',
  'Chacón Tortoza Moises',
  'Barrionuevo Martín',
  'Adolfo Rodri',
  'Papa Guadalupe',
  'Isas Nicole',
  'Maule Morena',
  'Gabbie Chacon',
  'Jorge Benitez',
];

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface Fichaje {
  id: number;
  name: string;
  fecha: string;
  entrada: number;
  salida: number | null;
  duracion: number | null;
  auto_cierre: boolean;
}

function fmtTime(ts: number) {
  return new Date(ts).toTimeString().slice(0, 8);
}

function fmtHours(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function msToH(ms: number) { return ms / 3600000; }

function countWeekdays(y: number, m: number, hastaElDia?: number) {
  const limite = hastaElDia ?? new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= limite; d++) {
    const day = new Date(y, m - 1, d).getDay();
    if (day !== 0 && day !== 1 && day !== 6) count++;
  }
  return count;
}

export default function AsistenciaPage() {
  const [fichajes, setFichajes] = useState<Fichaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [empFilter, setEmpFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${SB_URL}/rest/v1/${TABLE}?salida=not.is.null&order=entrada.desc&limit=500`;
      if (empFilter) url += `&name=eq.${encodeURIComponent(empFilter)}`;
      if (monthFilter) url += `&fecha=like.${monthFilter}*`;
      const res = await fetch(url, {
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
      });
      const data = await res.json();
      setFichajes(Array.isArray(data) ? data : []);
    } catch { setFichajes([]); }
    setLoading(false);
  }, [empFilter, monthFilter]);

  useEffect(() => { load(); }, [load]);

  function copyLink() {
    navigator.clipboard.writeText(FICHAJE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalHs = fichajes.reduce((s, f) => s + msToH(f.duracion || 0), 0);
  const extraHs = fichajes.reduce((s, f) => {
    const h = msToH(f.duracion || 0);
    return s + Math.max(0, h - HORA_EXTRA_DESDE);
  }, 0);

  const [y, m] = monthFilter.split('-').map(Number);
  const empsFiltrados = empFilter ? [empFilter] : EMPLEADOS;
  const hoy = new Date();
  const diasLaborables = countWeekdays(y, m, hoy.getDate());
  const diasTrabajados = new Set(fichajes.map(f => f.name + '_' + f.fecha)).size;
  const ausencias = Math.max(0, empsFiltrados.length * diasLaborables - diasTrabajados);

  const mesLabel = `${MESES[m - 1]} ${y}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Asistencia</h1>
              <p className="text-xs text-gray-500 mt-0.5">Control de fichajes del personal</p>
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Link empleados'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        <div className="flex gap-3">
          <select
            value={empFilter}
            onChange={e => setEmpFilter(e.target.value)}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Todos los empleados</option>
            {EMPLEADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              return <option key={val} value={val}>{MESES[d.getMonth()]} {d.getFullYear()}</option>;
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Horas trabajadas</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{Math.round(totalHs)}h</p>
            <p className="text-xs text-gray-400 mt-1">{mesLabel}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Horas extra</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {extraHs > 0 ? `${Math.floor(extraHs)}h ${Math.round((extraHs % 1) * 60)}m` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Desde la 9na hora</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-500" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Fichajes</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fichajes.length}</p>
            <p className="text-xs text-gray-400 mt-1">Registros completos</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ausencias</p>
            </div>
            <p className={`text-2xl font-bold ${ausencias > 0 ? 'text-red-500' : 'text-green-600'}`}>{ausencias}</p>
            <p className="text-xs text-gray-400 mt-1">Días hábiles sin fichar</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Detalle de fichajes</h2>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm text-gray-400">Cargando...</div>
          ) : fichajes.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No hay registros para este período.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Empleado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Entrada</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Salida</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Duración</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">Extra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fichajes.map(f => {
                    const hs = msToH(f.duracion || 0);
                    const extra = Math.max(0, hs - HORA_EXTRA_DESDE);
                    const [fy, fm, fd] = f.fecha.split('-');
                    return (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{f.name}</td>
                        <td className="px-4 py-3 text-gray-600">{fd}/{fm}/{fy}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{fmtTime(f.entrada)}</td>
<td className="px-4 py-3 font-mono text-xs text-gray-600">
  {f.salida ? (
    <span className="flex items-center gap-2">
      {fmtTime(f.salida)}
      {f.auto_cierre && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">
          Auto
        </span>
      )}
    </span>
  ) : '—'}
</td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{f.duracion ? fmtHours(f.duracion) : '—'}</td>
                        <td className="px-4 py-3">
                          {extra > 0 ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              +{Math.floor(extra)}h {Math.round((extra % 1) * 60)}m
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
