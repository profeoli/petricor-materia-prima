'use client';
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Egreso, getEgresos, updateEgreso } from '@/lib/egresos';
import { formatARS } from '@/lib/utils';

function parseFecha(fecha: string): Date {
  const [dd, mm, aaaa] = fecha.split('/');
  return new Date(Number(aaaa), Number(mm) - 1, Number(dd));
}

function diasHastaVencimiento(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = parseFecha(fecha);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export default function PagosPendientesPage() {
  const [pendientes, setPendientes] = useState<Egreso[]>([]);
  const [pagadas, setPagadas] = useState<Egreso[]>([]);
  const [mostrarPagadas, setMostrarPagadas] = useState(false);

  const load = useCallback(() => {
    const todos = getEgresos();
    setPendientes(
      todos
        .filter((e) => e.estado === 'pendiente')
        .sort((a, b) => parseFecha(a.fecha).getTime() - parseFecha(b.fecha).getTime())
    );
    setPagadas(
      todos
        .filter((e) => e.estado === 'pagado')
        .sort((a, b) => {
          const fechaA = a.fechaPago ? parseFecha(a.fechaPago) : parseFecha(a.fecha);
          const fechaB = b.fechaPago ? parseFecha(b.fechaPago) : parseFecha(b.fecha);
          return fechaB.getTime() - fechaA.getTime();
        })
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleMarcarPagado(id: string) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    updateEgreso(id, { estado: 'pagado', fechaPago: `${dd}/${mm}/${today.getFullYear()}` });
    load();
  }

  const total = pendientes.reduce((s, e) => s + (e.precioFactura || 0), 0);

  function getBadge(fecha: string) {
    const dias = diasHastaVencimiento(fecha);
    if (dias < 0)
      return { label: `Vencida hace ${Math.abs(dias)}d`, clase: 'bg-red-100 text-red-600' };
    if (dias === 0)
      return { label: 'Vence hoy', clase: 'bg-red-100 text-red-600' };
    if (dias <= 7)
      return { label: `Vence en ${dias}d`, clase: 'bg-amber-100 text-amber-600' };
    return { label: `Vence en ${dias}d`, clase: 'bg-gray-100 text-gray-500' };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pagos pendientes</h1>
            <p className="text-xs text-gray-50
