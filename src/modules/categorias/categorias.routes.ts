import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { leerId } from '../../lib/query';
import { solicitudInvalida } from '../../lib/errors';
import { requiereEdicion } from '../../middleware/auth';
import { categoriasService } from './categorias.service';

export const categoriasRouter = Router();

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  nombreIngles: z.string().min(1),
  descripcionIngles: z.string().min(1),
});
const esquemaActualizar = esquemaCrear.partial();

function validar<T>(esquema: z.ZodSchema<T>, datos: unknown): T {
  const r = esquema.safeParse(datos);
  if (!r.success) throw solicitudInvalida('Datos inválidos', r.error.flatten().fieldErrors);
  return r.data;
}

// --- Lectura pública ---
categoriasRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await categoriasService.listar(req.query as Record<string, unknown>));
  }),
);

categoriasRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await categoriasService.obtenerPorId(leerId(req.params.id)));
  }),
);

// --- Escritura: requiere sesión con permiso de edición ---
categoriasRouter.post(
  '/',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.status(201).json(await categoriasService.crear(validar(esquemaCrear, req.body)));
  }),
);

categoriasRouter.put(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(await categoriasService.actualizar(leerId(req.params.id), datos));
  }),
);

categoriasRouter.delete(
  '/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(await categoriasService.desactivar(leerId(req.params.id)));
  }),
);
