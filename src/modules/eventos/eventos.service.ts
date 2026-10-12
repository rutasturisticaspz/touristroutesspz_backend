import { prisma } from '../../db/prisma';
import { noEncontrado, solicitudInvalida } from '../../lib/errors';
import { EstadoEntidad } from '../../types/roles';
import { combinarWhere, leerOrden, leerPaginacion } from '../../lib/query';
import { hoyDelServidor } from '../../lib/fechas';

// Events.
// It does not use the site factory because it has its own shape: it
// has no accessibility, it does have an English name and dates, and it
// can also be associated with any of the other six site types.
// About the dates: the table stores four. fechaInicio/fechaFin are
// when the event takes place; mostrarFechaInicio/mostrarFechaFin are
// when it should appear published on the site. The previous system
// mixed them up; here they are respected as two separate things.

const CAMPOS_ORDENABLES = ['id', 'nombre', 'fechaInicio', 'createdAt'] as const;

// The six site types an event can be linked to.
const VINCULOS = {
  atracciones: { delegado: prisma.eventosAtracciones, campo: 'atraccionesId', relacion: 'atraccion' },
  hoteles: { delegado: prisma.eventosHoteles, campo: 'hotelesId', relacion: 'hotel' },
  restaurantes: { delegado: prisma.eventosRestaurantes, campo: 'restaurantesId', relacion: 'restaurante' },
  oficinasTuristicas: { delegado: prisma.eventosOficinas, campo: 'oficinasTuristicasId', relacion: 'oficina' },
  operadoresTuristicos: { delegado: prisma.eventosOperadores, campo: 'operadoresTuristicosId', relacion: 'operador' },
  rentadorasVehiculos: { delegado: prisma.eventosRentadoras, campo: 'rentadorasVehiculosId', relacion: 'rentadora' },
} as const;

export type TipoVinculo = keyof typeof VINCULOS;

export const TIPOS_VINCULO = Object.keys(VINCULOS) as TipoVinculo[];

const RELACIONES = {
  ubicacion: true,
  imagenes: { where: { state: EstadoEntidad.ACTIVO } },
  contactos: { include: { contacto: true } },
  atracciones: { include: { atraccion: true } },
  hoteles: { include: { hotel: true } },
  restaurantes: { include: { restaurante: true } },
  oficinasTuristicas: { include: { oficina: true } },
  operadoresTuristicos: { include: { operador: true } },
  rentadorasVehiculos: { include: { rentadora: true } },
};

// Flattens all the join tables.
function darFormato(evento: any) {
  if (!evento) return evento;
  const salida: any = { ...evento };
  salida.contactos = evento.contactos?.map((c: any) => c.contacto) ?? [];
  for (const tipo of TIPOS_VINCULO) {
    const relacion = VINCULOS[tipo].relacion;
    salida[tipo] = evento[tipo]?.map((v: any) => v[relacion]) ?? [];
  }
  return salida;
}

function busquedaTexto(termino?: string) {
  const t = termino?.trim();
  if (!t) return undefined;
  return {
    OR: [
      { nombre: { contains: t } },
      { nombreIngles: { contains: t } },
      { descripcion: { contains: t } },
      { descripcionIngles: { contains: t } },
      { contactos: { some: { contacto: { valor: { contains: t } } } } },
      {
        ubicacion: {
          OR: [
            { provincia: { contains: t } },
            { canton: { contains: t } },
            { distrito: { contains: t } },
            { detalle: { contains: t } },
          ],
        },
      },
    ],
  };
}

function filtroUbicacion(u: { provincia?: string; canton?: string; distrito?: string }) {
  const cond: Record<string, unknown> = {};
  if (u.provincia?.trim()) cond.provincia = { contains: u.provincia.trim() };
  if (u.canton?.trim()) cond.canton = { contains: u.canton.trim() };
  if (u.distrito?.trim()) cond.distrito = { contains: u.distrito.trim() };
  if (Object.keys(cond).length === 0) return undefined;
  return { ubicacion: cond };
}

// ?vigentes=true keeps only the events that should be published today,
// according to the mostrarFechaInicio–mostrarFechaFin window.
function filtroVigentes(valor: unknown) {
  if (valor !== 'true' && valor !== true) return undefined;
  const ahora = new Date();
  return {
    AND: [
      { OR: [{ mostrarFechaInicio: null }, { mostrarFechaInicio: { lte: ahora } }] },
      { OR: [{ mostrarFechaFin: null }, { mostrarFechaFin: { gte: ahora } }] },
    ],
  };
}

