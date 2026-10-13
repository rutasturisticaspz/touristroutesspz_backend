import { prisma } from '../../db/prisma';
import { ACCESIBILIDAD_SOLO_DISCAPACIDAD, crearServicioSitio } from '../../lib/sitios';

// Vehicle rental companies. Note: this table is the only one without
// the declaracionTuristica column, so its accessibility list is
// shorter than that of the other sites.
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
