import { PrismaClient } from '@prisma/client';
import { config } from '../config';

// Single Prisma client. In development it is reused across reloads so
// a new connection is not opened on every file change.

const globalParaPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    // The URL is passed explicitly instead of letting Prisma read
    // DATABASE_URL on its own: this way the backend uses exactly the same
    // credentials as the MySQL container, built in a single place.
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
