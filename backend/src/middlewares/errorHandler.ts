import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.statusCode,
      error: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 400,
      error: 'Datos no válidos',
      details: err.flatten().fieldErrors,
    });
  }

  console.error(err);
  return res.status(500).json({
    status: 500,
    error: 'Error interno del servidor',
  });
}