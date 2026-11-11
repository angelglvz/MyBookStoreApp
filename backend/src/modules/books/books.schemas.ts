import { z } from 'zod';

export const listBooksQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type ListBooksQuery = z.infer<typeof listBooksQuerySchema>;