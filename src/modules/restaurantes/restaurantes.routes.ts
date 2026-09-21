import { z } from 'zod';
import { crearRouterSitio } from '../../lib/rutasSitio';
import { restaurantesService } from './restaurantes.service';

export const restaurantesRouter = crearRouterSitio({
  servicio: restaurantesService,
  esquemaBase: {
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    descripcionIngles: z.string().min(1),
  },
});
