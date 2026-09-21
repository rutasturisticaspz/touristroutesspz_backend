import { z } from 'zod';
import { solicitudInvalida } from './errors';

// Valida el cuerpo de la petición y devuelve los datos ya tipados.
export function validar<T>(esquema: z.ZodSchema<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    throw solicitudInvalida('Datos inválidos', resultado.error.flatten().fieldErrors);
  }
  return resultado.data;
}
