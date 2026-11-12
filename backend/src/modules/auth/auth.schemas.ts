import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  // bcrypt solo usa los primeros 72 bytes, por eso el límite superior
  password: z.string().min(8).max(72),
  name: z.string().trim().min(2).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;