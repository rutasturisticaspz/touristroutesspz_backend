import { prisma } from '../../db/prisma';
import {
  ACCESIBILIDAD_COMPLETA,
  crearServicioSitio,
} from '../../lib/sitios';

// Hotels. It is the only site besides attractions that has its own
// categories.
export const hotelesService = crearServicioSitio({
  delegado: prisma.hoteles,
  etiqueta: 'Hotel',
  camposAccesibilidad: ACCESIBILIDAD_COMPLETA,
  union: {
    categorias: {
      delegado: prisma.hotelesCategorias,
      campoPropio: 'hotelesId',
      campoAjeno: 'categoriasId',
      relacion: 'categoria',
    },
    contactos: {
      delegado: prisma.hotelesContactos,
      campoPropio: 'hotelesId',
      campoAjeno: 'contactosId',
      relacion: 'contacto',
    },
  },
});
