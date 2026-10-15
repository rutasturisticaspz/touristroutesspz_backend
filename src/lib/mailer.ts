import { google, type gmail_v1 } from 'googleapis';
import { config } from '../config';
import { HttpError } from './errors';

const TIEMPO_MAXIMO_MS = 10_000;
const BYTES_POR_PALABRA_CODIFICADA = 45;
const COLUMNAS_BASE64 = 76;
const DIRECCION_VALIDA = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;

export interface CorreoSaliente {
  para: string;
  asunto: string;
  texto: string;
  responderA?: string;
}

let cliente: gmail_v1.Gmail | null = null;

function variablesFaltantes(): string[] {
  const { clientId, clientSecret, refreshToken } = config.correo;
  const requeridas: Array<[string, string | undefined]> = [
    ['GMAIL_CLIENT_ID', clientId],
    ['GMAIL_CLIENT_SECRET', clientSecret],
    ['GMAIL_REFRESH_TOKEN', refreshToken],
  ];
  return requeridas.filter(([, valor]) => !valor).map(([nombre]) => nombre);
}

function obtenerCliente(): gmail_v1.Gmail {
  const faltantes = variablesFaltantes();
  if (faltantes.length > 0) {
    throw new HttpError(
      503,
      `El envio de correo no esta configurado (faltan ${faltantes.join(', ')}).`,
    );
  }

  if (cliente === null) {
    const auth = new google.auth.OAuth2({
      clientId: config.correo.clientId,
      clientSecret: config.correo.clientSecret,
      transporterOptions: { timeout: TIEMPO_MAXIMO_MS },
    });
    auth.setCredentials({ refresh_token: config.correo.refreshToken });
    cliente = google.gmail({ version: 'v1', auth });
  }
  return cliente;
}

function sinSaltosDeLinea(valor: string): string {
  return valor.replace(/[\r\n]+/g, ' ').trim();
}

function validarDireccion(valor: string): string {
  const limpia = valor.trim();
  if (!DIRECCION_VALIDA.test(limpia)) {
    throw new HttpError(400, 'La direccion de correo no es valida.');
  }
  return limpia;
}

function trocearPorBytes(texto: string, maximo: number): string[] {
  const trozos: string[] = [];
  let actual = '';
  for (const caracter of texto) {
    if (actual !== '' && Buffer.byteLength(actual + caracter, 'utf8') > maximo) {
      trozos.push(actual);
      actual = '';
    }
    actual += caracter;
  }
  if (actual !== '') trozos.push(actual);
  return trozos;
}

function codificarAsunto(asunto: string): string {
  const limpio = sinSaltosDeLinea(asunto);
  if (/^[\x20-\x7e]*$/.test(limpio)) return limpio;
  return trocearPorBytes(limpio, BYTES_POR_PALABRA_CODIFICADA)
    .map((trozo) => `=?UTF-8?B?${Buffer.from(trozo, 'utf8').toString('base64')}?=`)
    .join('\r\n ');
}

function codificarCuerpo(texto: string): string {
  const base64 = Buffer.from(texto, 'utf8').toString('base64');
  return base64.match(new RegExp(`.{1,${COLUMNAS_BASE64}}`, 'g'))?.join('\r\n') ?? '';
}

function armarMensaje(datos: CorreoSaliente): string {
  const { remitente } = config.correo;
  const cabeceras = [
    remitente ? `From: ${sinSaltosDeLinea(remitente)}` : null,
    `To: ${validarDireccion(datos.para)}`,
    datos.responderA ? `Reply-To: ${validarDireccion(datos.responderA)}` : null,
    `Subject: ${codificarAsunto(datos.asunto)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ].filter((linea): linea is string => linea !== null);

  return `${cabeceras.join('\r\n')}\r\n\r\n${codificarCuerpo(datos.texto)}`;
}

function describirError(error: unknown): string {
  const detalle = error as {
    message?: string;
    code?: string | number;
    response?: {
      status?: number;
      data?: { error?: string | { message?: string }; error_description?: string };
    };
  };
  const datos = detalle.response?.data;
  const motivo = typeof datos?.error === 'string' ? datos.error : datos?.error?.message;
  return [
    detalle.response?.status ?? detalle.code,
    motivo,
    datos?.error_description,
    detalle.message,
  ]
    .filter(Boolean)
    .join(' | ');
}

function conLimite<T>(promesa: Promise<T>): Promise<T> {
  let temporizador: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(
      () => rechazar(new Error('Tiempo de espera agotado al enviar el correo')),
      TIEMPO_MAXIMO_MS,
    );
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

export async function enviarCorreo(datos: CorreoSaliente): Promise<void> {
  const gmail = obtenerCliente();
  const raw = Buffer.from(armarMensaje(datos), 'utf8').toString('base64url');
  try {
    await conLimite(
      gmail.users.messages.send(
        { userId: 'me', requestBody: { raw } },
        { timeout: TIEMPO_MAXIMO_MS, retry: false },
      ),
    );
  } catch (error) {
    console.error('Fallo el envio de correo:', describirError(error));
    throw new HttpError(502, 'No se pudo enviar el correo. Intente de nuevo mas tarde.');
  }
}

export function correoConfigurado(): boolean {
  return variablesFaltantes().length === 0;
}
