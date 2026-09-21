import { z } from 'zod';
import { crearRouterSitio } from '../../lib/rutasSitio';
import { operadoresService } from './operadores.service';

export const operadoresRouter = crearRouterSitio({
  servicio: operadoresService,
  esquemaBase: {
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    descripcionIngles: z.string().min(1),
  },
});
