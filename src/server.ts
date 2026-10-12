import { config } from './config';
import { crearApp } from './app';
import { conectarBaseDeDatos, desconectarBaseDeDatos } from './db/prisma';

// Entry point.
// Unlike the previous version, the server does NOT start listening
// until the database responds. Before, "listening" was announced and
// then the connection failed, leaving the process accepting requests
// it could not serve.
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
