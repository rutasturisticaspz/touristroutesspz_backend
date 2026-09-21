import { config } from './config';
import { crearApp } from './app';
import { conectarBaseDeDatos, desconectarBaseDeDatos } from './db/prisma';

// Punto de entrada.
// A diferencia de la versión anterior, el servidor NO empieza a
// escuchar hasta que la base de datos responde. Antes se anunciaba
// "listening" y después fallaba la conexión, dejando el proceso
// aceptando peticiones que no podía atender.
async function iniciar(): Promise<void> {
  try {
    await conectarBaseDeDatos();
    console.log('Base de datos conectada');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const app = crearApp();

  const servidor = app.listen(config.puerto, () => {
    console.log(`API escuchando en http://localhost:${config.puerto}`);
    console.log(`Salud: http://localhost:${config.puerto}/salud`);
  });

  const apagar = async (senal: string) => {
    console.log(`\n${senal} recibido, cerrando...`);
    servidor.close(async () => {
      await desconectarBaseDeDatos();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void apagar('SIGINT'));
  process.on('SIGTERM', () => void apagar('SIGTERM'));
}

void iniciar();
