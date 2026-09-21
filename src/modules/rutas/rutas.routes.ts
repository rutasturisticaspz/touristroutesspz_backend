import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereAutenticacion } from '../../middleware/auth';
import { rutasService } from './rutas.service';

export const rutasRouter = Router();

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  atraccionIds: z.array(z.number().int().positive()).optional(),
});

const esquemaActualizar = z.object({ nombre: z.string().min(1).optional() });
const esquemaIds = z.object({ ids: z.array(z.number().int().positive()) });

// GET /api/rutas-turisticas?usuarioId=3
rutasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await rutasService.listar(req.query as Record<string, unknown>));
  }),
);

rutasRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await rutasService.obtenerPorId(leerId(req.params.id)));
  }),
);

rutasRouter.post(
  '/',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaCrear, req.body);
    res.status(201).json(await rutasService.crear(req.usuario!.id, datos));
  }),
);

rutasRouter.put(
  '/:id',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(await rutasService.actualizar(leerId(req.params.id), req.usuario!, datos));
  }),
);

rutasRouter.put(
  '/:id/atracciones',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const { ids } = validar(esquemaIds, req.body);
    res.json(await rutasService.definirAtracciones(leerId(req.params.id), req.usuario!, ids));
  }),
);

rutasRouter.delete(
  '/:id',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    res.json(await rutasService.desactivar(leerId(req.params.id), req.usuario!));
  }),
);
