import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { booksRouter } from './modules/books/books.routes';
import { AppError } from './utils/AppError';

export const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', database: 'connected' });
});

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);

app.use((req, _res, next) => {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);