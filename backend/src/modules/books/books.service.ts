import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import type { ListBooksQuery } from './books.schemas';

// Campos que se devuelven en el listado (sin la descripción, para no pesar)
const listSelect = {
  id: true,
  slug: true,
  title: true,
  author: true,
  priceCents: true,
  stock: true,
  category: true,
  coverUrl: true,
} as const;

// En el detalle añadimos la descripción
const detailSelect = {
  ...listSelect,
  description: true,
} as const;

export async function listBooks({ q, category, page, limit }: ListBooksQuery) {
  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { author: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(category ? { category } : {}),
  };

  // Ambas consultas en una transacción para que el total sea coherente con la página
  const [books, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      select: listSelect,
      orderBy: { title: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data: books,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBookBySlug(slug: string) {
  const book = await prisma.book.findUnique({
    where: { slug },
    select: detailSelect,
  });

  if (!book) {
    throw new AppError(404, 'Libro no encontrado');
  }

  return book;
}