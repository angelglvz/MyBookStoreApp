import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError(403, 'Acceso restringido'));
  }
  next();
}