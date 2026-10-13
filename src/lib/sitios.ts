import { prisma } from '../db/prisma';
import { noEncontrado } from './errors';
import { EstadoEntidad } from '../types/roles';
import { combinarWhere, leerOrden, leerPaginacion } from './query';
import { listarConImagenes } from './nuevosPrimero';

// Service factory for the system's "sites".
// Hotels, restaurants, offices, operators and rental companies are the
// same entity with a different name: a location, an image gallery, a
// list of contacts and an accessibility block. In the previous system
// that was copied and pasted five times (five services of 12 to 24 KB,
// with the same SQL concatenations in each one). Here the logic lives
// in one place and each module only declares how it differs. If the
// search needs fixing tomorrow, it is fixed once.

// ------------------------------------------------------------
//  Accessibility field sets
//  (not every table has the same ones; the real DDL is respected)
// ------------------------------------------------------------

const DISCAPACIDAD = [
  'discapacidadVisual',
  'discapacidadAuditiva',
  'discapacidadFisica',
  'discapacidadCognitiva',
  'discapacidadSicosocial',
] as const;

// hotels, restaurants: include pets, children and tourist declaration.
export const ACCESIBILIDAD_COMPLETA = [
  'declaracionTuristica',
  'permitenMascotas',
  'permitenNinos',
  ...DISCAPACIDAD,
] as const;

// offices, operators: no pets or children.
export const ACCESIBILIDAD_SIN_MASCOTAS = ['declaracionTuristica', ...DISCAPACIDAD] as const;

// rental companies: the table has no declaracionTuristica.
export const ACCESIBILIDAD_SOLO_DISCAPACIDAD = [...DISCAPACIDAD] as const;

// ------------------------------------------------------------
//  Configuration of each site
// ------------------------------------------------------------

// Describes a join table (site ↔ category / contact).
export interface Union {
  // The Prisma delegate of the join table.
  delegado: any;
  // Name of the column that points to the site, e.g. "hotelesId".
  campoPropio: string;
  // Name of the column that points to the other entity, e.g.
  // "categoriasId".
  campoAjeno: string;
  // Name of the relation when reading, e.g. "categoria".
  relacion: string;
}

export interface ConfigSitio {
  // The Prisma delegate of the main table.
  delegado: any;
  // What it is called in error messages.
  etiqueta: string;
  // Text fields that ?filtro= searches over.
  camposTexto?: readonly string[];
  // Boolean fields that ?accesibilidad= accepts.
  camposAccesibilidad?: readonly string[];
  // Fields the results can be ordered by.
  camposOrdenables?: readonly string[];
  union?: {
    categorias?: Union;
    contactos?: Union;
  };
}

const CAMPOS_TEXTO_POR_DEFECTO = ['nombre', 'descripcion', 'descripcionIngles'] as const;
const CAMPOS_ORDENABLES_POR_DEFECTO = ['id', 'nombre', 'createdAt'] as const;

