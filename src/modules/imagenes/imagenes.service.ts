import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../db/prisma';
import { config } from '../../config';
import { noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { leerPaginacion } from '../../lib/query';

// Imágenes.
// El sistema anterior subía los archivos a Firebase Storage desde el
// panel de administración y guardaba en la base la URL completa que
// Firebase devolvía, con su token de acceso incluido. Eso ataba el
// proyecto a una cuenta personal: si esa cuenta se cae, las 1219
// imágenes del sitio desaparecen.
// Aquí el archivo se guarda en el disco del servidor y en la base sólo
// queda una ruta relativa (/uploads/nombre.jpg). El mismo backend la
// sirve como estático. No hay servicio externo de por medio.
// Se conserva la convención de nombres original —idDueño-timestamp.ext—
// porque es la que usan los 1587 archivos ya rescatados.

// Las siete tablas de imágenes, cada una con su columna de dueño.
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

// Traduce el tipo que viene en la URL a su tabla. Nunca se arma el
// nombre de una tabla con texto de la petición: si el tipo no está en
// la lista, la petición se rechaza.
function resolver(tipo: string) {
  if (!TIPOS_IMAGEN.includes(tipo as TipoImagen)) {
    throw solicitudInvalida(
      `Tipo de imagen inválido: "${tipo}". Válidos: ${TIPOS_IMAGEN.join(', ')}`,
    );
  }
  return TIPOS[tipo as TipoImagen];
}

// Extensiones aceptadas, en minúscula.
export const EXTENSIONES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Genera el nombre de archivo con la convención original.
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

  // Listado por dueño, o de todo el tipo si no se indica dueño.
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

  // Registra en la base un archivo que multer ya dejó en el disco.
  // Si la inserción falla, se borra el archivo para no dejar basura.
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

  // Sólo se puede cambiar el texto; el archivo no se reemplaza en sitio.
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

  // Baja lógica. El archivo se queda en el disco a propósito: en este
  // proyecto ya se perdieron dos imágenes por borrados de por medio,
  // así que quitarla del sitio y borrarla del disco son dos decisiones
  // distintas.
  async desactivar(tipo: string, id: number) {
    const { delegado } = resolver(tipo);
    await imagenesService.obtenerPorId(tipo, id);
    return (delegado as any).update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};
