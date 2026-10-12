import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';
import { enviarCorreo } from '../../lib/mailer';

const CAMPOS_ORDENABLES = ['id', 'createdAt', 'nombre'] as const;

export interface DatosMensaje {
  nombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
}

export const mensajesService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'createdAt');
    const where = combinarWhere(
      { state: EstadoEntidad.ACTIVO },
      filtroTexto(query.filtro as string | undefined, ['nombre', 'correo', 'asunto', 'mensaje']),
    );
    const [datos, total] = await Promise.all([
      prisma.mensajesContactenos.findMany({ where, orderBy, skip, take }),
      prisma.mensajesContactenos.count({ where }),
    ]);
    return { total, datos };
  },

  async obtenerPorId(id: number) {
    const m = await prisma.mensajesContactenos.findUnique({ where: { id } });
    if (!m) throw noEncontrado('Mensaje');
    return m;
  },

  // Submission from the public contact form.
  async crear(datos: DatosMensaje) {
    return prisma.mensajesContactenos.create({
      data: { ...datos, estado: 'PENDIENTE', state: EstadoEntidad.ACTIVO },
    });
  },

  async cambiarEstado(id: number, estado: string) {
    await this.obtenerPorId(id);
    return prisma.mensajesContactenos.update({
      where: { id },
      data: { estado, updateAt: new Date() },
    });
  },

  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.mensajesContactenos.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },

  // Actually replies from the backend (see src/lib/mailer.ts), instead
  // of opening a mailto: in the browser of whoever is in the panel.
  // When it is sent successfully, the message is automatically marked
  // as handled -- the separate "Mark as handled" step is not needed.
  async responder(id: number, cuerpo: string) {
    const mensaje = await this.obtenerPorId(id);

    const texto =
      `${cuerpo}\n\n` +
      '---\n' +
      `Mensaje original de ${mensaje.nombre} (${mensaje.correo}):\n` +
      `${mensaje.mensaje}`;

    await enviarCorreo({
      para: mensaje.correo,
      asunto: `Re: ${mensaje.asunto}`,
      texto,
    });

    return prisma.mensajesContactenos.update({
      where: { id },
      data: { estado: 'ATENDIDO', updateAt: new Date() },
    });
  },
};
