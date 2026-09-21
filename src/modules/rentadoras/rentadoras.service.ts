import { prisma } from '../../db/prisma';
import { ACCESIBILIDAD_SOLO_DISCAPACIDAD, crearServicioSitio } from '../../lib/sitios';

// Rentadoras de vehículos. Ojo: esta tabla es la única que no tiene
// la columna declaracionTuristica, así que su lista de accesibilidad
// es más corta que la de los demás sitios.
export const rentadorasService = crearServicioSitio({
  delegado: prisma.rentadorasVehiculos,
  etiqueta: 'Rentadora de vehículos',
  camposAccesibilidad: ACCESIBILIDAD_SOLO_DISCAPACIDAD,
  union: {
    contactos: {
      delegado: prisma.rentadorasVehiculosContactos,
      campoPropio: 'rentadorasVehiculosId',
      campoAjeno: 'contactosId',
      relacion: 'contacto',
    },
  },
});
