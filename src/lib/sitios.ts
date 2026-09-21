import { prisma } from '../db/prisma';
import { noEncontrado } from './errors';
import { EstadoEntidad } from '../types/roles';
import { combinarWhere, leerOrden, leerPaginacion } from './query';

// Fábrica de servicios para los "sitios" del sistema.
// Hoteles, restaurantes, oficinas, operadores y rentadoras son la misma
// entidad con distinto nombre: una ubicación, una galería de imágenes,
// una lista de contactos y un bloque de accesibilidad. En el sistema
// anterior eso estaba copiado y pegado cinco veces (cinco servicios de
// entre 12 y 24 KB, con las mismas concatenaciones de SQL en cada uno).
// Aquí la lógica vive una sola vez y cada módulo sólo declara en qué se
// diferencia. Si mañana hay que arreglar la búsqueda, se arregla una vez.

// ------------------------------------------------------------
//  Conjuntos de campos de accesibilidad
//  (no todas las tablas tienen los mismos; se respeta el DDL real)
// ------------------------------------------------------------

const DISCAPACIDAD = [
  'discapacidadVisual',
  'discapacidadAuditiva',
  'discapacidadFisica',
  'discapacidadCognitiva',
  'discapacidadSicosocial',
] as const;

// hoteles, restaurantes: incluyen mascotas, niños y declaración turística.
export const ACCESIBILIDAD_COMPLETA = [
  'declaracionTuristica',
  'permitenMascotas',
  'permitenNinos',
  ...DISCAPACIDAD,
] as const;

// oficinas, operadores: sin mascotas ni niños.
export const ACCESIBILIDAD_SIN_MASCOTAS = ['declaracionTuristica', ...DISCAPACIDAD] as const;

// rentadoras: la tabla no tiene declaracionTuristica.
export const ACCESIBILIDAD_SOLO_DISCAPACIDAD = [...DISCAPACIDAD] as const;

// ------------------------------------------------------------
//  Configuración de cada sitio
// ------------------------------------------------------------

// Describe una tabla intermedia (sitio ↔ categoría / contacto).
export interface Union {
  // El delegado de Prisma de la tabla intermedia.
  delegado: any;
  // Nombre de la columna que apunta al sitio, p. ej. "hotelesId".
  campoPropio: string;
  // Nombre de la columna que apunta a la otra entidad, p. ej. "categoriasId".
  campoAjeno: string;
  // Nombre de la relación al leer, p. ej. "categoria".
  relacion: string;
}

export interface ConfigSitio {
  // El delegado de Prisma de la tabla principal.
  delegado: any;
  // Cómo se llama en los mensajes de error.
  etiqueta: string;
  // Campos de texto sobre los que busca ?filtro=.
  camposTexto?: readonly string[];
  // Campos booleanos que acepta ?accesibilidad=.
  camposAccesibilidad?: readonly string[];
  // Campos por los que se puede ordenar.
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

  // Relaciones que se traen siempre.
  const RELACIONES: Record<string, unknown> = {
    ubicacion: true,
    imagenes: { where: { state: EstadoEntidad.ACTIVO } },
  };
  if (unionCategorias) RELACIONES.categorias = { include: { [unionCategorias.relacion]: true } };
  if (unionContactos) RELACIONES.contactos = { include: { [unionContactos.relacion]: true } };

  // Aplana las tablas intermedias para que el frontend reciba algo simple.
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

  // Búsqueda de texto sobre el sitio y sus relaciones.
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

  // Filtro por ubicación. Sólo se aplican las partes que vengan.
  function filtroUbicacion(u: { provincia?: string; canton?: string; distrito?: string }) {
    const cond: Record<string, unknown> = {};
    if (u.provincia?.trim()) cond.provincia = { contains: u.provincia.trim() };
    if (u.canton?.trim()) cond.canton = { contains: u.canton.trim() };
    if (u.distrito?.trim()) cond.distrito = { contains: u.distrito.trim() };
    if (Object.keys(cond).length === 0) return undefined;
    return { ubicacion: cond };
  }

  // Filtro por categorías, recibidas por nombre.
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

  // Filtro por accesibilidad. Sólo se aceptan los nombres de columna
  // declarados por el módulo; cualquier otro se ignora en vez de
  // llegar a la consulta.
  function filtroAccesibilidad(campos?: string[]) {
    const validos = (campos ?? []).filter((c) => camposAccesibilidad.includes(c));
    if (validos.length === 0) return undefined;
    return { AND: validos.map((campo) => ({ [campo]: true })) };
  }

  const servicio = {
    // Los nombres de columna de accesibilidad que este sitio admite.
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

    // Sólo los que tienen al menos una imagen activa.
    async conImagenes(query: Record<string, unknown>) {
      const { skip, take } = leerPaginacion(query);
      const where = {
        state: EstadoEntidad.ACTIVO,
        imagenes: { some: { state: EstadoEntidad.ACTIVO } },
      };

      const [datos, total] = await Promise.all([
        config.delegado.findMany({
          where,
          orderBy: { nombre: 'asc' },
          skip,
          take,
          include: RELACIONES,
        }),
        config.delegado.count({ where }),
      ]);

      return { total, datos: datos.map(darFormato) };
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

    // Reemplaza por completo las categorías asociadas.
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

    // Reemplaza por completo los contactos asociados.
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

    // Sitios relacionados, para la barra lateral de la página de
    // detalle.
    // Reemplaza a findBySameCategory / findWithoutMe del sistema
    // anterior, con tres diferencias:
    //  1. El actual se excluye por id, no por nombre. El viejo hacía
    //     `nombre != '<texto de la petición>'`, lo que además de
    //     frágil era otro punto de inyección.
    //  2. Las categorías se sacan del propio sitio en vez de pedirle
    //     al frontend que las mande de vuelta.
    //  3. Se comparan tanto `nombre` como `nombreIngles`. El viejo
    //     comparaba sólo uno de los dos según el módulo, y como buena
    //     parte de las categorías tienen el nombre en inglés vacío,
    //     en atracciones eso dejaba fuera resultados válidos.
    // Los sitios sin categorías propias (restaurantes, oficinas,
    // operadores, rentadoras) devuelven otros del mismo tipo, que es
    // exactamente lo que hacía el viejo: en esos módulos el filtro por
    // categoría estaba comentado en el código.
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

      // El viejo usaba ORDER BY RAND() de MySQL, que obliga a ordenar
      // la tabla entera. Aquí se traen sólo los ids candidatos y se
      // barajan en memoria: son tablas de cientos de filas, no de
      // millones.
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

    // Quita un solo contacto del sitio, sin tocar los demás.
    // Equivale al PUT /delete/contacto/ del sistema anterior.
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

    // Baja lógica. El sistema nunca borra filas: cambia state a
    // 'Inactive', igual que hacía el anterior.
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

// Acepta ?x=a&x=b y también ?x=a,b
export function normalizarLista(valor: unknown): string[] | undefined {
  if (valor === undefined || valor === null) return undefined;
  if (Array.isArray(valor)) return valor.map(String);
  if (typeof valor === 'string') return valor.split(',').map((s) => s.trim()).filter(Boolean);
  return undefined;
}

// Barajado de Fisher-Yates, para el orden aleatorio de relacionados.
export function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
