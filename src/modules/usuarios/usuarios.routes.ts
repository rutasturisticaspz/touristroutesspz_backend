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

const forgotSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
});

const linkSchema = z.object({
  token: z.string().min(1, 'Falta el enlace'),
});

// bcrypt only reads the first 72 bytes, so longer passwords would be
// silently cut: better to refuse them.
const newPasswordSchema = linkSchema.extend({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede pasar de 72 caracteres'),
});

function validar<T>(esquema: z.ZodSchema<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    throw solicitudInvalida('Datos inválidos', resultado.error.flatten().fieldErrors);
  }
  return resultado.data;
}

// ---------- Public ----------

// Sign-in for the administration panel (ADMIN or MODERATOR).
usuariosRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = validar(esquemaLogin, req.body);
    res.json(await usuariosService.iniciarSesion(email, password, true));
  }),
);

// Sign-in for users of the public site, without requiring a panel
// role. It is the previous system's /login (the panel's was
// /loginAdmin). Used by ratings and tourist routes.
usuariosRouter.post(
  '/login-publico',
  asyncHandler(async (req, res) => {
    const { email, password } = validar(esquemaLogin, req.body);
    res.json(await usuariosService.iniciarSesion(email, password, false));
  }),
);

// "Forgot my password": sends a link to the email if it belongs to an
// active account. It always answers the same.
usuariosRouter.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = validar(forgotSchema, req.body);
    await usuariosService.requestPasswordReset(email);
    res.json({
      ok: true,
      message: 'Si el correo está registrado, te va a llegar un enlace para cambiar la contraseña.',
    });
  }),
);

// Checks that a password link still works.
usuariosRouter.post(
  '/validate-link',
  asyncHandler(async (req, res) => {
    const { token } = validar(linkSchema, req.body);
    res.json(await usuariosService.validateLink(token));
  }),
);

// Chooses the new password using the link received by email.
usuariosRouter.post(
  '/reset-with-link',
  asyncHandler(async (req, res) => {
    const { token, password } = validar(newPasswordSchema, req.body);
    res.json(await usuariosService.resetWithLink(token, password));
  }),
);

// ---------- Requires a session ----------

// Data of the authenticated user.
// Renews the token of a valid session, without asking for the
// password again.
usuariosRouter.post(
  '/renovar-token',
  requiereAutenticacion,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.renovarToken(req.usuario!.id));
  }),
);

// Search by exact email. Requires a session: in the previous system
// it was public, which allowed finding out which emails are
// registered.
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

// Change of one's own password.
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

// ---------- Administrators only ----------

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

// Creation of an account without a password: the person receives a link
// by email to choose theirs. `emailSent` says whether it went out.
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
      await usuariosService.invite({
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

// Sends the account a link to choose a new password.
usuariosRouter.post(
  '/:id/restablecer-contrasena',
  requiereAdmin,
  asyncHandler(async (req, res) => {
    res.json(await usuariosService.sendPasswordReset(leerId(req.params.id)));
  }),
);

// Activates or deactivates an account. An administrator cannot
// deactivate themselves: if they are the last one, nobody else could
// sign in again.
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

// Actually deletes the account (it does not just deactivate it). An
// administrator cannot delete themselves, just as they cannot
// deactivate themselves.
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
