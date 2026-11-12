import type { Request, Response } from 'express';
import { env } from '../../config/env';
import { AUTH_COOKIE, SEVEN_DAYS_MS } from './auth.constants';
import { loginSchema, registerSchema } from './auth.schemas';
import { getMe, login, register } from './auth.service';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    path: '/',
  };
}

export async function registerUser(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const user = await register(input);
  res.status(201).json({ user });
}

export async function loginUser(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { token, user } = await login(input);

  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
  res.json({ user });
}

export function logoutUser(_req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
  res.json({ ok: true });
}

export async function meUser(req: Request, res: Response) {
  const user = await getMe(req.user!.id);
  res.json({ user });
}