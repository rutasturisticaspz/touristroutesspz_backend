import { prisma } from '../../db/prisma';
import { ACCESIBILIDAD_SIN_MASCOTAS, crearServicioSitio } from '../../lib/sitios';

// Oficinas turísticas. La tabla no tiene permitenMascotas ni
// permitenNinos, y sí tiene nombreEncargado.
export const oficinasService = crearServicioSitio({
  delegado: prisma.oficinasTuristicas,
  etiqueta: 'Oficina turística',
  camposTexto: ['nombre', 'nombreEncargado', 'descripcion', 'descripcionIngles'],
  camposAccesibilidad: ACCESIBILIDAD_SIN_MASCOTAS,
  union: {
    contactos: {
      delegado: prisma.oficinasTuristicasContactos,
      campoPropio: 'oficinasTuristicasId',
      campoAjeno: 'contactosId',
      relacion: 'contacto',
    },
  },
});
