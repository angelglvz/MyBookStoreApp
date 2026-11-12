import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import type { AddItemInput, MergeCartInput } from './cart.schemas';

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      book: {
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          priceCents: true,
          stock: true,
          coverUrl: true,
        },
      },
    },
  });

  const lines = items.map((item) => ({
    bookId: item.bookId,
    quantity: item.quantity,
    book: item.book,
    subtotalCents: item.book.priceCents * item.quantity,
    // Aviso para el frontend; el checkout vuelve a comprobarlo
    available: item.book.stock >= item.quantity,
  }));

  const totalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);

  return { items: lines, totalCents };
}

export async function addItem(userId: string, input: AddItemInput) {
  const book = await prisma.book.findUnique({ where: { id: input.bookId } });
  if (!book) {
    throw new AppError(404, 'Libro no encontrado');
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_bookId: { userId, bookId: book.id } },
  });

  const newQuantity = (existing?.quantity ?? 0) + input.quantity;
  if (newQuantity > book.stock) {
    throw new AppError(409, `Stock insuficiente (disponible: ${book.stock})`);
  }

  await prisma.cartItem.upsert({
    where: { userId_bookId: { userId, bookId: book.id } },
    update: { quantity: newQuantity },
    create: { userId, bookId: book.id, quantity: newQuantity },
  });

  return getCart(userId);
}

export async function updateQuantity(userId: string, bookId: string, quantity: number) {
  const item = await prisma.cartItem.findUnique({
    where: { userId_bookId: { userId, bookId } },
    include: { book: { select: { stock: true } } },
  });
  if (!item) {
    throw new AppError(404, 'El libro no está en el carrito');
  }

  if (quantity > item.book.stock) {
    throw new AppError(409, `Stock insuficiente (disponible: ${item.book.stock})`);
  }

  await prisma.cartItem.update({
    where: { userId_bookId: { userId, bookId } },
    data: { quantity },
  });

  return getCart(userId);
}

export async function removeItem(userId: string, bookId: string) {
  const result = await prisma.cartItem.deleteMany({ where: { userId, bookId } });
  if (result.count === 0) {
    throw new AppError(404, 'El libro no está en el carrito');
  }
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return getCart(userId);
}

export async function mergeGuestCart(userId: string, input: MergeCartInput) {
  // Sumar cantidades repetidas del mismo libro
  const incoming = new Map<string, number>();
  for (const item of input.items) {
    incoming.set(item.bookId, (incoming.get(item.bookId) ?? 0) + item.quantity);
  }

  const books = await prisma.book.findMany({
    where: { id: { in: [...incoming.keys()] } },
    select: { id: true, stock: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const book of books) {
      const existing = await tx.cartItem.findUnique({
        where: { userId_bookId: { userId, bookId: book.id } },
      });

      // Se limita al stock; los libros sin stock o inexistentes se omiten
      const quantity = Math.min(
        (existing?.quantity ?? 0) + (incoming.get(book.id) ?? 0),
        book.stock,
      );
      if (quantity <= 0) continue;

      await tx.cartItem.upsert({
        where: { userId_bookId: { userId, bookId: book.id } },
        update: { quantity },
        create: { userId, bookId: book.id, quantity },
      });
    }
  });

  return getCart(userId);
}