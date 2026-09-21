import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler';
import { leerId } from '../../lib/query';
import { solicitudInvalida } from '../../lib/errors';
import { requiereAdmin, requiereAutenticacion } from '../../middleware/auth';
import { Rol } from '../../types/roles';
import { usuariosService } from './usuarios.service';

export const usuariosRouter = Router();

const esquemaLogin = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const esquemaCrear = z.object({
  nombre: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.nativeEnum(Rol),
});

const esquemaActualizar = z.object({
  nombre: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const esquemaCambioContrasena = z.object({
  passwordActual: z.string().min(1),
  password: z.string().min(8),
  password2: z.string().min(1),
});

function validar<T>(esquema: z.ZodSchema<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    throw solicitudInvalida('Datos inválidos', resultado.error.flatten().fieldErrors);
  }
  return resultado.data;
}

// ---------- Público ----------

// Inicio de sesion del panel de administracion (ADMIN o MODERATOR).
usuariosRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validar(esquemaLogin, req.body);
    res.json(await usuariosService.iniciarSesion(email, password, true));
  }),
);

// Inicio de sesion para usuarios del sitio publico, sin exigir rol de
// panel. Es el /login del sistema anterior (el del panel era
// /loginAdmin). Lo usan calificaciones y rutas turisticas.
usuariosRouter.post(
  '/login-publico',
  asyncHandler(async (req, res) => {
    const { email, password } = validar(esquemaLogin, req.body);
    res.json(await usuariosService.iniciarSesion(email, password, false));
  }),
);

// ---------- Requiere sesión ----------

// Datos del usuario autenticado.
// Renueva el token de una sesion vigente, sin volver a pedir la clave.
usuariosRouter.post(
  '/renovar-token',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.renovarToken(req.usuario!.id));
  }),
);

// Busqueda por correo exacto. Requiere sesion: en el sistema anterior
//  era publica, lo que permitia averiguar que correos estan registrados.
usuariosRouter.get(
  '/buscar',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const { email } = validar(z.object({ email: z.string().email() }), req.query);
    res.json(await usuariosService.obtenerPorEmail(email));
  }),
);

usuariosRouter.get(
  '/yo',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.obtenerPorId(req.usuario!.id));
  }),
);

// Cambio de contraseña propia.
usuariosRouter.post(
  '/cambiar-contrasena',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaCambioContrasena, req.body);
    res.json(
      await usuariosService.cambiarContrasena(
        req.usuario!.id,
        datos.passwordActual,
        datos.password,
        datos.password2,
      ),
    );
  }),
);

// ---------- Sólo administradores ----------

usuariosRouter.get(
  '/',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.listar(req.query as Record<string, unknown>));
  }),
);

usuariosRouter.get(
  '/:id',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.obtenerPorId(leerId(req.params.id)));
  }),
);

usuariosRouter.post(
  '/',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    res.status(201).json(await usuariosService.crear(validar(esquemaCrear, req.body)));
  }),
);

// Alta de moderador con contrasena generada. Devuelve la contrasena
// temporal UNA vez, en la respuesta; no se manda ningun correo.
usuariosRouter.post(
  '/moderadores',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    const datos = validar(
      z.object({
        nombre: z.string().min(1),
        email: z.string().email(),
        rol: z.nativeEnum(Rol).optional(),
      }),
      req.body,
    );
    res.status(201).json(
      await usuariosService.crearConContrasenaGenerada({
        ...datos,
        rol: datos.rol ?? Rol.MODERADOR,
      }),
    );
  }),
);

usuariosRouter.put(
  '/:id',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaActualizar, req.body);
    res.json(await usuariosService.actualizar(leerId(req.params.id), datos));
  }),
);

usuariosRouter.put(
  '/:id/rol',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    const { rol } = validar(z.object({ rol: z.nativeEnum(Rol) }), req.body);
    const id = leerId(req.params.id);
    if (id === req.usuario!.id && rol !== Rol.ADMIN) {
      throw solicitudInvalida('No puede quitarse a si mismo el rol de administrador');
    }
    res.json(await usuariosService.cambiarRol(id, rol));
  }),
);

// Activa o desactiva una cuenta. Un administrador no puede desactivarse
// a si mismo: si es el ultimo, nadie mas podria volver a entrar.
usuariosRouter.put(
  '/:id/estado',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    const { activo } = validar(z.object({ activo: z.boolean() }), req.body);
    const id = leerId(req.params.id);
    if (!activo && id === req.usuario!.id) {
      throw solicitudInvalida('No puede desactivar su propia cuenta');
    }
    res.json(await usuariosService.cambiarEstado(id, activo));
  }),
);

// Elimina la cuenta de verdad (no solo la desactiva). Un administrador
// no puede eliminarse a si mismo, igual que no puede desactivarse.
usuariosRouter.delete(
  '/:id',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    const id = leerId(req.params.id);
    if (id === req.usuario!.id) {
      throw solicitudInvalida('No puede eliminar su propia cuenta');
    }
    res.json(await usuariosService.eliminar(id));
  }),
);
