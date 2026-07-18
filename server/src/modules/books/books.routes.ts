import { Router } from 'express';
import { BooksController } from './books.controller.js';
import { getBooksQuerySchema, lookupBookSchema, createBookSchema, bookIdParamSchema, updateBookSchema, updateBookStockSchema } from './books.schemas.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const booksRouter: Router = Router();

// Public route for catalog
booksRouter.get(
  '/',
  validateSchema(getBooksQuerySchema, 'query'),
  BooksController.getBooks
);

booksRouter.get(
  '/:id',
  validateSchema(bookIdParamSchema, 'params'),
  BooksController.getBook
);

// Admin protected route for ISBN lookup
booksRouter.get(
  '/lookup/:isbn',
  requireAuth,
  validateSchema(lookupBookSchema, 'params'),
  BooksController.lookupBook
);

// Admin protected route for creating a book
booksRouter.post(
  '/',
  requireAuth,
  validateSchema(createBookSchema, 'body'),
  BooksController.createBook
);

// Admin protected route for updating a book
booksRouter.patch(
  '/:id',
  requireAuth,
  validateSchema(bookIdParamSchema, 'params'),
  validateSchema(updateBookSchema, 'body'),
  BooksController.updateBook
);

// Admin protected route for quick stock update
booksRouter.patch(
  '/:id/stock',
  requireAuth,
  validateSchema(bookIdParamSchema, 'params'),
  validateSchema(updateBookStockSchema, 'body'),
  BooksController.updateBookStock
);

// Admin protected route for deleting a book (logical delete)
booksRouter.delete(
  '/:id',
  requireAuth,
  validateSchema(bookIdParamSchema, 'params'),
  BooksController.deleteBook
);
