import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, filtroTexto, leerOrden, leerPaginacion } from '../../lib/query';

const CAMPOS_ORDENABLES = ['id', 'nombre', 'createdAt'] as const;
const CAMPOS_BUSCABLES = ['nombre', 'descripcion', 'nombreIngles', 'descripcionIngles'];

export interface DatosCategoria {
  nombre: string;
  descripcion: string;
  nombreIngles: string;
  descripcionIngles: string;
}

export const categoriasService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'nombre');
    const where = combinarWhere(
      { state: EstadoEntidad.ACTIVO },
      filtroTexto(query.filtro as string | undefined, CAMPOS_BUSCABLES),
    );

    const [datos, total] = await Promise.all([
      prisma.categorias.findMany({ where, orderBy, skip, take }),
      prisma.categorias.count({ where }),
    ]);

    return { total, datos };
  },

  async obtenerPorId(id: number) {
    const categoria = await prisma.categorias.findUnique({ where: { id } });
    if (!categoria) throw noEncontrado('Categoría');
    return categoria;
  },

  async crear(datos: DatosCategoria) {
    return prisma.categorias.create({
      data: { ...datos, state: EstadoEntidad.ACTIVO },
    });
  },

  async actualizar(id: number, datos: Partial<DatosCategoria>) {
    await this.obtenerPorId(id);
    return prisma.categorias.update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
    });
  },

  // Baja lógica, igual que en el sistema original.
  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.categorias.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
