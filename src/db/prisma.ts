import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Cliente único de Prisma. En desarrollo se reutiliza entre recargas
// para no abrir una conexión nueva en cada cambio de archivo.

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    // La URL se le pasa explícitamente en vez de dejar que Prisma lea
    // DATABASE_URL por su cuenta: así el backend usa exactamente las
    // mismas credenciales que el contenedor de MySQL, armadas en un
    // solo lugar.
    datasourceUrl: config.databaseUrl,
    log: config.entorno === 'development' ? ['warn', 'error'] : ['error'],
  });

if (config.entorno === 'development') {
  globalParaPrisma.prisma = prisma;
}

export async function conectarBaseDeDatos(): Promise<void> {
  await prisma.$connect();
}

export async function desconectarBaseDeDatos(): Promise<void> {
  await prisma.$disconnect();
}