// Events that have not ended yet: today's and future ones.
// fechaFin alone is not enough, because the column is filled with the
// creation date when nobody edits it, so fechaInicio is checked too.
export function filtroEventosProximos() {
  const hoy = hoyDelServidor();
  return { OR: [{ fechaFin: { gte: hoy } }, { fechaInicio: { gte: hoy } }] };
}

// ?proximos=true
function filtroProximos(valor: unknown) {
  if (valor !== 'true' && valor !== true) return undefined;
  return filtroEventosProximos();
}

export const eventosService = {
  async listar(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const orderBy = leerOrden(query, CAMPOS_ORDENABLES, 'fechaInicio');

    const where = combinarWhere(
      { state: EstadoEntidad.ACTIVO },
      busquedaTexto(query.filtro as string | undefined),
      filtroUbicacion({
        provincia: query.provincia as string | undefined,
        canton: query.canton as string | undefined,
        distrito: query.distrito as string | undefined,
      }),
      filtroVigentes(query.vigentes),
      filtroProximos(query.proximos),
    );

    const [datos, total] = await Promise.all([
      prisma.eventos.findMany({ where, orderBy, skip, take, include: RELACIONES }),
      prisma.eventos.count({ where }),
    ]);

    return { total, datos: datos.map(darFormato) };
  },

  async obtenerPorId(id: number) {
    const evento = await prisma.eventos.findUnique({ where: { id }, include: RELACIONES });
    if (!evento) throw noEncontrado('Evento');
    return darFormato(evento);
  },

  async conImagenes(query: Record<string, unknown>) {
    const { skip, take } = leerPaginacion(query);
    const where = {
      state: EstadoEntidad.ACTIVO,
      imagenes: { some: { state: EstadoEntidad.ACTIVO } },
    };

    const [datos, total] = await Promise.all([
      prisma.eventos.findMany({
        where,
        orderBy: { fechaInicio: 'desc' as const },
        skip,
        take,
        include: RELACIONES,
      }),
      prisma.eventos.count({ where }),
    ]);

    return { total, datos: datos.map(darFormato) };
  },

  async crear(datos: Record<string, unknown>) {
    const creado = await prisma.eventos.create({
      data: { ...datos, state: EstadoEntidad.ACTIVO } as never,
      include: RELACIONES,
    });
    return darFormato(creado);
  },

  async actualizar(id: number, datos: Record<string, unknown>) {
    await eventosService.obtenerPorId(id);
    const actualizado = await prisma.eventos.update({
      where: { id },
      data: { ...datos, updateAt: new Date() } as never,
      include: RELACIONES,
    });
    return darFormato(actualizado);
  },

  async definirContactos(id: number, ids: number[]) {
    await eventosService.obtenerPorId(id);
    await prisma.$transaction([
      prisma.eventosContactos.deleteMany({ where: { eventosId: id } }),
      prisma.eventosContactos.createMany({
        data: ids.map((contactosId) => ({ eventosId: id, contactosId })),
        skipDuplicates: true,
      }),
    ]);
    return eventosService.obtenerPorId(id);
  },

  // Replaces the linked sites of one type. The type is validated
  // against the list above; whatever comes in the request is never used
  // to build a table name.
  async definirVinculos(id: number, tipo: string, ids: number[]) {
    if (!TIPOS_VINCULO.includes(tipo as TipoVinculo)) {
      throw solicitudInvalida(
        `Tipo de vínculo inválido: "${tipo}". Válidos: ${TIPOS_VINCULO.join(', ')}`,
      );
    }
    await eventosService.obtenerPorId(id);
    const v = VINCULOS[tipo as TipoVinculo];
    await prisma.$transaction([
      (v.delegado as any).deleteMany({ where: { eventosId: id } }),
      (v.delegado as any).createMany({
        data: ids.map((otro) => ({ eventosId: id, [v.campo]: otro })),
        skipDuplicates: true,
      }),
    ]);
    return eventosService.obtenerPorId(id);
  },

  async desactivar(id: number) {
    await eventosService.obtenerPorId(id);
    return prisma.eventos.update({
      where: { id },
      data: { state: EstadoEntidad.INACTIVO, updateAt: new Date() },
    });
  },
};

