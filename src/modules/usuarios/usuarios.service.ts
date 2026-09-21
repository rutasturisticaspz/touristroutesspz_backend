import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { firmarToken } from '../../middleware/auth';
import { noAutenticado, noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad, Rol } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';

const RONDAS_BCRYPT = 12;

// Campos que se pueden devolver. Nunca incluye `password`.
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

  // Inicio de sesión para el panel de administración.
  // Mantiene las mismas validaciones que la versión anterior
  // (contraseña con bcrypt, rol permitido y estado activo), pero el
  // token que devuelve ya no incluye el hash de la contraseña.
  async iniciarSesion(email: string, password: string, soloPanel = true) {
    if (!email || !password) {
      throw solicitudInvalida('Debe indicar correo y contraseña');
    }

    const usuario = await prisma.usuarios.findFirst({
      where: { email },
    });

    // Mismo mensaje para usuario inexistente y contraseña incorrecta,
    // para no revelar cuáles correos están registrados.
    const mensajeGenerico = 'Usuario o contraseña incorrectos';

    if (!usuario?.password) throw noAutenticado(mensajeGenerico);

    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) throw noAutenticado(mensajeGenerico);

    // El sistema anterior tenía dos endpoints: /login para cualquier
    // usuario y /loginAdmin para el panel. Es la misma verificación con
    // distinto filtro de rol, así que aquí es un parámetro.
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

  // Renueva el token de una sesión ya válida, sin pedir la contraseña
  // otra vez. Equivale al renewToken anterior.
  // Vuelve a leer el usuario de la base a propósito: si lo
  // desactivaron o le cambiaron el rol mientras tenía sesión abierta,
  // la renovación lo tiene que reflejar en vez de arrastrar lo que
  // decía el token viejo.
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

  // Busqueda por correo exacto.
  async obtenerPorEmail(email: string) {
    const usuario = await prisma.usuarios.findFirst({
      where: { email },
      select: SELECCION_PUBLICA,
    });
    if (!usuario) throw noEncontrado('Usuario');
    return usuario;
  },

  // Alta de un moderador con contrasena generada.
  // El sistema anterior generaba la contrasena y se la mandaba por
  // correo al nuevo moderador usando una cuenta de Gmail cuya
  // app-password estaba escrita en texto plano dentro del codigo
  // fuente, en un repositorio que circulo entre varias personas.
  // Aqui no se manda correo: la contrasena se devuelve UNA sola vez a
  // quien creo la cuenta, para que se la entregue por el medio que
  // corresponda. Cuando la Universidad de un SMTP institucional se
  // puede conectar el envio; mientras tanto no hay ninguna credencial
  // ajena viviendo en el repositorio.
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

  // Actualiza datos del usuario.
  // A diferencia de la versión anterior, que pasaba el cuerpo completo
  // de la petición al ORM, aquí sólo se aceptan campos explícitos.
  // El rol y la contraseña no se pueden cambiar por esta vía.
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

  // Cambio de rol. Operación separada y restringida a administradores.
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

  // Activa o desactiva la cuenta.
  // El panel anterior llamaba a un endpoint que recibia el estado en
  // crudo ("Active" / "Inactive") desde el navegador. Aqui entra un
  // booleano y el valor de la columna lo pone el backend, que es el
  // unico que tiene por que conocer como se escribe en la base.
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

  // Elimina el usuario de verdad (no es un cambio de estado).
  // Si tiene calificaciones o rutas turisticas asociadas, la base
  // rechaza el borrado (esas relaciones son onDelete: Restrict) para
  // no dejar registros huerfanos; en ese caso se le pide al admin que
  // desactive la cuenta en vez de eliminarla.
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

// Contrasena temporal legible pero aleatoria. Usa randomInt del modulo
// crypto, no Math.random, porque esto si es un secreto.
// Se omiten caracteres que se confunden al dictarlos: l, I, 1, O, 0.
const ALFABETO = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarContrasena(largo = 12): string {
  let salida = '';
  for (let i = 0; i < largo; i++) {
    salida += ALFABETO[randomInt(ALFABETO.length)];
  }
  return salida;
}
