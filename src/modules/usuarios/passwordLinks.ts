import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { enviarCorreo, type CorreoSaliente } from '../../lib/mailer';

// Password links.
// The previous flow generated a temporary password and showed it on
// screen. Now the person receives a link by email and chooses their own.
//
// The link carries a signed token and nothing is stored in the database.
// It is signed with the server secret PLUS the account's current password
// hash, which gives two properties for free:
//  - it works only once: as soon as the password changes, the hash
//    changes and every link issued before stops verifying;
//  - a session token cannot be used as a link, nor the other way around,
//    because they are signed with different keys.

export type LinkReason = 'forgot' | 'adminReset' | 'invitation';

// The fields mirror the columns of the users table.
export interface UserWithKey {
  id: number;
  nombre: string | null;
  email: string | null;
  password: string | null;
}

interface LinkTemplate {
  validity: string;
  validityText: string;
  subject: string;
  introduction: string;
  footer: string;
}

const PURPOSE = 'restablecer-contrasena';
const ALGORITHM = 'HS256';

const SITE_NAME = 'Rutas Turísticas Pérez Zeledón';
const IGNORE_IF_NOT_YOU_NOTICE =
  'Si no fuiste vos, ignorá este mensaje: tu contraseña actual no cambia.';

// The texts are what the person reads, so they stay in Spanish.
const TEMPLATES: Record<LinkReason, LinkTemplate> = {
  forgot: {
    validity: '1h',
    validityText: '1 hora',
    subject: 'Restablecer tu contraseña - Rutas Turísticas',
    introduction: `Recibimos una solicitud para restablecer la contraseña de tu cuenta del panel de ${SITE_NAME}.`,
    footer: IGNORE_IF_NOT_YOU_NOTICE,
  },
  adminReset: {
    validity: '24h',
    validityText: '24 horas',
    subject: 'Restablecer tu contraseña - Rutas Turísticas',
    introduction: `Un administrador pidió restablecer la contraseña de tu cuenta del panel de ${SITE_NAME}.`,
    footer: IGNORE_IF_NOT_YOU_NOTICE,
  },
  invitation: {
    validity: '72h',
    validityText: '72 horas',
    subject: 'Te dieron acceso al panel de Rutas Turísticas',
    introduction: `Te crearon una cuenta en el panel de administración de ${SITE_NAME}.`,
    footer:
      'Si el enlace vence, entrá al panel y pulsá «¿Olvidaste tu contraseña?» para pedir uno nuevo.',
  },
};

function signingKey(user: Pick<UserWithKey, 'password'>): string {
  return `${config.jwt.secreto}:${user.password ?? ''}`;
}

function issueToken(user: UserWithKey, reason: LinkReason): string {
  return jwt.sign({ prp: PURPOSE }, signingKey(user), {
    algorithm: ALGORITHM,
    subject: String(user.id),
    expiresIn: TEMPLATES[reason].validity,
  } as jwt.SignOptions);
}

// Reads whose account the token claims to be for, WITHOUT trusting it:
// the signature is only checked afterwards, with that account's key.
export function linkUserId(token: string): number | null {
  const payload = jwt.decode(token);
  if (typeof payload !== 'object' || payload === null) return null;
  if (payload.prp !== PURPOSE || typeof payload.sub !== 'string') return null;

  const id = Number(payload.sub);
  return Number.isInteger(id) ? id : null;
}

export function isLinkValid(token: string, user: Pick<UserWithKey, 'password'>): boolean {
  try {
    jwt.verify(token, signingKey(user), { algorithms: [ALGORITHM] });
    return true;
  } catch {
    return false;
  }
}

function linkUrl(token: string): string {
  const site = config.siteUrl.replace(/\/+$/, '');
  return `${site}/admin/reset-password?token=${encodeURIComponent(token)}`;
}

export function buildLinkEmail(user: UserWithKey, reason: LinkReason): CorreoSaliente {
  if (!user.email) throw new Error('La cuenta no tiene correo');

  const template = TEMPLATES[reason];
  const text = [
    `Hola ${user.nombre || ''}`.trim() + ',',
    '',
    template.introduction,
    '',
    'Abrí este enlace para elegir una contraseña nueva:',
    linkUrl(issueToken(user, reason)),
    '',
    `El enlace vence en ${template.validityText} y solo se puede usar una vez.`,
    template.footer,
  ].join('\n');

  return { para: user.email, asunto: template.subject, texto: text };
}

export async function sendPasswordLink(user: UserWithKey, reason: LinkReason): Promise<void> {
  await enviarCorreo(buildLinkEmail(user, reason));
}
