import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, leerOrden, leerPaginacion } from '../../lib/query';
import { barajar } from '../../lib/sitios';
import { listarConImagenes } from '../../lib/nuevosPrimero';

// Tourist attractions.
// This was the largest service in the previous system: 24 KB with 88
// places where the request text was pasted directly into the SQL
// query. Here all those searches are expressed with the Prisma API,
// which parameterizes the values on its own.

const CAMPOS_ORDENABLES = ['id', 'nombre', 'createdAt'] as const;

// Relations that are loaded when querying an attraction.
const RELACIONES = {
  ubicacion: true,
  imagenes: { where: { state: EstadoEntidad.ACTIVO } },
  categorias: { include: { categoria: true } },
  contactos: { include: { contacto: true } },
} satisfies Prisma.AtraccionesInclude;

// Flattens the join tables so the frontend receives something simple.
function darFormato(atraccion: any) {
  if (!atraccion) return atraccion;
  const { categorias, contactos, ...resto } = atraccion;
  return {
    ...resto,
    categorias: categorias?.map((c: any) => c.categoria) ?? [],
    contactos: contactos?.map((c: any) => c.contacto) ?? [],
  };
}

// Text search over the attraction and its relations.
function busquedaTexto(termino?: string): Prisma.AtraccionesWhereInput | undefined {
  const t = termino?.trim();
  if (!t) return undefined;

  return {
    OR: [
      { nombre: { contains: t } },
      { descripcion: { contains: t } },
      { descripcionIngles: { contains: t } },
      { categorias: { some: { categoria: { OR: [
        { nombre: { contains: t } },
        { nombreIngles: { contains: t } },
        { descripcion: { contains: t } },
        { descripcionIngles: { contains: t } },
      ] } } } },
      { contactos: { some: { contacto: { valor: { contains: t } } } } },
      { ubicacion: { OR: [
        { provincia: { contains: t } },
        { canton: { contains: t } },
        { distrito: { contains: t } },
        { detalle: { contains: t } },
      ] } },
    ],
  };
}

// Location filter. Only the parts that are provided are applied.
function filtroUbicacion(u?: {
  provincia?: string;
  canton?: string;
  distrito?: string;
}): Prisma.AtraccionesWhereInput | undefined {
  if (!u) return undefined;
  const cond: Prisma.UbicacionesWhereInput = {};
  if (u.provincia?.trim()) cond.provincia = { contains: u.provincia.trim() };
  if (u.canton?.trim()) cond.canton = { contains: u.canton.trim() };
  if (u.distrito?.trim()) cond.distrito = { contains: u.distrito.trim() };
  if (Object.keys(cond).length === 0) return undefined;
  return { ubicacion: cond };
}

// Category filter, received by name.
function filtroCategorias(nombres?: string[]): Prisma.AtraccionesWhereInput | undefined {
  const limpios = (nombres ?? []).map((n) => n.trim()).filter(Boolean);
  if (limpios.length === 0) return undefined;
  return { categorias: { some: { categoria: { nombre: { in: limpios } } } } };
}

// Filter by accessibility features.
// Receives the names of the boolean columns that must be true.
const ACCESIBILIDAD_PERMITIDA = [
  'permitenMascotas',
  'permitenNinos',
  'discapacidadVisual',
  'discapacidadAuditiva',
  'discapacidadFisica',
  'discapacidadCognitiva',
  'discapacidadSicosocial',
  'declaracionTuristica',
] as const;

type CampoAccesibilidad = (typeof ACCESIBILIDAD_PERMITIDA)[number];

function filtroAccesibilidad(campos?: string[]): Prisma.AtraccionesWhereInput | undefined {
  const validos = (campos ?? []).filter((c): c is CampoAccesibilidad =>
    ACCESIBILIDAD_PERMITIDA.includes(c as CampoAccesibilidad),
  );
  if (validos.length === 0) return undefined;
  return { AND: validos.map((campo) => ({ [campo]: true })) };
}

