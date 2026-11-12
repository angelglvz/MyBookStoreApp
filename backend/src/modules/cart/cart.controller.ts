import type { Request, Response } from 'express';
import {
  addItemSchema,
  mergeCartSchema,
  updateQuantitySchema,
} from './cart.schemas';
import {
  addItem,
  clearCart,
  getCart,
  mergeGuestCart,
  removeItem,
  updateQuantity,
} from './cart.service';

export async function getCartUser(req: Request, res: Response) {
  res.json(await getCart(req.user!.id));
}

export async function addCartItem(req: Request, res: Response) {
  const input = addItemSchema.parse(req.body);
  res.status(201).json(await addItem(req.user!.id, input));
}

export async function updateCartItem(req: Request, res: Response) {
  const { quantity } = updateQuantitySchema.parse(req.body);
  res.json(await updateQuantity(req.user!.id, req.params.bookId as string, quantity));
}

export async function removeCartItem(req: Request, res: Response) {
  res.json(await removeItem(req.user!.id, req.params.bookId as string));
}

export async function clearCartUser(req: Request, res: Response) {
  res.json(await clearCart(req.user!.id));
}

export async function mergeCartUser(req: Request, res: Response) {
  const input = mergeCartSchema.parse(req.body);
  res.json(await mergeGuestCart(req.user!.id, input));
}