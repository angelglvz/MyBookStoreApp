import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { slugify } from '../../utils/slugify';
import type {
  AdminListQuery,
  CreateBookInput,
  UpdateBookInput,
} from './admin.schemas';

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string }).code === 'P2002';
}

export async function listBooks({ q, page, limit }: AdminListQuery) {
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { author: { contains: q, mode: 'insensitive' as const } },
          { slug: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  const [data, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function createBook(input: CreateBookInput) {
  const slug = input.slug ?? slugify(input.title);
  if (!slug) {
    throw new AppError(400, 'No se puede generar el slug; indícalo en el campo slug');
  }

  try {
    return await prisma.book.create({
      data: { ...input, slug, coverUrl: input.coverUrl ?? null },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, `Ya existe un libro con el slug "${slug}"`);
    }
    throw err;
  }
}

export async function updateBook(id: string, input: UpdateBookInput) {
  const exists = await prisma.book.findUnique({ where: { id }, select: { id: true } });
  if (!exists) {
    throw new AppError(404, 'Libro no encontrado');
  }

  try {
    return await prisma.book.update({ where: { id }, data: input });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AppError(409, `Ya existe un libro con el slug "${input.slug}"`);
    }
    throw err;
  }
}

export async function deleteBook(id: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    select: { id: true, _count: { select: { orderItems: true } } },
  });
  if (!book) {
    throw new AppError(404, 'Libro no encontrado');
  }

  if (book._count.orderItems > 0) {
    throw new AppError(
      409,
      'El libro tiene pedidos asociados y no se puede borrar. Pon su stock a 0 en su lugar',
    );
  }

  await prisma.book.delete({ where: { id } });
  return { deleted: true };
}