/**
 * app/api/extract-invoice/route.ts
 * API Route de Next.js que recibe una imagen/PDF de factura en base64,
 * la envía a la API de Claude y devuelve los datos extraídos como JSON.
 *
 * El ANTHROPIC_API_KEY nunca se expone al cliente — vive solo en el servidor.
 */

import { NextRequest, NextResponse } from 'next/server';

interface ExtractRequest {
  imageBase64: string;
  mediaType: string;
}

const PROMPT_EXTRACCION = `Analizá este documento (factura de proveedor) y extraé los datos en formato JSON.

Devolvé ÚNICAMENTE el objeto JSON, sin texto adicional, sin bloques de código markdown, sin explicaciones.
El JSON debe tener exactamente esta estructura:

{
  "proveedor": "nombre del proveedor o razón social",
  "fechaFactura": "YYYY-MM-DD",
  "numeroFactura": "número o código de la factura (ej: 0001-00012345)",
  "items": [
    {
      "descripcion": "descripción del producto o servicio",
      "cantidad": 1,
      "unidad": "UNI",
      "precioUnitario": 0,
      "precioTotal": 0
    }
  ]
}

Reglas importantes:
- fechaFactura: formato YYYY-MM-DD. Si no está legible, usá la fecha de hoy.
- Montos: números sin formato (sin símbolo $, sin puntos de miles, sin comas de miles). Usá punto como separador decimal si es necesario.
- unidad: elegí la más apropiada de esta lista: KGR, UNI, LT, KG, GR, ML, CC, CAJ, PQT.
- Si un campo no existe o no es legible, usá null o string vacío.
- Incluí en items TODOS los productos/servicios que aparezcan como líneas de la factura.
- No incluyas líneas de subtotal, descuentos ni impuestos como ítems separados.`;

export async function POST(request: NextRequest) {
  // Verificar que el API key esté configurado
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY no está configurada como variable de entorno.' },
      { status: 500 }
    );
  }

  // Parsear el body
  let body: ExtractRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body de la request inválido.' }, { status: 400 });
  }

  const { imageBase64, mediaType } = body;
  if (!imageBase64 || !mediaType) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: imageBase64 y mediaType.' },
      { status: 400 }
    );
  }

  // Construir el bloque de contenido según si es PDF o imagen
  const esPDF = mediaType === 'application/pdf';
  const bloqueArchivo = esPDF
    ? {
        type: 'document' as const,
        source: { type: 'base64' as const, media_type: mediaType, data: imageBase64 },
      }
    : {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: mediaType, data: imageBase64 },
      };

  try {
    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              bloqueArchivo,
              { type: 'text', text: PROMPT_EXTRACCION },
            ],
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      const textoError = await respuesta.text();
      console.error('Error de la API de Anthropic:', textoError);
      return NextResponse.json(
        { error: `Error de la API de Claude (${respuesta.status}). Revisá el API key y el plan.` },
        { status: respuesta.status }
      );
    }

    const datos = await respuesta.json();
    const contenidoTexto: string = datos.content?.[0]?.text ?? '';

    // Extraer el JSON de la respuesta (por si viene con texto extra)
    const matchJSON = contenidoTexto.match(/\{[\s\S]*\}/);
    if (!matchJSON) {
      console.error('No se encontró JSON en la respuesta de Claude:', contenidoTexto);
      return NextResponse.json(
        {
          error:
            'No se pudieron extraer datos de la factura. Intentá con una imagen más nítida o un PDF con texto.',
        },
        { status: 422 }
      );
    }

    const datosExtraidos = JSON.parse(matchJSON[0]);
    return NextResponse.json(datosExtraidos);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error al procesar la factura:', mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
