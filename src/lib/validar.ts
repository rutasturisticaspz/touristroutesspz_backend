import { z } from 'zod';
import { solicitudInvalida } from './errors';

// Validates the request body and returns the data already typed.
export function validar<T>(esquema: z.ZodSchema<T>, datos: unknown): T {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    throw solicitudInvalida('Datos inválidos', resultado.error.flatten().fieldErrors);
  }
  return resultado.data;
}
