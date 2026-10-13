import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { requiereEdicion } from '../../middleware/auth';
import { mensajesService } from './mensajes.service';

export const mensajesRouter = Router();

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  correo: z.string().email(),
  asunto: z.string().min(1),
  mensaje: z.string().min(1),
});

// Public submission of the contact form.
// It is the only open write in the system, and that is intentional.
mensajesRouter.post('/', asyncHandler(async (req, res) => {
  await mensajesService.crear(validar(esquemaCrear, req.body));
  res.status(201).json({ ok: true, mensaje: 'Mensaje enviado' });
}));

// Reading and managing messages does require a session.
mensajesRouter.get('/', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await mensajesService.listar(req.query as Record<string, unknown>));
}));

mensajesRouter.get('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await mensajesService.obtenerPorId(leerId(req.params.id)));
}));

mensajesRouter.put('/:id/estado', requiereEdicion, asyncHandler(async (req, res) => {
  const { estado } = validar(z.object({ estado: z.string().min(1) }), req.body);
  res.json(await mensajesService.cambiarEstado(leerId(req.params.id), estado));
}));

mensajesRouter.delete('/:id', requiereEdicion, asyncHandler(async (req, res) => {
  res.json(await mensajesService.desactivar(leerId(req.params.id)));
}));

// Actually replies by email (SMTP), see mensajesService.responder.
mensajesRouter.post('/:id/responder', requiereEdicion, asyncHandler(async (req, res) => {
  const { cuerpo } = validar(z.object({ cuerpo: z.string().min(1) }), req.body);
  res.json(await mensajesService.responder(leerId(req.params.id), cuerpo));
}));
