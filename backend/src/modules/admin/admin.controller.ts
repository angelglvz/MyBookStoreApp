import type { Request, Response } from 'express';
import {
  adminListQuerySchema,
  createBookSchema,
  updateBookSchema,
} from './admin.schemas';
import { createBook, deleteBook, listBooks, updateBook } from './admin.service';

export async function listBooksAdmin(req: Request, res: Response) {
  const query = adminListQuerySchema.parse(req.query);
  res.json(await listBooks(query));
}

export async function createBookAdmin(req: Request, res: Response) {
  const input = createBookSchema.parse(req.body);
  const book = await createBook(input);
  res.status(201).json({ book });
}

export async function updateBookAdmin(req: Request, res: Response) {
  const input = updateBookSchema.parse(req.body);
  const book = await updateBook(req.params.id as string, input);
  res.json({ book });
}

export async function deleteBookAdmin(req: Request, res: Response) {
  res.json(await deleteBook(req.params.id as string));
}