import { z } from 'zod';
import { crearRouterSitio } from '../../lib/rutasSitio';
import { oficinasService } from './oficinas.service';

export const oficinasRouter = crearRouterSitio({
  servicio: oficinasService,
  esquemaBase: {
    nombre: z.string().min(1),
    nombreEncargado: z.string().min(1),
    descripcion: z.string().min(1),
    descripcionIngles: z.string().min(1),
  },
});
