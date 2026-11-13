import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/requireAdmin';
import {
  createBookAdmin,
  deleteBookAdmin,
  listBooksAdmin,
  updateBookAdmin,
} from './admin.controller';

export const adminRouter = Router();

// Todas las rutas de admin exigen sesión y rol ADMIN
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/books', listBooksAdmin);
adminRouter.post('/books', createBookAdmin);
adminRouter.patch('/books/:id', updateBookAdmin);
adminRouter.delete('/books/:id', deleteBookAdmin);