export function crearServicioSitio(config: ConfigSitio) {
  const camposTexto = config.camposTexto ?? CAMPOS_TEXTO_POR_DEFECTO;
  const camposOrdenables = config.camposOrdenables ?? CAMPOS_ORDENABLES_POR_DEFECTO;
  const camposAccesibilidad = config.camposAccesibilidad ?? [];
  const unionCategorias = config.union?.categorias;
  const unionContactos = config.union?.contactos;

  // Relations that are always loaded.
  const RELACIONES: Record<string, unknown> = {
    ubicacion: true,
    imagenes: { where: { state: EstadoEntidad.ACTIVO } },
  };
  if (unionCategorias) RELACIONES.categorias = { include: { [unionCategorias.relacion]: true } };
  if (unionContactos) RELACIONES.contactos = { include: { [unionContactos.relacion]: true } };

  // Flattens the join tables so the frontend receives something simple.
  function darFormato(fila: any) {
    if (!fila) return fila;
    const { categorias, contactos, ...resto } = fila;
    const salida: any = { ...resto };
    if (unionCategorias) {
      salida.categorias = categorias?.map((c: any) => c[unionCategorias.relacion]) ?? [];
    }
    if (unionContactos) {
      salida.contactos = contactos?.map((c: any) => c[unionContactos.relacion]) ?? [];
    }
    return salida;
  }

  // Text search over the site and its relations.
  function busquedaTexto(termino?: string) {
    const t = termino?.trim();
    if (!t) return undefined;

    const opciones: any[] = camposTexto.map((campo) => ({ [campo]: { contains: t } }));

    if (unionCategorias) {
      opciones.push({
        categorias: {
          some: {
            [unionCategorias.relacion]: {
              OR: [
                { nombre: { contains: t } },
                { nombreIngles: { contains: t } },
                { descripcion: { contains: t } },
                { descripcionIngles: { contains: t } },
              ],
            },
          },
        },
      });
    }

    if (unionContactos) {
      opciones.push({
        contactos: { some: { [unionContactos.relacion]: { valor: { contains: t } } } },
      });
    }

    opciones.push({
      ubicacion: {
        OR: [
          { provincia: { contains: t } },
          { canton: { contains: t } },
          { distrito: { contains: t } },
          { detalle: { contains: t } },
        ],
      },
    });

    return { OR: opciones };
  }

  // Location filter. Only the parts that are provided are applied.
  function filtroUbicacion(u: { provincia?: string; canton?: string; distrito?: string }) {
    const cond: Record<string, unknown> = {};
    if (u.provincia?.trim()) cond.provincia = { contains: u.provincia.trim() };
    if (u.canton?.trim()) cond.canton = { contains: u.canton.trim() };
    if (u.distrito?.trim()) cond.distrito = { contains: u.distrito.trim() };
    if (Object.keys(cond).length === 0) return undefined;
    return { ubicacion: cond };
  }

  // Category filter, received by name.
  function filtroCategorias(nombres?: string[]) {
    if (!unionCategorias) return undefined;
    const limpios = (nombres ?? []).map((n) => n.trim()).filter(Boolean);
    if (limpios.length === 0) return undefined;
    return {
      categorias: {
        some: { [unionCategorias.relacion]: { nombre: { in: limpios } } },
      },
    };
  }

  // Accessibility filter. Only column names declared by the module are
  // accepted; any other is ignored instead of reaching the query.
  function filtroAccesibilidad(campos?: string[]) {
    const validos = (campos ?? []).filter((c) => camposAccesibilidad.includes(c));
    if (validos.length === 0) return undefined;
    return { AND: validos.map((campo) => ({ [campo]: true })) };
  }

  const servicio = {
    // The accessibility column names this site supports.
    camposAccesibilidad,

    async listar(query: Record<string, unknown>) {
      const { skip, take } = leerPaginacion(query);
      const orderBy = leerOrden(query, camposOrdenables as readonly string[], 'nombre');

      const where = combinarWhere(
        { state: EstadoEntidad.ACTIVO },
        busquedaTexto(query.filtro as string | undefined),
        filtroUbicacion({
          provincia: query.provincia as string | undefined,
          canton: query.canton as string | undefined,
          distrito: query.distrito as string | undefined,
        }),
        filtroCategorias(normalizarLista(query.categorias)),
        filtroAccesibilidad(normalizarLista(query.accesibilidad)),
      );

      const [datos, total] = await Promise.all([
        config.delegado.findMany({ where, orderBy, skip, take, include: RELACIONES }),
        config.delegado.count({ where }),
      ]);

      return { total, datos: datos.map(darFormato) };
    },

    async obtenerPorId(id: number) {
      const fila = await config.delegado.findUnique({ where: { id }, include: RELACIONES });
      if (!fila) throw noEncontrado(config.etiqueta);
      return darFormato(fila);
    },

    // Only those that have at least one active image. With ?nuevos=<days>
    // the recently created ones come first.
    conImagenes(query: Record<string, unknown>) {
      return listarConImagenes({
        delegado: config.delegado,
        include: RELACIONES,
        darFormato,
        query,
      });
    },

    async crear(datos: Record<string, unknown>) {
      const creada = await config.delegado.create({
        data: { ...datos, state: EstadoEntidad.ACTIVO },
        include: RELACIONES,
      });
      return darFormato(creada);
    },

    async actualizar(id: number, datos: Record<string, unknown>) {
      await servicio.obtenerPorId(id);
      const actualizada = await config.delegado.update({
        where: { id },
        data: { ...datos, updateAt: new Date() },
        include: RELACIONES,
      });
      return darFormato(actualizada);
    },

    // Completely replaces the associated categories.
    async definirCategorias(id: number, ids: number[]) {
      if (!unionCategorias) throw noEncontrado('Categorías para ' + config.etiqueta);
      await servicio.obtenerPorId(id);
      const u = unionCategorias;
      await prisma.$transaction([
        u.delegado.deleteMany({ where: { [u.campoPropio]: id } }),
        u.delegado.createMany({
          data: ids.map((otro) => ({ [u.campoPropio]: id, [u.campoAjeno]: otro })),
          skipDuplicates: true,
        }),
      ]);
      return servicio.obtenerPorId(id);
    },

    // Completely replaces the associated contacts.
    async definirContactos(id: number, ids: number[]) {
      if (!unionContactos) throw noEncontrado('Contactos para ' + config.etiqueta);
      await servicio.obtenerPorId(id);
      const u = unionContactos;
      await prisma.$transaction([
        u.delegado.deleteMany({ where: { [u.campoPropio]: id } }),
        u.delegado.createMany({
          data: ids.map((otro) => ({ [u.campoPropio]: id, [u.campoAjeno]: otro })),
          skipDuplicates: true,
        }),
      ]);
      return servicio.obtenerPorId(id);
    },

    // Related sites, for the sidebar of the detail page.
    // Replaces findBySameCategory / findWithoutMe from the previous
    // system, with three differences:
    //  1. The current one is excluded by id, not by name. The old one did
    //     `nombre != '<request text>'`, which on top of being fragile was
    //     another injection point.
    //  2. The categories are taken from the site itself instead of asking
    //     the frontend to send them back.
    //  3. Both `nombre` and `nombreIngles` are compared. The old one
    //     compared only one of the two depending on the module, and since
    //     a good part of the categories have an empty English name, in
    //     attractions that left out valid results.
    // Sites without their own categories (restaurants, offices,
    // operators, rental companies) return others of the same type, which
    // is exactly what the old one did: in those modules the category
    // filter was commented out in the code.
    async relacionados(id: number, take = 3) {
      const actual: any = await servicio.obtenerPorId(id);

      const where: Record<string, any> = {
        state: EstadoEntidad.ACTIVO,
        id: { not: id },
      };

      if (unionCategorias) {
        const nombres = (actual.categorias ?? [])
          .flatMap((c: any) => [c.nombre, c.nombreIngles])
          .map((n: unknown) => (typeof n === 'string' ? n.trim() : ''))
          .filter(Boolean);

        if (nombres.length > 0) {
          where.categorias = {
            some: {
              [unionCategorias.relacion]: {
                OR: [{ nombre: { in: nombres } }, { nombreIngles: { in: nombres } }],
              },
            },
          };
        }
      }

      // The old one used MySQL's ORDER BY RAND(), which forces sorting the
      // whole table. Here only the candidate ids are fetched and shuffled in
      // memory: these are tables of hundreds of rows, not millions.
      const candidatos: Array<{ id: number }> = await config.delegado.findMany({
        where,
        select: { id: true },
      });

      const elegidos = barajar(candidatos.map((c) => c.id)).slice(0, Math.max(1, take));

      const datos = await config.delegado.findMany({
        where: { id: { in: elegidos } },
        include: RELACIONES,
      });

      return { total: candidatos.length, datos: datos.map(darFormato) };
    },

    // Removes a single contact from the site, without touching the others.
    // Equivalent to the previous system's PUT /delete/contacto/.
    async quitarContacto(id: number, contactoId: number) {
      if (!unionContactos) throw noEncontrado('Contactos para ' + config.etiqueta);
      await servicio.obtenerPorId(id);
      await unionContactos.delegado.deleteMany({
        where: {
          [unionContactos.campoPropio]: id,
          [unionContactos.campoAjeno]: contactoId,
        },
      });
      return servicio.obtenerPorId(id);
    },

    // Soft delete. The system never deletes rows: it changes state to
    // 'Inactive', just like the previous one did.
    async desactivar(id: number) {
      await servicio.obtenerPorId(id);
      return config.delegado.update({
        where: { id },
        data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
      });
    },
  };

  return servicio;
}

export type ServicioSitio = ReturnType<typeof crearServicioSitio>;

// Accepts ?x=a&x=b as well as ?x=a,b
export function normalizarLista(valor: unknown): string[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') return valor.split(',').map((s) => s.trim()).filter(Boolean);
  return undefined;
}

// Fisher-Yates shuffle, for the random order of related sites.
export function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
