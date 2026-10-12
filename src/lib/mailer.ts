import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../config';
import { HttpError } from './errors';

// Real email sending, from the backend.
//
// This used to be handled with a mailto: in the administrator's
// browser -- the email went out from whatever account that person had
// open on their computer, not necessarily the institutional one. Here
// the backend sends the email itself, with the SMTP credentials set in
// .env, so it always goes out from the same account no matter who is
// in the panel.
//
// The configuration is optional on purpose: if there is no
// institutional SMTP account yet, the rest of the system keeps working
// as usual (the admin can view and mark messages), and it only fails,
// with a clear message, if someone tries to use "Reply by email".

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
    // 465 uses TLS from the start; 587/25 use STARTTLS.
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
  // So the recipient's replies reach the right inbox when SMTP_FROM is a
  // different account from the one that actually handles the messages
  // (for example, a generic sending account of the University).
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
    // The original error is not leaked to the user (it may carry details
    // of the SMTP account); it stays in the server log for review.
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
