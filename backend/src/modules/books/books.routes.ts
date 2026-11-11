import { Router } from 'express';
import * as booksController from './books.controller';

export const booksRouter = Router();

booksRouter.get('/', booksController.listBooks);
booksRouter.get('/:slug', booksController.getBook);