import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { requiereEdicion } from '../../middleware/auth';
import { mapasService } from './mapas.service';

export const mapasRouter = Router();

const esquemaCrear = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  enlace: z.string().trim().min(1, 'El enlace es obligatorio').max(2048),
});

const esquemaActualizar = esquemaCrear.partial();

mapasRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await mapasService.listar());
  }),
);

mapasRouter.post(
  '/',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.status(201).json(await mapasService.crear(validar(esquemaCrear, req.body)));
  }),
);

mapasRouter.put(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(await mapasService.actualizar(req.params.id, datos));
  }),
);

mapasRouter.delete(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(await mapasService.eliminar(req.params.id));
  }),
);
