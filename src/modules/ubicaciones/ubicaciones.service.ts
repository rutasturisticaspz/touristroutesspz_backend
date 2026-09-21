import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';

const CAMPOS_ORDENABLES = ['id', 'provincia', 'canton', 'distrito'] as const;
const CAMPOS_BUSCABLES = ['provincia', 'canton', 'distrito', 'detalle'];

export interface DatosUbicacion {
  provincia: string;
  canton: string;
  distrito: string;
  detalle: string;
  latitud: string;
  longitud: string;
}

export const ubicacionesService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'id');
    const where = combinarWhere(
      { state: EstadoEntidad.ACTIVO },
      filtroTexto(query.filtro as string | undefined, CAMPOS_BUSCABLES),
    );
    const [datos, total] = await Promise.all([
      prisma.ubicaciones.findMany({ where, orderBy, skip, take }),
      prisma.ubicaciones.count({ where }),
    ]);
    return { total, datos };
  },

  async obtenerPorId(id: number) {
    const u = await prisma.ubicaciones.findUnique({ where: { id } });
    if (!u) throw noEncontrado('Ubicación');
    return u;
  },

  async crear(datos: DatosUbicacion) {
    return prisma.ubicaciones.create({ data: { ...datos, state: EstadoEntidad.ACTIVO } });
  },

  async actualizar(id: number, datos: Partial<DatosUbicacion>) {
    await this.obtenerPorId(id);
    return prisma.ubicaciones.update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
    });
  },

  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.ubicaciones.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
