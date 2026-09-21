import { prisma } from '../../db/prisma';
import { ACCESIBILIDAD_SIN_MASCOTAS, crearServicioSitio } from '../../lib/sitios';

// Operadores turísticos.
export const operadoresService = crearServicioSitio({
  delegado: prisma.operadoresTuristicos,
  etiqueta: 'Operador turístico',
  camposAccesibilidad: ACCESIBILIDAD_SIN_MASCOTAS,
  union: {
    contactos: {
      delegado: prisma.operadoresTuristicosContactos,
      campoPropio: 'operadoresTuristicosId',
      campoAjeno: 'contactosId',
      relacion: 'contacto',
    },
  },
});
