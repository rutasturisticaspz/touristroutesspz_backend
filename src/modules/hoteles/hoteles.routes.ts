import { z } from 'zod';
import { crearRouterSitio } from '../../lib/rutasSitio';
import { hotelesService } from './hoteles.service';

export const hotelesRouter = crearRouterSitio({
  servicio: hotelesService,
  esquemaBase: {
    nombre: z.string().min(1),
    descripcion: z.string().min(1),
    descripcionIngles: z.string().min(1),
  },
  tieneCategorias: true,
});
