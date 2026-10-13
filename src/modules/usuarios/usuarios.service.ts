import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { firmarToken } from '../../middleware/auth';
import { noAutenticado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';

const RONDAS_BCRYPT = 12;

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

  // Creation of a moderator with a generated password.
  // The previous system generated the password and emailed it to the
  // new moderator using a Gmail account whose app password was written
  // in plain text inside the source code, in a repository that circulated
  // among several people.
  // Here no email is sent: the password is returned ONCE to whoever
  // created the account, so they can hand it over by whatever means is
  // appropriate. When the University provides an institutional SMTP
  // server, sending can be connected; in the meantime no foreign
  // credential lives in the repository.
  async crearConContrasenaGenerada(datos: { nombre: string; email: string; rol: Rol }) {
    const password = generarContrasena();
    const usuario = await usuariosService.crear({ ...datos, password });
    return { usuario, passwordTemporal: password };
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

  // Resets the password of another account. Generates a new one and
  // returns it ONCE, like the creation of moderators; no email is sent.
  // The previous password stops working immediately.
  async restablecerContrasena(id: number) {
    await this.obtenerPorId(id);
    const passwordTemporal = generarContrasena();
    const hash = await bcrypt.hash(passwordTemporal, RONDAS_BCRYPT);
    await prisma.usuarios.update({
      where: { id },
      data: { password: hash, updateAt: new Date() },
    });
    return { passwordTemporal };
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

// Readable but random temporary password. It uses randomInt from the
// crypto module, not Math.random, because this is a secret.
// Characters that are easily confused when dictated are left out: l,
// I, 1, O, 0.
const ALFABETO = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarContrasena(largo = 12): string {
  let salida = '';
  for (let i = 0; i < largo; i++) {
    salida += ALFABETO[randomInt(ALFABETO.length)];
  }
  return salida;
}
