import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereEdicion } from '../../middleware/auth';
import { prepararDatos } from '../../lib/rutasSitio';
import { eventosService, TIPOS_VINCULO } from './eventos.service';

export const eventosRouter = Router();

// Acepta ISO 8601; se convierte a Date antes de llegar a Prisma.
const fecha = z.coerce.date().nullable().optional();

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  nombreIngles: z.string().min(1),
  descripcion: z.string().min(1),
  descripcionIngles: z.string().min(1),
  ubicacionId: z.number().int().positive().optional(),
  fechaInicio: fecha,
  fechaFin: fecha,
  mostrarFechaInicio: fecha,
  mostrarFechaFin: fecha,
});

const esquemaActualizar = esquemaCrear.partial();
const esquemaIds = z.object({ ids: z.array(z.number().int().positive()) });

// ---------------- Lectura pública ----------------

// Los tipos de sitio a los que se puede vincular un evento.
eventosRouter.get('/tipos-vinculo', (_req, res) => {
  res.json(TIPOS_VINCULO);
});

eventosRouter.get(
  '/con-imagenes',
  asyncHandler(async (req, res) => {
    res.json(await eventosService.conImagenes(req.query as Record<string, unknown>));
  }),
);

// ?filtro= ?provincia= ?canton= ?distrito= ?vigentes=true ?skip= ?take=
eventosRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await eventosService.listar(req.query as Record<string, unknown>));
  }),
);

eventosRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await eventosService.obtenerPorId(leerId(req.params.id)));
  }),
);

// ---------------- Escritura ----------------

eventosRouter.post(
  '/',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaCrear, req.body);
    res.status(201).json(await eventosService.crear(prepararDatos(datos)));
  }),
);

eventosRouter.put(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(await eventosService.actualizar(leerId(req.params.id), prepararDatos(datos)));
  }),
);

eventosRouter.put(
  '/:id/contactos',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const { ids } = validar(esquemaIds, req.body);
    res.json(await eventosService.definirContactos(leerId(req.params.id), ids));
  }),
);

// PUT /api/eventos/12/vinculos/hoteles  { "ids": [1,2,3] }
eventosRouter.put(
  '/:id/vinculos/:tipo',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const { ids } = validar(esquemaIds, req.body);
    res.json(await eventosService.definirVinculos(leerId(req.params.id), req.params.tipo, ids));
  }),
);

eventosRouter.delete(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(await eventosService.desactivar(leerId(req.params.id)));
  }),
);
