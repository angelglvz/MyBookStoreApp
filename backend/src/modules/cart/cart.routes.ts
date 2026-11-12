import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import {
  addCartItem,
  clearCartUser,
  getCartUser,
  mergeCartUser,
  removeCartItem,
  updateCartItem,
} from './cart.controller';

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get('/', getCartUser);
cartRouter.delete('/', clearCartUser);
cartRouter.post('/items', addCartItem);
cartRouter.patch('/items/:bookId', updateCartItem);
cartRouter.delete('/items/:bookId', removeCartItem);
cartRouter.post('/merge', mergeCartUser);