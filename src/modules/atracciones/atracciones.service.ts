import type { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { noEncontrado } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, leerOrden, leerPaginacion } from '../../lib/query';
import { barajar } from '../../lib/sitios';

// Atracciones turísticas.
// Este era el servicio más grande del sistema anterior: 24 KB con 88
// lugares donde el texto de la petición se pegaba directamente a la
// consulta SQL. Aquí todas esas búsquedas se expresan con el API de
// Prisma, que parametriza los valores por su cuenta.

const CAMPOS_ORDENABLES = ['id', 'nombre', 'createdAt'] as const;

// Relaciones que se traen al consultar una atracción.
const RELACIONES = {
  ubicacion: true,
  imagenes: { where: { state: EstadoEntidad.ACTIVO } },
  categorias: { include: { categoria: true } },
  contactos: { include: { contacto: true } },
} satisfies Prisma.AtraccionesInclude;

// Aplana las tablas intermedias para que el frontend reciba algo simple.
function darFormato(atraccion: any) {
  if (!atraccion) return atraccion;
  const { categorias, contactos, ...resto } = atraccion;
  return {
    ...resto,
    categorias: categorias?.map((c: any) => c.categoria) ?? [],
    contactos: contactos?.map((c: any) => c.contacto) ?? [],
  };
}

// Búsqueda de texto sobre la atracción y sus relaciones.
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

// Filtro por ubicación. Sólo se aplican las partes que vengan.
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

// Filtro por categorías, recibidas por nombre.
function filtroCategorias(nombres?: string[]): Prisma.AtraccionesWhereInput | undefined {
  const limpios = (nombres ?? []).map((n) => n.trim()).filter(Boolean);
  if (limpios.length === 0) return undefined;
  return { categorias: { some: { categoria: { nombre: { in: limpios } } } } };
}

// Filtro por características de accesibilidad.
// Recibe los nombres de las columnas booleanas que deben estar en true.
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

  // Sólo las que tienen al menos una imagen. Usado por la portada.
  async conImagenes(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const where: Prisma.AtraccionesWhereInput = {
      state: EstadoEntidad.ACTIVO,
      imagenes: { some: { state: EstadoEntidad.ACTIVO } },
    };

    const [datos, total] = await Promise.all([
      prisma.atracciones.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip,
        take,
        include: RELACIONES,
      }),
      prisma.atracciones.count({ where }),
    ]);

    return { total, datos: datos.map(darFormato) };
  },

  // Conteo global por tipo de sitio, para el panel.
  // Equivale al antiguo countOfAll.
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

  // Reemplaza por completo las categorías asociadas.
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

  // Reemplaza por completo los contactos asociados.
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

  // Atracciones relacionadas con esta, para la barra lateral de la
  // página de detalle. Reemplaza a findBySameCategory.
  // El viejo excluía la actual comparando nombres pegados al SQL y
  // filtraba sólo por `categoria.nombreIngles`; como muchas categorías
  // tienen ese campo vacío, ahí se perdían coincidencias. Aquí se
  // excluye por id y se comparan los dos idiomas.
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

  // Quita un solo contacto, sin tocar los demás.
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

// Acepta ?x=a&x=b y también ?x=a,b
function normalizarLista(valor: unknown): string[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') return valor.split(',').map((s) => s.trim()).filter(Boolean);
  return undefined;
}
