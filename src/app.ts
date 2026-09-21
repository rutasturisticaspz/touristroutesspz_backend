import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config } from './config';
import { errorHandler, noEncontradoHandler } from './middleware/errorHandler';
import { usuariosRouter } from './modules/usuarios/usuarios.routes';
import { categoriasRouter } from './modules/categorias/categorias.routes';
import { ubicacionesRouter } from './modules/ubicaciones/ubicaciones.routes';
import { contactosRouter } from './modules/contactos/contactos.routes';
import { mensajesRouter } from './modules/mensajes/mensajes.routes';
import { atraccionesRouter } from './modules/atracciones/atracciones.routes';
import { hotelesRouter } from './modules/hoteles/hoteles.routes';
import { restaurantesRouter } from './modules/restaurantes/restaurantes.routes';
import { oficinasRouter } from './modules/oficinas/oficinas.routes';
import { operadoresRouter } from './modules/operadores/operadores.routes';
import { rentadorasRouter } from './modules/rentadoras/rentadoras.routes';
import { eventosRouter } from './modules/eventos/eventos.routes';
import { imagenesRouter } from './modules/imagenes/imagenes.routes';
import { calificacionesRouter } from './modules/calificaciones/calificaciones.routes';
import { rutasRouter } from './modules/rutas/rutas.routes';

export function crearApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Imágenes servidas desde el disco local, sin depender de ningún
  // servicio externo de almacenamiento.
  app.use(
    config.uploads.rutaPublica,
    express.static(config.uploads.directorio, { fallthrough: true, maxAge: '1d' }),
  );

  app.get('/salud', (_req, res) => {
    res.json({ ok: true, entorno: config.entorno });
  });

  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/categorias', categoriasRouter);
  app.use('/api/ubicaciones', ubicacionesRouter);
  app.use('/api/contactos', contactosRouter);
  app.use('/api/mensajes', mensajesRouter);
  app.use('/api/atracciones', atraccionesRouter);
  app.use('/api/hoteles', hotelesRouter);
  app.use('/api/restaurantes', restaurantesRouter);
  app.use('/api/oficinas-turisticas', oficinasRouter);
  app.use('/api/operadores-turisticos', operadoresRouter);
  app.use('/api/rentadoras-vehiculos', rentadorasRouter);
  app.use('/api/eventos', eventosRouter);
  app.use('/api/imagenes', imagenesRouter);
  app.use('/api/calificaciones', calificacionesRouter);
  app.use('/api/rutas-turisticas', rutasRouter);

  app.use(noEncontradoHandler);
  app.use(errorHandler);

  return app;
}
