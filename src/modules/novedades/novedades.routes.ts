import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { novedadesService } from './novedades.service';

export const novedadesRouter = Router();

// ?nuevos=30: how many days back something counts as new (30 by default).
novedadesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await novedadesService.conteos(req.query as Record<string, unknown>));
  }),
);
