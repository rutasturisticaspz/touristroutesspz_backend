import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

/**
 * Migración de imágenes: de Firebase Storage a disco local.
 *
 * Las 7 tablas de imágenes guardan en `url` un enlace de descarga de
 * Firebase. Este script lo reemplaza por una ruta relativa que sirve
 * el propio backend, para que el sistema deje de depender de Firebase.
 *
 * Se usa `nameUrl` (el nombre del archivo) para emparejar cada registro
 * con su archivo en la carpeta uploads.
 *
 * Uso:
 *     npx tsx prisma/migrar-imagenes.ts            # simulacro, no cambia nada
 *     npx tsx prisma/migrar-imagenes.ts --aplicar  # ejecuta los cambios
 */

const prisma = new PrismaClient();
const APLICAR = process.argv.includes('--aplicar');
const DIR_UPLOADS = path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? 'uploads');
const PREFIJO = '/uploads/';

const TABLAS = [
  { nombre: 'imagenes', modelo: 'imagenes' },
  { nombre: 'imagenes_hoteles', modelo: 'imagenesHoteles' },
  { nombre: 'imagenes_restaurantes', modelo: 'imagenesRestaurantes' },
  { nombre: 'imagenes_operadores_turisticos', modelo: 'imagenesOperadoresTuristicos' },
  { nombre: 'imagenes_oficinas_turisticas', modelo: 'imagenesOficinasTuristicas' },
  { nombre: 'imagenes_eventos', modelo: 'imagenesEventos' },
  { nombre: 'imagenes_rentadoras_vehiculos', modelo: 'imagenesRentadorasVehiculos' },
] as const;

async function main() {
  if (!fs.existsSync(DIR_UPLOADS)) {
    console.error(`No existe la carpeta ${DIR_UPLOADS}`);
    console.error('Extraiga primero las imágenes del respaldo.');
    process.exit(1);
  }

  const archivos = new Set(fs.readdirSync(DIR_UPLOADS));
  console.log(`Archivos en uploads: ${archivos.size}`);
  console.log(APLICAR ? 'MODO: aplicando cambios\n' : 'MODO: simulacro (no cambia nada)\n');

  let totalActualizables = 0;
  let totalSinArchivo = 0;
  let totalYaMigrados = 0;
  const sinArchivo: string[] = [];

  for (const { nombre, modelo } of TABLAS) {
    const repo = (prisma as any)[modelo];
    const registros = await repo.findMany({ select: { id: true, url: true, nameUrl: true } });

    let actualizables = 0;
    let faltantes = 0;
    let yaMigrados = 0;

    for (const reg of registros) {
      const archivo = (reg.nameUrl ?? '').trim();

      if (reg.url?.startsWith(PREFIJO)) {
        yaMigrados++;
        continue;
      }

      if (!archivo || !archivos.has(archivo)) {
        faltantes++;
        sinArchivo.push(`${nombre}#${reg.id}  ${archivo || '(sin nameUrl)'}`);
        continue;
      }

      actualizables++;
      if (APLICAR) {
        await repo.update({
          where: { id: reg.id },
          data: { url: PREFIJO + archivo },
        });
      }
    }

    console.log(
      `${nombre.padEnd(32)} total ${String(registros.length).padStart(4)} | ` +
        `a migrar ${String(actualizables).padStart(4)} | ` +
        `sin archivo ${String(faltantes).padStart(3)} | ` +
        `ya migradas ${String(yaMigrados).padStart(4)}`,
    );

    totalActualizables += actualizables;
    totalSinArchivo += faltantes;
    totalYaMigrados += yaMigrados;
  }

  console.log('\n----------------------------------------------');
  console.log(`  A migrar:     ${totalActualizables}`);
  console.log(`  Sin archivo:  ${totalSinArchivo}`);
  console.log(`  Ya migradas:  ${totalYaMigrados}`);
  console.log('----------------------------------------------');

  if (sinArchivo.length > 0) {
    console.log('\nRegistros que quedan sin imagen:');
    sinArchivo.forEach((l) => console.log('  ' + l));
    console.log('\nEstos registros conservan su URL de Firebase. Decida si se');
    console.log('les consigue la imagen, se reemplaza, o se desactivan.');
  }

  if (!APLICAR && totalActualizables > 0) {
    console.log('\nEsto fue un simulacro. Para aplicarlo de verdad:');
    console.log('    npx tsx prisma/migrar-imagenes.ts --aplicar');
  }
}

main()
  .catch((e) => {
    console.error('Falló la migración:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
