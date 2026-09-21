import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

/**
 * Datos de prueba para desarrollo local.
 *
 * Son datos inventados, no los reales del sitio. Sirven para tener algo
 * con qué probar los endpoints y para poder entrar al panel.
 *
 *     npm run db:seed
 */

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@local.test';
const ADMIN_PASSWORD = 'Admin12345';

async function main() {
  console.log('Cargando datos de prueba...\n');

  // ---- Usuario administrador ----
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existente = await prisma.usuarios.findFirst({ where: { email: ADMIN_EMAIL } });

  if (existente) {
    await prisma.usuarios.update({
      where: { id: existente.id },
      data: { password: hash, rol: 'ADMIN', state: 'Active' },
    });
    console.log('Administrador actualizado');
  } else {
    await prisma.usuarios.create({
      data: {
        nombre: 'Administrador Local',
        email: ADMIN_EMAIL,
        password: hash,
        rol: 'ADMIN',
        state: 'Active',
      },
    });
    console.log('Administrador creado');
  }

  // ---- Categorías ----
  const nombresCategorias = [
    { nombre: 'Cataratas', ingles: 'Waterfalls' },
    { nombre: 'Montaña', ingles: 'Mountain' },
    { nombre: 'Aventura', ingles: 'Adventure' },
    { nombre: 'Cultural', ingles: 'Cultural' },
  ];

  const categorias = [];
  for (const c of nombresCategorias) {
    const ya = await prisma.categorias.findFirst({ where: { nombre: c.nombre } });
    categorias.push(
      ya ??
        (await prisma.categorias.create({
          data: {
            nombre: c.nombre,
            descripcion: `Sitios de tipo ${c.nombre.toLowerCase()}`,
            nombreIngles: c.ingles,
            descripcionIngles: `${c.ingles} places`,
            state: 'Active',
          },
        })),
    );
  }
  console.log(`Categorías: ${categorias.length}`);

  // ---- Ubicación ----
  let ubicacion = await prisma.ubicaciones.findFirst({
    where: { distrito: 'San Isidro de El General' },
  });
  ubicacion ??= await prisma.ubicaciones.create({
    data: {
      provincia: 'San José',
      canton: 'Pérez Zeledón',
      distrito: 'San Isidro de El General',
      detalle: 'Centro de la ciudad',
      latitud: '9.3752',
      longitud: '-83.7003',
      state: 'Active',
    },
  });
  console.log('Ubicación lista');

  // ---- Contacto ----
  let contacto = await prisma.contactos.findFirst({ where: { valor: '2771-0000' } });
  contacto ??= await prisma.contactos.create({
    data: { valor: '2771-0000', tipo: 'telefono', state: 'Active' },
  });

  // ---- Atracciones ----
  const atracciones = [
    {
      nombre: 'Catarata de prueba',
      descripcion: 'Una catarata de ejemplo para desarrollo.',
      descripcionIngles: 'A sample waterfall for development.',
      declaracionTuristica: true,
      permitenNinos: true,
    },
    {
      nombre: 'Cerro de prueba',
      descripcion: 'Un cerro de ejemplo para desarrollo.',
      descripcionIngles: 'A sample hill for development.',
      declaracionTuristica: false,
      permitenMascotas: true,
    },
  ];

  let creadas = 0;
  for (const a of atracciones) {
    const ya = await prisma.atracciones.findFirst({ where: { nombre: a.nombre } });
    if (ya) continue;

    await prisma.atracciones.create({
      data: {
        ...a,
        state: 'Active',
        ubicacionId: ubicacion.id,
        categorias: { create: [{ categoriasId: categorias[0].id }] },
        contactos: { create: [{ contactosId: contacto.id }] },
        imagenes: {
          create: [
            {
              nombre: 'Imagen de ejemplo',
              descripcion: 'Marcador de posición',
              url: '/uploads/ejemplo.jpg',
              nameUrl: 'ejemplo.jpg',
              state: 'Active',
            },
          ],
        },
      },
    });
    creadas++;
  }
  console.log(`Atracciones nuevas: ${creadas}`);

  console.log('\n--------------------------------------------');
  console.log('  Listo. Para entrar al panel:');
  console.log(`     correo:     ${ADMIN_EMAIL}`);
  console.log(`     contraseña: ${ADMIN_PASSWORD}`);
  console.log('--------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Falló el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
