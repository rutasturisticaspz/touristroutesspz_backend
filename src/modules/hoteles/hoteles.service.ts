import { prisma } from '../../db/prisma';
import {
  ACCESIBILIDAD_COMPLETA,
  crearServicioSitio,
} from '../../lib/sitios';

// Hoteles. Es el único sitio además de atracciones que tiene
// categorías propias.
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
