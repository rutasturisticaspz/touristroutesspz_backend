import { z } from 'zod';
import { crearRouterSitio } from '../../lib/rutasSitio';
import { rentadorasService } from './rentadoras.service';

export const rentadorasRouter = crearRouterSitio({
  servicio: rentadorasService,
  esquemaBase: {
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    descripcionIngles: z.string().min(1),
  },
});
