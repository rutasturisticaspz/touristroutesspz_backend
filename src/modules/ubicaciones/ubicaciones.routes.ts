import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereEdicion } from '../../middleware/auth';
import { ubicacionesService } from './ubicaciones.service';

export const ubicacionesRouter = Router();

const esquemaCrear = z.object({
  provincia: z.string().min(1),
  canton: z.string().min(1),
  distrito: z.string().min(1),
  detalle: z.string().min(1),
  latitud: z.string().min(1),
  longitud: z.string().min(1),
});

ubicacionesRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await ubicacionesService.listar(req.query as Record<string, unknown>));
}));

ubicacionesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await ubicacionesService.obtenerPorId(leerId(req.params.id)));
}));

ubicacionesRouter.post('/', requiereEdicion, asyncHandler(async (req, res) => {
  res.status(201).json(await ubicacionesService.crear(validar(esquemaCrear, req.body)));
}));

ubicacionesRouter.put('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await ubicacionesService.actualizar(leerId(req.params.id), validar(esquemaCrear.partial(), req.body)));
}));

ubicacionesRouter.delete('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await ubicacionesService.desactivar(leerId(req.params.id)));
}));
