import { z } from 'zod';

const quantity = z.number().int().min(1).max(99);

export const addItemSchema = z.object({
  bookId: z.string().min(1),
  quantity: quantity.default(1),
});

export const updateQuantitySchema = z.object({
  quantity,
});

export const mergeCartSchema = z.object({
  items: z.array(addItemSchema).max(100),
});

export type AddItemInput = z.infer<typeof addItemSchema>;
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;
export type MergeCartInput = z.infer<typeof mergeCartSchema>;