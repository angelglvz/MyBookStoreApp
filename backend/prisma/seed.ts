import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const books = [
  {
    slug: 'cien-anos-de-soledad',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    description: 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
    priceCents: 1850,
    stock: 12,
    category: 'Novela',
  },
  {
    slug: 'don-quijote-de-la-mancha',
    title: 'El ingenioso hidalgo don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    description: 'Las aventuras de un hidalgo que pierde el juicio leyendo novelas de caballerías y sale a recorrer el mundo.',
    priceCents: 2200,
    stock: 8,
    category: 'Clásicos',
  },
  {
    slug: '1984',
    title: '1984',
    author: 'George Orwell',
    description: 'Una distopía sobre un régimen totalitario que vigila cada movimiento de sus ciudadanos.',
    priceCents: 1295,
    stock: 15,
    category: 'Ciencia ficción',
  },
  {
    slug: 'el-principito',
    title: 'El principito',
    author: 'Antoine de Saint-Exupéry',
    description: 'Un piloto varado en el desierto conoce a un pequeño príncipe que viene de otro planeta.',
    priceCents: 995,
    stock: 20,
    category: 'Infantil',
  },
  {
    slug: 'rayuela',
    title: 'Rayuela',
    author: 'Julio Cortázar',
    description: 'Una novela que puede leerse de forma lineal o saltando entre capítulos según indica el propio autor.',
    priceCents: 2100,
    stock: 5,
    category: 'Novela',
  },
  {
    slug: 'crimen-y-castigo',
    title: 'Crimen y castigo',
    author: 'Fiódor Dostoievski',
    description: 'Un estudiante de San Petersburgo planea un asesinato y debe enfrentarse después a su conciencia.',
    priceCents: 1700,
    stock: 7,
    category: 'Clásicos',
  },
  {
    slug: 'orgullo-y-prejuicio',
    title: 'Orgullo y prejuicio',
    author: 'Jane Austen',
    description: 'Elizabeth Bennet y el señor Darcy superan los prejuicios mutuos en la Inglaterra rural de principios del XIX.',
    priceCents: 1450,
    stock: 10,
    category: 'Clásicos',
  },
  {
    slug: 'fundacion',
    title: 'Fundación',
    author: 'Isaac Asimov',
    description: 'Un matemático predice la caída de un imperio galáctico y planea preservar el conocimiento humano.',
    priceCents: 1600,
    stock: 0,
    category: 'Ciencia ficción',
  },
];

async function main() {
  for (const book of books) {
    // update: {} evita sobrescribir el stock si el seed se ejecuta de nuevo
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: {},
      create: book,
    });
  }
  console.log(`✔ ${books.length} libros preparados`);

  const adminEmail = 'admin@bookstore.local';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrador',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✔ Usuario administrador preparado: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());