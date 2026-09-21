import { prisma } from '../../db/prisma';
import { ACCESIBILIDAD_COMPLETA, crearServicioSitio } from '../../lib/sitios';

// Restaurantes. Sin categorías propias en el modelo original.
export const restaurantesService = crearServicioSitio({
  delegado: prisma.restaurantes,
  etiqueta: 'Restaurante',
  camposAccesibilidad: ACCESIBILIDAD_COMPLETA,
  union: {
    contactos: {
      delegado: prisma.restaurantesContactos,
      campoPropio: 'restaurantesId',
      campoAjeno: 'contactosId',
      relacion: 'contacto',
    },
  },
});
