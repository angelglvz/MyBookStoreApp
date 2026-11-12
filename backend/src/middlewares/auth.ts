import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AUTH_COOKIE } from '../modules/auth/auth.constants';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  sub: string;
  role: string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    return next(new AppError(401, 'No autenticado'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Sesión no válida o caducada'));
  }
}