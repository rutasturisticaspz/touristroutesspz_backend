import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from './asyncHandler';
import { validar } from './validar';
import { leerId } from './query';
import { requiereEdicion } from '../middleware/auth';
import type { ServicioSitio } from './sitios';

// Fábrica de routers para los sitios.
// Todos exponen la misma superficie:
//   GET    /                 listado con filtros
//   GET    /con-imagenes     sólo los que tienen galería
//   GET    /:id              detalle
//   GET    /:id/relacionados  otros sitios parecidos (barra lateral)
//   POST   /                 crear            (requiere sesión)
//   PUT    /:id              actualizar       (requiere sesión)
//   PUT    /:id/contactos    definir contactos (requiere sesión)
//   DELETE /:id/contactos/:contactoId  quitar uno solo (requiere sesión)
//   PUT    /:id/categorias   definir categorías (si el sitio las tiene)
//   DELETE /:id              baja lógica      (requiere sesión)
// Las lecturas son públicas; toda escritura pasa por requiereEdicion.
// En el sistema anterior 91 de 93 endpoints de escritura estaban
// abiertos sin autenticación: aquí el permiso se declara por ruta y
// lo cerrado es lo predeterminado.

const SIN_DESCRIPCION = new Set(['declaracionTuristica']);

// Arma el bloque zod de accesibilidad a partir de las columnas que
// realmente existen en esa tabla. Cada bandera booleana trae su par de
// descripciones en español e inglés, salvo declaracionTuristica.
export function esquemaAccesibilidad(campos: readonly string[]) {
  const forma: Record<string, z.ZodTypeAny> = {};
  for (const campo of campos) {
    forma[campo] = z.boolean().optional();
    if (SIN_DESCRIPCION.has(campo)) continue;
    forma[`${campo}Descripcion`] = z.string().nullable().optional();
    forma[`${campo}DescripcionIngles`] = z.string().nullable().optional();
  }
  return forma;
}

const esquemaIds = z.object({ ids: z.array(z.number().int().positive()) });

// Convierte ubicacionId en la relación anidada que espera Prisma.
export function prepararDatos(datos: Record<string, unknown>) {
  const { ubicacionId, ...resto } = datos;
  return {
    ...resto,
    ...(ubicacionId !== undefined
      ? { ubicacion: { connect: { id: ubicacionId as number } } }
      : {}),
  };
}

export interface OpcionesRouterSitio {
  servicio: ServicioSitio;
  // Campos propios del sitio, sin los de accesibilidad.
  esquemaBase: z.ZodRawShape;
  // true si la tabla tiene tabla intermedia de categorías.
  tieneCategorias?: boolean;
  // true si la tabla tiene tabla intermedia de contactos.
  tieneContactos?: boolean;
}

export function crearRouterSitio(opciones: OpcionesRouterSitio): Router {
  const { servicio, esquemaBase, tieneCategorias = false, tieneContactos = true } = opciones;

  const esquemaCrear = z.object({
    ...esquemaBase,
    ubicacionId: z.number().int().positive().optional(),
    ...esquemaAccesibilidad(servicio.camposAccesibilidad),
  });
  const esquemaActualizar = esquemaCrear.partial();

  const router = Router();

  // ---------------- Lectura pública ----------------

  router.get(
    '/con-imagenes',
    asyncHandler(async (req, res) => {
      res.json(await servicio.conImagenes(req.query as Record<string, unknown>));
    }),
  );

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(await servicio.listar(req.query as Record<string, unknown>));
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(await servicio.obtenerPorId(leerId(req.params.id)));
    }),
  );

  // Sitios relacionados con este, para la barra lateral de la página
  // de detalle. ?take=3 por omisión.
  router.get(
    '/:id/relacionados',
    asyncHandler(async (req, res) => {
      const take = req.query.take === undefined ? 3 : leerId(req.query.take, 'take');
      res.json(await servicio.relacionados(leerId(req.params.id), take));
    }),
  );

  // ---------------- Escritura ----------------

  router.post(
    '/',
    requiereEdicion,
    asyncHandler(async (req, res) => {
      const datos = validar(esquemaCrear, req.body);
      res.status(201).json(await servicio.crear(prepararDatos(datos)));
    }),
  );

  router.put(
    '/:id',
    requiereEdicion,
    asyncHandler(async (req, res) => {
      const datos = validar(esquemaActualizar, req.body);
      res.json(await servicio.actualizar(leerId(req.params.id), prepararDatos(datos)));
    }),
  );

  if (tieneContactos) {
    router.put(
      '/:id/contactos',
      requiereEdicion,
      asyncHandler(async (req, res) => {
        const { ids } = validar(esquemaIds, req.body);
        res.json(await servicio.definirContactos(leerId(req.params.id), ids));
      }),
    );
  }

  if (tieneContactos) {
    router.delete(
      '/:id/contactos/:contactoId',
      requiereEdicion,
      asyncHandler(async (req, res) => {
        res.json(
          await servicio.quitarContacto(
            leerId(req.params.id),
            leerId(req.params.contactoId, 'contactoId'),
          ),
        );
      }),
    );
  }

  if (tieneCategorias) {
    router.put(
      '/:id/categorias',
      requiereEdicion,
      asyncHandler(async (req, res) => {
        const { ids } = validar(esquemaIds, req.body);
        res.json(await servicio.definirCategorias(leerId(req.params.id), ids));
      }),
    );
  }

  router.delete(
    '/:id',
    requiereEdicion,
    asyncHandler(async (req, res) => {
      res.json(await servicio.desactivar(leerId(req.params.id)));
    }),
  );

  return router;
}
