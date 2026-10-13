import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../db/prisma';
import { config } from '../../config';
import { noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { leerPaginacion } from '../../lib/query';

// Images.
// The previous system uploaded files to Firebase Storage from the
// admin panel and saved in the database the full URL Firebase
// returned, with its access token included. That tied the project to
// a personal account: if that account goes down, the site's 1219
// images disappear.
// Here the file is saved on the server's disk and the database only
// keeps a relative path (/uploads/name.jpg). The same backend serves
// it as a static file. There is no external service in between.
// The original naming convention is kept —ownerId-timestamp.ext—
// because it is the one used by the 1587 files already rescued.

// The seven image tables, each with its owner column.
const TIPOS = {
  atracciones: { delegado: prisma.imagenes, campo: 'atraccionId' },
  hoteles: { delegado: prisma.imagenesHoteles, campo: 'hotelId' },
  restaurantes: { delegado: prisma.imagenesRestaurantes, campo: 'restauranteId' },
  'oficinas-turisticas': {
    delegado: prisma.imagenesOficinasTuristicas,
    campo: 'oficinaTuristicaId',
  },
  'operadores-turisticos': {
    delegado: prisma.imagenesOperadoresTuristicos,
    campo: 'operadorTuristicoId',
  },
  'rentadoras-vehiculos': {
    delegado: prisma.imagenesRentadorasVehiculos,
    campo: 'rentadoraVehiculosId',
  },
  eventos: { delegado: prisma.imagenesEventos, campo: 'eventoId' },
} as const;

export type TipoImagen = keyof typeof TIPOS;

export const TIPOS_IMAGEN = Object.keys(TIPOS) as TipoImagen[];

// Translates the type that comes in the URL to its table. A table
// name is never built from request text: if the type is not in the
// list, the request is rejected.
function resolver(tipo: string) {
  if (!TIPOS_IMAGEN.includes(tipo as TipoImagen)) {
    throw solicitudInvalida(
      `Tipo de imagen inválido: "${tipo}". Válidos: ${TIPOS_IMAGEN.join(', ')}`,
    );
  }
  return TIPOS[tipo as TipoImagen];
}

// Accepted extensions, in lowercase.
export const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Generates the file name with the original convention.
export function nombreDeArchivo(idDueno: number, nombreOriginal: string): string {
  const ext = path.extname(nombreOriginal).toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    throw solicitudInvalida(
      `Extensión no permitida: "${ext}". Permitidas: ${EXTENSIONES_PERMITIDAS.join(', ')}`,
    );
  }
  return `${idDueno}-${Date.now()}${ext}`;
}

export const imagenesService = {
  tipos: TIPOS_IMAGEN,

  // List by owner, or of the whole type if no owner is given.
  async listar(tipo: string, query: Record<string, unknown>) {
    const { delegado, campo } = resolver(tipo);
    const { skip, take } = leerPaginacion(query);

    const where: Record<string, unknown> = { state: EstadoEntidad.ACTIVO };
    if (query.duenoId !== undefined && query.duenoId !== '') {
      const id = Number(query.duenoId);
      if (!Number.isInteger(id) || id <= 0) {
        throw solicitudInvalida('duenoId debe ser un entero positivo');
      }
      where[campo] = id;
    }

    const [datos, total] = await Promise.all([
      (delegado as any).findMany({ where, orderBy: { id: 'asc' }, skip, take }),
      (delegado as any).count({ where }),
    ]);

    return { total, datos };
  },

  async obtenerPorId(tipo: string, id: number) {
    const { delegado } = resolver(tipo);
    const imagen = await (delegado as any).findUnique({ where: { id } });
    if (!imagen) throw noEncontrado('Imagen');
    return imagen;
  },

  // Registers in the database a file that multer already left on disk.
  // If the insert fails, the file is deleted so no garbage is left.
  async registrar(
    tipo: string,
    idDueno: number,
    archivo: { filename: string; path: string },
    datos: { nombre: string; descripcion?: string | null },
  ) {
    const { delegado, campo } = resolver(tipo);
    try {
      return await (delegado as any).create({
        data: {
          nombre: datos.nombre,
          descripcion: datos.descripcion ?? '',
          nameUrl: archivo.filename,
          url: `${config.uploads.rutaPublica}/${archivo.filename}`,
          state: EstadoEntidad.ACTIVO,
          [campo]: idDueno,
        },
      });
    } catch (error) {
      await fs.rm(archivo.path, { force: true });
      throw error;
    }
  },

  // Only the text can be changed; the file is not replaced in place.
  async actualizar(
    tipo: string,
    id: number,
    datos: { nombre?: string; descripcion?: string | null },
  ) {
    const { delegado } = resolver(tipo);
    await imagenesService.obtenerPorId(tipo, id);
    return (delegado as any).update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
    });
  },

  // Soft delete. The file stays on disk on purpose: in this project two
  // images were already lost to stray deletions, so removing it from the
  // site and deleting it from disk are two different decisions.
  async desactivar(tipo: string, id: number) {
    const { delegado } = resolver(tipo);
    await imagenesService.obtenerPorId(tipo, id);
    return (delegado as any).update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
