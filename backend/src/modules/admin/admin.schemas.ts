import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

export const createBookSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  priceCents: z.number().int().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(100_000).default(0),
  category: z.string().trim().min(1).max(100),
  coverUrl: z.string().url().nullable().optional(),
});

export const updateBookSchema = createBookSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Indica al menos un campo para modificar',
  });

export const adminListQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;