export const atraccionesService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'nombre');

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
    ) as Prisma.AtraccionesWhereInput;

    const [datos, total] = await Promise.all([
      prisma.atracciones.findMany({ where, orderBy, skip, take, include: RELACIONES }),
      prisma.atracciones.count({ where }),
    ]);

    return { total, datos: datos.map(darFormato) };
  },

  async obtenerPorId(id: number) {
    const atraccion = await prisma.atracciones.findUnique({
      where: { id },
      include: RELACIONES,
    });
    if (!atraccion) throw noEncontrado('Atracción');
    return darFormato(atraccion);
  },

  // Only those with at least one image. Used by the home page. With
  // ?nuevos=<days> the recently created ones come first.
  conImagenes(query: Record<string, unknown>) {
    return listarConImagenes({
      delegado: prisma.atracciones,
      include: RELACIONES,
      darFormato,
      query,
    });
  },

  // Global count by site type, for the panel.
  // Equivalent to the old countOfAll.
  async conteoGlobal() {
    const activo = { state: EstadoEntidad.ACTIVO };
    const [atracciones, restaurantes, hoteles, oficinas, operadores, rentadoras, eventos] =
      await Promise.all([
        prisma.atracciones.count({ where: activo }),
        prisma.restaurantes.count({ where: activo }),
        prisma.hoteles.count({ where: activo }),
        prisma.oficinasTuristicas.count({ where: activo }),
        prisma.operadoresTuristicos.count({ where: activo }),
        prisma.rentadorasVehiculos.count({ where: activo }),
        prisma.eventos.count({ where: activo }),
      ]);

    return { atracciones, restaurantes, hoteles, oficinas, operadores, rentadoras, eventos };
  },

  async crear(datos: Prisma.AtraccionesCreateInput) {
    const creada = await prisma.atracciones.create({
      data: { ...datos, state: EstadoEntidad.ACTIVO },
      include: RELACIONES,
    });
    return darFormato(creada);
  },

  async actualizar(id: number, datos: Prisma.AtraccionesUpdateInput) {
    await this.obtenerPorId(id);
    const actualizada = await prisma.atracciones.update({
      where: { id },
      data: { ...datos, updateAt: new Date() },
      include: RELACIONES,
    });
    return darFormato(actualizada);
  },

  // Completely replaces the associated categories.
  async definirCategorias(id: number, categoriaIds: number[]) {
    await this.obtenerPorId(id);
    await prisma.$transaction([
      prisma.atraccionesCategorias.deleteMany({ where: { atraccionesId: id } }),
      prisma.atraccionesCategorias.createMany({
        data: categoriaIds.map((categoriasId) => ({ atraccionesId: id, categoriasId })),
        skipDuplicates: true,
      }),
    ]);
    return this.obtenerPorId(id);
  },

  // Completely replaces the associated contacts.
  async definirContactos(id: number, contactoIds: number[]) {
    await this.obtenerPorId(id);
    await prisma.$transaction([
      prisma.atraccionesContactos.deleteMany({ where: { atraccionesId: id } }),
      prisma.atraccionesContactos.createMany({
        data: contactoIds.map((contactosId) => ({ atraccionesId: id, contactosId })),
        skipDuplicates: true,
      }),
    ]);
    return this.obtenerPorId(id);
  },

  // Attractions related to this one, for the sidebar of the detail
  // page. Replaces findBySameCategory.
  // The old one excluded the current one by comparing names pasted into
  // the SQL and filtered only by `categoria.nombreIngles`; since many
  // categories have that field empty, matches were lost there. Here it
  // is excluded by id and both languages are compared.
  async relacionados(id: number, take = 3) {
    const actual: any = await atraccionesService.obtenerPorId(id);

    const nombres: string[] = (actual.categorias ?? [])
      .flatMap((c: any) => [c.nombre, c.nombreIngles])
      .map((n: unknown) => (typeof n === 'string' ? n.trim() : ''))
      .filter(Boolean);

    const where: Prisma.AtraccionesWhereInput = {
      state: EstadoEntidad.ACTIVO,
      id: { not: id },
      ...(nombres.length > 0
        ? {
            categorias: {
              some: {
                categoria: {
                  OR: [{ nombre: { in: nombres } }, { nombreIngles: { in: nombres } }],
                },
              },
            },
          }
        : {}),
    };

    const candidatos = await prisma.atracciones.findMany({ where, select: { id: true } });
    const elegidos = barajar(candidatos.map((c) => c.id)).slice(0, Math.max(1, take));

    const datos = await prisma.atracciones.findMany({
      where: { id: { in: elegidos } },
      include: RELACIONES,
    });

    return { total: candidatos.length, datos: datos.map(darFormato) };
  },

  // Removes a single contact, without touching the others.
  async quitarContacto(id: number, contactoId: number) {
    await atraccionesService.obtenerPorId(id);
    await prisma.atraccionesContactos.deleteMany({
      where: { atraccionesId: id, contactosId: contactoId },
    });
    return atraccionesService.obtenerPorId(id);
  },

  async desactivar(id: number) {
    await this.obtenerPorId(id);
    return prisma.atracciones.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};

// Accepts ?x=a&x=b as well as ?x=a,b
function normalizarLista(valor: unknown): string[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') return valor.split(',').map((s) => s.trim()).filter(Boolean);
  return undefined;
}
