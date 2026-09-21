import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereEdicion } from '../../middleware/auth';
import { atraccionesService } from './atracciones.service';

export const atraccionesRouter = Router();

const camposAccesibilidad = {
  declaracionTuristica: z.boolean().optional(),
  permitenMascotas: z.boolean().optional(),
  permitenNinos: z.boolean().optional(),
  discapacidadVisual: z.boolean().optional(),
  discapacidadAuditiva: z.boolean().optional(),
  discapacidadFisica: z.boolean().optional(),
  discapacidadCognitiva: z.boolean().optional(),
  discapacidadSicosocial: z.boolean().optional(),
  permitenMascotasDescripcion: z.string().nullable().optional(),
  permitenMascotasDescripcionIngles: z.string().nullable().optional(),
  permitenNinosDescripcion: z.string().nullable().optional(),
  permitenNinosDescripcionIngles: z.string().nullable().optional(),
  discapacidadVisualDescripcion: z.string().nullable().optional(),
  discapacidadVisualDescripcionIngles: z.string().nullable().optional(),
  discapacidadAuditivaDescripcion: z.string().nullable().optional(),
  discapacidadAuditivaDescripcionIngles: z.string().nullable().optional(),
  discapacidadFisicaDescripcion: z.string().nullable().optional(),
  discapacidadFisicaDescripcionIngles: z.string().nullable().optional(),
  discapacidadCognitivaDescripcion: z.string().nullable().optional(),
  discapacidadCognitivaDescripcionIngles: z.string().nullable().optional(),
  discapacidadSicosocialDescripcion: z.string().nullable().optional(),
  discapacidadSicosocialDescripcionIngles: z.string().nullable().optional(),
};

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  descripcionIngles: z.string().min(1),
  ubicacionId: z.number().int().positive().optional(),
  ...camposAccesibilidad,
});

const esquemaActualizar = esquemaCrear.partial();
const esquemaIds = z.object({ ids: z.array(z.number().int().positive()) });

// Convierte ubicacionId en la relación que espera Prisma.
function prepararDatos(datos: Record<string, unknown>) {
  const { ubicacionId, ...resto } = datos;
  return {
    ...resto,
    ...(ubicacionId !== undefined
      ? { ubicacion: { connect: { id: ubicacionId as number } } }
      : {}),
  };
}

// ---------------- Lectura pública ----------------

// Conteo global por tipo de sitio. Debe ir antes de /:id.
atraccionesRouter.get(
  '/conteo',
  asyncHandler(async (_req, res) => {
    res.json(await atraccionesService.conteoGlobal());
  }),
);

// Sólo las que tienen imágenes.
atraccionesRouter.get(
  '/con-imagenes',
  asyncHandler(async (req, res) => {
    res.json(await atraccionesService.conImagenes(req.query as Record<string, unknown>));
  }),
);

// Listado con todos los filtros combinables:
//   ?filtro=texto
//   ?provincia=&canton=&distrito=
//   ?categorias=Cataratas,Montaña
//   ?accesibilidad=permitenNinos,discapacidadFisica
//   ?skip=&take=&ordenarPor=&direccion=
atraccionesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await atraccionesService.listar(req.query as Record<string, unknown>));
  }),
);

atraccionesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await atraccionesService.obtenerPorId(leerId(req.params.id)));
  }),
);

// Atracciones parecidas, para la barra lateral del detalle.
atraccionesRouter.get(
  '/:id/relacionados',
  asyncHandler(async (req, res) => {
    const take = req.query.take === undefined ? 3 : leerId(req.query.take, 'take');
    res.json(await atraccionesService.relacionados(leerId(req.params.id), take));
  }),
);

// ---------------- Escritura ----------------

atraccionesRouter.post(
  '/',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaCrear, req.body);
    res.status(201).json(await atraccionesService.crear(prepararDatos(datos) as never));
  }),
);

atraccionesRouter.put(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(
      await atraccionesService.actualizar(leerId(req.params.id), prepararDatos(datos) as never),
    );
  }),
);

atraccionesRouter.put(
  '/:id/categorias',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const { ids } = validar(esquemaIds, req.body);
    res.json(await atraccionesService.definirCategorias(leerId(req.params.id), ids));
  }),
);

atraccionesRouter.put(
  '/:id/contactos',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const { ids } = validar(esquemaIds, req.body);
    res.json(await atraccionesService.definirContactos(leerId(req.params.id), ids));
  }),
);

atraccionesRouter.delete(
  '/:id/contactos/:contactoId',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(
      await atraccionesService.quitarContacto(
        leerId(req.params.id),
        leerId(req.params.contactoId, 'contactoId'),
      ),
    );
  }),
);

atraccionesRouter.delete(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(await atraccionesService.desactivar(leerId(req.params.id)));
  }),
);
