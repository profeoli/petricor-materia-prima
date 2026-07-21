import { NextRequest, NextResponse } from 'next/server';
import { appendRows, SheetRow } from '@/lib/googleSheets';

// Fuerza runtime Node.js (necesario para el módulo 'crypto' usado en googleSheets).
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows = body?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Se esperaba un arreglo "rows" con al menos una fila' },
        { status: 400 }
      );
    }

    // Validación mínima: cada fila debe tener 12 columnas.
    for (const r of rows) {
      if (!Array.isArray(r) || r.length !== 12) {
        return NextResponse.json(
          { error: 'Cada fila debe tener exactamente 12 columnas (A a L)' },
          { status: 400 }
        );
      }
    }

    const inserted = await appendRows(rows as SheetRow[]);
    return NextResponse.json({ ok: true, inserted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
