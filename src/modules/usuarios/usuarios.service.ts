import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { firmarToken } from '../../middleware/auth';
import { noAutenticado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';
import { createRateLimiter } from '../../lib/rateLimiter';
import { isLinkValid, linkUserId, sendPasswordLink, type LinkReason } from './passwordLinks';

const RONDAS_BCRYPT = 12;

// Public "forgot my password" requests allowed per email in 15 minutes.
const REQUESTS_PER_EMAIL = 3;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const allowRequest = createRateLimiter(REQUESTS_PER_EMAIL, REQUEST_WINDOW_MS);

const INVALID_LINK_MESSAGE =
  'El enlace no es válido o ya venció. Pedí uno nuevo desde «¿Olvidaste tu contraseña?».';

// Fields that can be returned. It never includes `password`.
const SELECCION_PUBLICA = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  state: true,
  createdAt: true,
  updateAt: true,
} as const;

const CAMPOS_ORDENABLES = ['id', 'nombre', 'email', 'createdAt'] as const;

export const usuariosService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'id');
    const where = combinarWhere(
      filtroTexto(query.filtro as string | undefined, ['nombre', 'email']),
    );

    const [datos, total] = await Promise.all([
      prisma.usuarios.findMany({ where, orderBy, skip, take, select: SELECCION_PUBLICA }),
      prisma.usuarios.count({ where }),
    ]);

    return { total, datos };
  },

  async obtenerPorId(id: number) {
    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      select: SELECCION_PUBLICA,
    });
    if (!usuario) throw noEncontrado('Usuario');
    return usuario;
  },

  // Sign-in for the administration panel.
  // It keeps the same validations as the previous version (bcrypt
  // password, allowed role and active state), but the token it returns
  // no longer includes the password hash.
  async iniciarSesion(email: string, password: string, soloPanel = true) {
    if (!email || !password) {
      throw solicitudInvalida('Debe indicar correo y contraseña');
    }

    const usuario = await prisma.usuarios.findFirst({
      where: { email },
    });

    // Same message for a nonexistent user and a wrong password, so as not
    // to reveal which emails are registered.
    const mensajeGenerico = 'Usuario o contraseña incorrectos';

    if (!usuario?.password) throw noAutenticado(mensajeGenerico);

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) throw noAutenticado(mensajeGenerico);

    // The previous system had two endpoints: /login for any user and
    // /loginAdmin for the panel. It is the same check with a different
    // role filter, so here it is a parameter.
    if (soloPanel && usuario.rol !== Rol.ADMIN && usuario.rol !== Rol.MODERADOR) {
      throw noAutenticado('El usuario no tiene acceso al panel de administración');
    }

    if (usuario.state !== EstadoEntidad.ACTIVO) {
      throw noAutenticado('El usuario está inactivo');
    }

    const accessToken = firmarToken({
      id: usuario.id,
      email: usuario.email ?? '',
      rol: usuario.rol as Rol,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  },

  // Renews the token of an already valid session, without asking for
  // the password again. Equivalent to the previous renewToken.
  // It reads the user from the database again on purpose: if they were
  // deactivated or had their role changed while having a session open,
  // the renewal has to reflect that instead of carrying over what the
  // old token said.
  async renovarToken(id: number) {
    const usuario = await prisma.usuarios.findUnique({ where: { id } });
    if (!usuario) throw noEncontrado('Usuario');

    if (usuario.state !== EstadoEntidad.ACTIVO) {
      throw noAutenticado('El usuario está inactivo');
    }

    const accessToken = firmarToken({
      id: usuario.id,
      email: usuario.email ?? '',
      rol: usuario.rol as Rol,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  },

  // Search by exact email.
  async obtenerPorEmail(email: string) {
    const usuario = await prisma.usuarios.findFirst({
      where: { email },
      select: SELECCION_PUBLICA,
    });
    if (!usuario) throw noEncontrado('Usuario');
    return usuario;
  },

  // Creation of an account by an administrator.
  // Nobody types or sees a password here: the account is created with a
  // random one that is thrown away, and the person receives a link by
  // email to choose their own. The previous system emailed a generated
  // password using a Gmail account whose credentials were written in the
  // source code.
  // If the email cannot be sent the account still exists, and the
  // administrator can send the link again with "sendPasswordReset".
  async invite(data: { nombre: string; email: string; rol: Rol }) {
    const user = await usuariosService.crear({
      ...data,
      password: throwawayPassword(),
    });

    const emailSent = await trySendLink(user.id, 'invitation');
    return { usuario: user, emailSent };
  },

  async crear(datos: { nombre: string; email: string; password: string; rol: Rol }) {
    const yaExiste = await prisma.usuarios.findFirst({ where: { email: datos.email } });
    if (yaExiste) throw solicitudInvalida('Ya existe un usuario con ese correo');

    const hash = await bcrypt.hash(datos.password, RONDAS_BCRYPT);

    return prisma.usuarios.create({
      data: {
        nombre: datos.nombre,
        email: datos.email,
        password: hash,
        rol: datos.rol,
        state: EstadoEntidad.ACTIVO,
      },
      select: SELECCION_PUBLICA,
    });
  },

  // Updates the user's data.
  // Unlike the previous version, which passed the whole request body to
  // the ORM, here only explicit fields are accepted.
  // The role and the password cannot be changed this way.
  async actualizar(id: number, datos: { nombre?: string; email?: string }) {
    await this.obtenerPorId(id);

    return prisma.usuarios.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined ? { nombre: datos.nombre } : {}),
        ...(datos.email !== undefined ? { email: datos.email } : {}),
        updateAt: new Date(),
      },
      select: SELECCION_PUBLICA,
    });
  },

  // Role change. Separate operation, restricted to administrators.
  async cambiarRol(id: number, rol: Rol) {
    await this.obtenerPorId(id);
    return prisma.usuarios.update({
      where: { id },
      data: { rol, updateAt: new Date() },
      select: SELECCION_PUBLICA,
    });
  },

  async cambiarContrasena(
    id: number,
    passwordActual: string,
    passwordNueva: string,
    confirmacion: string,
  ) {
    if (passwordNueva !== confirmacion) {
      throw solicitudInvalida('Las contraseñas nuevas no coinciden');
    }
    if (passwordNueva.length < 8) {
      throw solicitudInvalida('La contraseña nueva debe tener al menos 8 caracteres');
    }

    const usuario = await prisma.usuarios.findUnique({ where: { id } });
    if (!usuario?.password) throw noEncontrado('Usuario');

    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) throw solicitudInvalida('La contraseña actual es incorrecta');

    const hash = await bcrypt.hash(passwordNueva, RONDAS_BCRYPT);
    await prisma.usuarios.update({
      where: { id },
      data: { password: hash, updateAt: new Date() },
    });

    return { ok: true };
  },

  // An administrator asks for a password link to be sent to another
  // account. The current password keeps working until the person uses the
  // link and chooses a new one. If the email cannot be sent the error
  // reaches the administrator, because nothing else would tell them.
  async sendPasswordReset(id: number) {
    const user = await prisma.usuarios.findUnique({ where: { id } });
    if (!user) throw noEncontrado('Usuario');
    if (!user.email) throw solicitudInvalida('La cuenta no tiene correo registrado');

    await sendPasswordLink(user, 'adminReset');
    return { ok: true, email: user.email };
  },

  // Public "forgot my password". It answers the same whether or not the
  // email exists, so the form cannot be used to find out who is
  // registered. The email is sent without waiting for it, so the response
  // time does not reveal it either.
  async requestPasswordReset(email: string) {
    const user = await prisma.usuarios.findFirst({ where: { email } });
    if (!user?.email || user.state !== EstadoEntidad.ACTIVO) return;
    if (!allowRequest(user.email.toLowerCase())) return;

    void sendPasswordLink(user, 'forgot').catch((error) => {
      console.error('No se pudo enviar el enlace de contraseña:', error);
    });
  },

  // Tells the screen whether a link can still be used, before asking the
  // person to type anything.
  async validateLink(token: string) {
    const user = await userFromLink(token);
    return { nombre: user.nombre, email: user.email };
  },

  // Sets the new password from a link. The update is conditional on the
  // password not having changed meanwhile, so two requests with the same
  // link cannot both succeed.
  async resetWithLink(token: string, newPassword: string) {
    const user = await userFromLink(token);
    const hash = await bcrypt.hash(newPassword, RONDAS_BCRYPT);

    const { count } = await prisma.usuarios.updateMany({
      where: { id: user.id, password: user.password },
      data: { password: hash, updateAt: new Date() },
    });
    if (count !== 1) throw solicitudInvalida(INVALID_LINK_MESSAGE);

    return { ok: true };
  },

  // Activates or deactivates the account.
  // The previous panel called an endpoint that received the raw state
  // ("Active" / "Inactive") from the browser. Here a boolean comes in
  // and the column value is set by the backend, which is the only one
  // that needs to know how it is written in the database.
  async cambiarEstado(id: number, activo: boolean) {
    await this.obtenerPorId(id);
    return prisma.usuarios.update({
      where: { id },
      data: {
        state: activo ? EstadoEntidad.ACTIVO : EstadoEntidad.INACTIVO,
        updateAt: new Date(),
      },
      select: SELECCION_PUBLICA,
    });
  },

  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.usuarios.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
      select: SELECCION_PUBLICA,
    });
  },

  // Actually deletes the user (it is not a state change).
  // If they have associated ratings or tourist routes, the database
  // rejects the deletion (those relations are onDelete: Restrict) so as
  // not to leave orphan records; in that case the admin is asked to
  // deactivate the account instead of deleting it.
  async eliminar(id: number) {
    await this.obtenerPorId(id);
    try {
      await prisma.usuarios.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw solicitudInvalida(
          'No se puede eliminar: este usuario tiene calificaciones o rutas turísticas asociadas. Desactive la cuenta en su lugar.',
        );
      }
      throw error;
    }
    return { ok: true };
  },
};

// Password nobody will ever know: it only fills the column until the
// person chooses theirs from the link.
function throwawayPassword(): string {
  return randomBytes(32).toString('base64url');
}

async function userFromLink(token: string) {
  const id = linkUserId(token);
  const user = id === null ? null : await prisma.usuarios.findUnique({ where: { id } });

  if (!user || !isLinkValid(token, user)) {
    throw solicitudInvalida(INVALID_LINK_MESSAGE);
  }
  return user;
}

async function trySendLink(id: number, reason: LinkReason): Promise<boolean> {
  try {
    const user = await prisma.usuarios.findUniqueOrThrow({ where: { id } });
    await sendPasswordLink(user, reason);
    return true;
  } catch (error) {
    console.error('No se pudo enviar el enlace de contraseña:', error);
    return false;
  }
}
