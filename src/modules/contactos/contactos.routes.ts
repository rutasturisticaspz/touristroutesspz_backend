import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereEdicion } from '../../middleware/auth';
import { contactosService } from './contactos.service';

export const contactosRouter = Router();

const esquemaCrear = z.object({
  valor: z.string().min(1),
  tipo: z.string().min(1),
});

contactosRouter.get('/', asyncHandler(async (req, res) => {
  res.json(await contactosService.listar(req.query as Record<string, unknown>));
}));

contactosRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await contactosService.obtenerPorId(leerId(req.params.id)));
}));

contactosRouter.post('/', requiereEdicion, asyncHandler(async (req, res) => {
  res.status(201).json(await contactosService.crear(validar(esquemaCrear, req.body)));
}));

contactosRouter.put('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await contactosService.actualizar(leerId(req.params.id), validar(esquemaCrear.partial(), req.body)));
}));

contactosRouter.delete('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await contactosService.desactivar(leerId(req.params.id)));
}));
