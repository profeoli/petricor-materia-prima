import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return NextResponse.json({ error: 'image y mimeType son requeridos' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 500 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              mimeType === 'application/pdf'
                ? {
                    type: 'document',
                    source: { type: 'base64', media_type: mimeType, data: image },
                  }
                : {
                    type: 'image',
                    source: { type: 'base64', media_type: mimeType, data: image },
                  },
              {
                type: 'text',
                text: 'Sos un asistente de extracción de datos de facturas para un restaurante argentino.\nAnalizá la imagen y devolvé UNICAMENTE un JSON con esta estructura, sin markdown, sin texto extra:\n{\n  "proveedor": "string",\n  "numeroFactura": "string",\n  "fecha": "DD/MM/AAAA",\n  "items": [\n    {\n      "descripcion": "string",\n      "cantidad": 0,\n      "unidad": "string",\n      "precioUnitario": 0,\n      "precioTotal": 0\n    }\n  ],\n  "totalFactura": 0\n}\nSi no podés leer algún campo, poné null.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json({ error: 'No se pudo parsear la respuesta como JSON', raw: text }, { status: 500 });
      }
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
