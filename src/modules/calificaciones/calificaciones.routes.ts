import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereAutenticacion } from '../../middleware/auth';
import { calificacionesService } from './calificaciones.service';

export const calificacionesRouter = Router();

const esquemaCrear = z.object({
  atraccionId: z.number().int().positive(),
  descripcion: z.string().nullable().optional(),
});

const esquemaActualizar = z.object({
  descripcion: z.string().nullable().optional(),
});

// GET /api/calificaciones?atraccionId=21
calificacionesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await calificacionesService.listar(req.query as Record<string, unknown>));
  }),
);

calificacionesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await calificacionesService.obtenerPorId(leerId(req.params.id)));
  }),
);

// Escribir una calificación sólo requiere sesión iniciada, no rol de
// panel: la idea es que la escriba el visitante, no el administrador.

calificacionesRouter.post(
  '/',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaCrear, req.body);
    res.status(201).json(await calificacionesService.crear(req.usuario!.id, datos));
  }),
);

calificacionesRouter.put(
  '/:id',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(
      await calificacionesService.actualizar(leerId(req.params.id), req.usuario!, datos),
    );
  }),
);

calificacionesRouter.delete(
  '/:id',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    res.json(await calificacionesService.desactivar(leerId(req.params.id), req.usuario!));
  }),
);
