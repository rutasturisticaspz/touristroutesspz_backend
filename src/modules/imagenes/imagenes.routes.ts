import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import fs from 'node:fs';
import { config } from '../../config';
import { asyncHandler } from '../../lib/asyncHandler';
import { validar } from '../../lib/validar';
import { leerId } from '../../lib/query';
import { solicitudInvalida } from '../../lib/errors';
import { requiereEdicion } from '../../middleware/auth';
import {
  EXTENSIONES_PERMITIDAS,
  imagenesService,
  nombreDeArchivo,
  TIPOS_IMAGEN,
} from './imagenes.service';

export const imagenesRouter = Router();

// El directorio tiene que existir antes de que multer intente escribir.
fs.mkdirSync(config.uploads.directorio, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploads.directorio),
  filename: (req, file, cb) => {
    try {
      cb(null, nombreDeArchivo(leerId(req.params.idDueno, 'idDueno'), file.originalname));
    } catch (error) {
      cb(error as Error, '');
    }
  },
});

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: config.uploads.tamanoMaximoBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(solicitudInvalida('El archivo debe ser una imagen'));
    }
    cb(null, true);
  },
});

const esquemaTexto = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().nullable().optional(),
});

// ---------------- Lectura pública ----------------

// Los tipos de imagen que acepta el sistema. Debe ir antes de /:tipo.
imagenesRouter.get('/tipos', (_req, res) => {
  res.json(TIPOS_IMAGEN);
});

// GET /api/imagenes/hoteles?duenoId=12&skip=&take=
imagenesRouter.get(
  '/:tipo',
  asyncHandler(async (req, res) => {
    res.json(
      await imagenesService.listar(req.params.tipo, req.query as Record<string, unknown>),
    );
  }),
);

imagenesRouter.get(
  '/:tipo/:id',
  asyncHandler(async (req, res) => {
    res.json(await imagenesService.obtenerPorId(req.params.tipo, leerId(req.params.id)));
  }),
);

// ---------------- Escritura ----------------

// POST /api/imagenes/atracciones/21
// multipart/form-data con el campo "archivo", más "nombre" y
// "descripcion" opcionales.
// Reemplaza la subida a Firebase que hacía el panel: el archivo queda
// en el disco del servidor y la base guarda una ruta relativa.
imagenesRouter.post(
  '/:tipo/:idDueno',
  requiereEdicion,
  subida.single('archivo'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw solicitudInvalida('Falta el archivo (campo "archivo")');

    const idDueno = leerId(req.params.idDueno, 'idDueno');
    const datos = validar(esquemaTexto, req.body ?? {});

    const imagen = await imagenesService.registrar(req.params.tipo, idDueno, req.file, {
      nombre: datos.nombre ?? req.file.originalname,
      descripcion: datos.descripcion ?? '',
    });

    res.status(201).json(imagen);
  }),
);

imagenesRouter.put(
  '/:tipo/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    const datos = validar(esquemaTexto, req.body);
    res.json(await imagenesService.actualizar(req.params.tipo, leerId(req.params.id), datos));
  }),
);

imagenesRouter.delete(
  '/:tipo/:id',
  requiereEdicion,
  asyncHandler(async (req, res) => {
    res.json(await imagenesService.desactivar(req.params.tipo, leerId(req.params.id)));
  }),
);

export { EXTENSIONES_PERMITIDAS };
