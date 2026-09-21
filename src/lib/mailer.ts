import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';
import { HttpError } from './errors';

// Envío real de correo, desde el backend.
//
// Antes esto se resolvia con un mailto: en el navegador del
// administrador -- el correo salia de la cuenta que esa persona
// tuviera abierta en su computadora, no necesariamente la
// institucional. Aqui el backend manda el correo el mismo, con las
// credenciales SMTP que se configuren en el .env, asi que siempre
// sale de la misma cuenta sin importar quien este en el panel.
//
// La configuracion es opcional a proposito: si todavia no hay una
// cuenta SMTP institucional, el resto del sistema sigue funcionando
// igual (el admin puede ver y marcar mensajes), y solo falla, con un
// mensaje claro, si alguien intenta usar "Responder por correo".

let transportador: Transporter | null = null;
let avisoConfiguracion: string | null = null;

function construirTransportador(): Transporter | null {
  const { host, puerto, usuario, password } = config.correo;

  if (!host || !usuario || !password) {
    avisoConfiguracion =
      'El envio de correo no esta configurado (faltan SMTP_HOST, SMTP_USER o ' +
      'SMTP_PASSWORD en backend/.env). "Responder por correo" no va a funcionar ' +
      'hasta que se complete esa configuracion.';
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: puerto,
    // 465 usa TLS desde el inicio; 587/25 usan STARTTLS.
    secure: puerto === 465,
    auth: { user: usuario, pass: password },
  });
}

function obtenerTransportador(): Transporter {
  if (transportador === null) {
    transportador = construirTransportador();
  }
  if (transportador === null) {
    throw new HttpError(503, avisoConfiguracion ?? 'El envio de correo no esta configurado');
  }
  return transportador;
}

export interface CorreoSaliente {
  para: string;
  asunto: string;
  texto: string;
  // Para que las respuestas del destinatario lleguen a la bandeja
  // correcta cuando SMTP_FROM es una cuenta distinta a la que
  // realmente atiende los mensajes (por ejemplo, una cuenta de envio
  // generica de la Universidad).
  responderA?: string;
}

export async function enviarCorreo(datos: CorreoSaliente): Promise<void> {
  const transportador = obtenerTransportador();
  try {
    await transportador.sendMail({
      from: config.correo.remitente,
      to: datos.para,
      subject: datos.asunto,
      text: datos.texto,
      replyTo: datos.responderA,
    });
  } catch (error) {
    // No se filtra el error original al usuario (puede traer detalles
    // de la cuenta SMTP); queda en el log del servidor para revisar.
    console.error('Fallo el envio de correo:', error);
    throw new HttpError(502, 'No se pudo enviar el correo. Intente de nuevo mas tarde.');
  }
}

export function correoConfigurado(): boolean {
  return construirTransportadorSiHaceFalta() !== null;
}

function construirTransportadorSiHaceFalta(): Transporter | null {
  if (transportador === null) transportador = construirTransportador();
  return transportador;
}
