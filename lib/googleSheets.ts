// ---------------------------------------------------------------------------
// googleSheets.ts
// Conexión al Google Sheet usando la cuenta de servicio ("robot").
// Autentica con la llave (GOOGLE_SERVICE_ACCOUNT) y escribe filas en la pestaña.
//
// IMPORTANTE: este archivo corre SOLO en el servidor (route handlers).
// Nunca se importa desde componentes con 'use client'.
// ---------------------------------------------------------------------------

import crypto from 'crypto';

// --- Configuración fija del destino -----------------------------------------
// ID del archivo de Egresos (el de la URL del Sheet).
export const SPREADSHEET_ID = '1GdD338RH3X3QOj5L9F67D8Ny72I4Qo2zdKeD0nX2ep0';

// Nombre EXACTO de la pestaña donde se escribe. Si se renombra en el Sheet,
// hay que cambiarlo también acá, o la escritura falla.
export const SHEET_TAB = 'Carga Egresos';

// --- Tipos ------------------------------------------------------------------
interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

// Una fila lista para el Sheet: 12 columnas en el orden de la planilla.
export type SheetRow = [
  string | number, // A  Dia
  string | number, // B  Mes
  string,          // C  Concepto
  string,          // D  Insumo requerido
  string | number, // E  Cantidad
  string,          // F  Unidad
  string | number, // G  Precio unitario
  string | number, // H  Precio Factura
  string,          // I  Proveedor
  string,          // J  Forma de pago
  string,          // K  Factura
  string,          // L  Comprobante de pago
];

// --- Utilidades base64url ---------------------------------------------------
function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// --- Leer la llave del robot desde la variable de entorno -------------------
function getServiceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT no está configurada en el entorno');
  }
  let parsed: ServiceAccount;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT no es un JSON válido');
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('La llave no tiene client_email o private_key');
  }
  // En Vercel, los saltos de línea del private_key a veces quedan como "\\n".
  // Los normalizamos a saltos reales para que la firma funcione.
  parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}

// --- Obtener un access token (OAuth2 con JWT firmado) -----------------------
async function getAccessToken(): Promise<string> {
  const sa = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';

  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };

  const unsigned =
    base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claim));

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = base64url(signer.sign(sa.private_key));
  const jwt = unsigned + '.' + signature;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`No se pudo autenticar con Google: ${txt}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Google no devolvió access_token');
  }
  return data.access_token as string;
}

// --- Escribir filas al final de la pestaña ----------------------------------
// Usa el método values.append, que agrega después de la última fila con datos.
export async function appendRows(rows: SheetRow[]): Promise<number> {
  if (!rows.length) return 0;

  const token = await getAccessToken();
  // El rango usa el nombre de la pestaña. Como tiene un espacio, va entre comillas simples.
  const range = `'${SHEET_TAB}'!A:L`;
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}` +
    `/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error al escribir en el Sheet: ${txt}`);
  }

  const data = await res.json();
  // updates.updatedRows = cantidad de filas efectivamente agregadas
  return data?.updates?.updatedRows ?? rows.length;
}
