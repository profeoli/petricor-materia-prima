'use client';
import React from 'react';
import Link from 'next/link';
import { BarChart3, Receipt, Package, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Petricor</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión Administrativa</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Módulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/conciliacion" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Conciliación</h3>
              <p className="text-sm text-gray-500">Nave Point vs Maxirest — verificá que los pagos coincidan.</p>
            </Link>

            <Link href="/egresos" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <Receipt className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Egresos</h3>
              <p className="text-sm text-gray-500">Subí facturas y se cargan solas en la planilla.</p>
            </Link>

            <Link href="/asistencia" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Asistencia</h3>
              <p className="text-sm text-gray-500">Fichajes del personal, horas trabajadas y horas extra.</p>
            </Link>

            <Link href="/stock" className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Stock</h3>
              <p className="text-sm text-gray-500">Relevá el inventario y generá pedidos a proveedores.</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
