import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from './asyncHandler';
import { validar } from './validar';
import { leerId } from './query';
import { requiereEdicion } from '../middleware/auth';
import type { ServicioSitio } from './sitios';

// Router factory for the sites.
// They all expose the same surface:
//   GET    /                 list with filters
//   GET    /con-imagenes     only those that have a gallery
//   GET    /:id              detail
//   GET    /:id/relacionados  other similar sites (sidebar)
//   POST   /                 create            (requires session)
//   PUT    /:id              update            (requires session)
//   PUT    /:id/contactos    set contacts      (requires session)
//   DELETE /:id/contactos/:contactoId  remove just one (requires session)
//   PUT    /:id/categorias   set categories (if the site has them)
//   DELETE /:id              soft delete       (requires session)
// Reads are public; every write goes through requiereEdicion.
// In the previous system 91 of 93 write endpoints were open without
// authentication: here permission is declared per route and closed is
// the default.

const SIN_DESCRIPCION = new Set(['declaracionTuristica']);

// Builds the zod accessibility block from the columns that actually
// exist in that table. Each boolean flag comes with its pair of
// descriptions in Spanish and English, except declaracionTuristica.
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

// Converts ubicacionId into the nested relation Prisma expects.
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
  // The site's own fields, without the accessibility ones.
  esquemaBase: z.ZodRawShape;
  // true if the table has a categories join table.
  tieneCategorias?: boolean;
  // true if the table has a contacts join table.
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

  // ---------------- Public reads ----------------

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

  // Sites related to this one, for the sidebar of the detail page.
  // ?take=3 by default.
  router.get(
    '/:id/relacionados',
    asyncHandler(async (req, res) => {
      const take = req.query.take === undefined ? 3 : leerId(req.query.take, 'take');
      res.json(await servicio.relacionados(leerId(req.params.id), take));
    }),
  );

  // ---------------- Writes ----------------

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
