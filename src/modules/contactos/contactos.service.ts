import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';

const CAMPOS_ORDENABLES = ['id', 'tipo', 'valor'] as const;

export interface DatosContacto {
  valor: string;
  tipo: string;
}

export const contactosService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'id');
    const where = combinarWhere(
      { state: EstadoEntidad.ACTIVO },
      filtroTexto(query.filtro as string | undefined, ['valor', 'tipo']),
    );
    const [datos, total] = await Promise.all([
      prisma.contactos.findMany({ where, orderBy, skip, take }),
      prisma.contactos.count({ where }),
    ]);
    return { total, datos };
  },

  async obtenerPorId(id: number) {
    const c = await prisma.contactos.findUnique({ where: { id } });
    if (!c) throw noEncontrado('Contacto');
    return c;
  },

  async crear(datos: DatosContacto) {
    return prisma.contactos.create({ data: { ...datos, state: EstadoEntidad.ACTIVO } });
  },

  async actualizar(id: number, datos: Partial<DatosContacto>) {
    await this.obtenerPorId(id);
    return prisma.contactos.update({ where: { id }, data: { ...datos, updateAt: new Date() } });
  },

  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.contactos.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
