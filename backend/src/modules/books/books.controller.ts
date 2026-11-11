import type { Request, Response } from 'express';
import { listBooksQuerySchema } from './books.schemas';
import * as booksService from './books.service';

export async function listBooks(req: Request, res: Response) {
  const query = listBooksQuerySchema.parse(req.query);
  const result = await booksService.listBooks(query);
  res.json(result);
}

export async function getBook(req: Request, res: Response) {
  const slug = String(req.params.slug);
  const book = await booksService.getBookBySlug(slug);
  res.json(book);
}