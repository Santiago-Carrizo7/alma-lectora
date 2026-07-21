import type { Request, Response } from 'express';
import { BooksService } from './books.service.js';
import type { LookupBookParams, GetBooksQuery, BookIdParam, UpdateBookPayload, UpdateBookStockPayload } from './books.schemas.js';
import { verifyAccessToken } from '../../utils/jwt.utils.js';

export class BooksController {
  /**
   * Controller method for retrieving the books list.
   * Assumes query params are pre-validated by Zod middleware.
   * Restricts isActive parameter to authenticated admins.
   */
  static async getBooks(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetBooksQuery;
    
    // Safety check: force isActive = true for non-authenticated or non-admin requests
    let isAdmin = false;
    const token = req.cookies?.access_token;
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        if (payload) {
          isAdmin = true;
        }
      } catch (error) {
        // Not authenticated
      }
    }

    if (!isAdmin) {
      query.isActive = true;
    }

    const result = await BooksService.getBooks(query);
    res.status(200).json(result);
  }

  /**
   * Controller method for looking up a book by its ISBN.
   * Assumes that the req.params schema has already been validated by Zod middleware.
   * Does NOT contain try/catch blocks; delegates errors to global handler.
   */
  static async lookupBook(req: Request, res: Response): Promise<void> {
    const { isbn } = req.params as LookupBookParams;
    const result = await BooksService.lookupBook(isbn);
    res.status(200).json(result);
  }

  /**
   * Controller method for creating a book.
   * Assumes that the req.body has already been validated by Zod middleware.
   * Does NOT contain try/catch blocks; delegates errors to global handler.
   */
  static async createBook(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const result = await BooksService.createBook(data);
    res.status(201).json(result);
  }

  /**
   * Controller method for updating a book.
   * Assumes req.params and req.body are pre-validated by Zod middleware.
   */
  static async updateBook(req: Request, res: Response): Promise<void> {
    const { id } = req.params as BookIdParam;
    const data = req.body as UpdateBookPayload;
    const result = await BooksService.updateBook(id, data);
    res.status(200).json(result);
  }

  /**
   * Controller method for updating quick stock of a book.
   * Assumes req.params and req.body are pre-validated by Zod middleware.
   */
  static async updateBookStock(req: Request, res: Response): Promise<void> {
    const { id } = req.params as BookIdParam;
    const { stock } = req.body as UpdateBookStockPayload;
    const result = await BooksService.updateBookStock(id, stock);
    res.status(200).json(result);
  }

  /**
   * Controller method for deleting a book.
   * Assumes req.params is pre-validated by Zod middleware.
   */
  static async deleteBook(req: Request, res: Response): Promise<void> {
    const { id } = req.params as BookIdParam;
    const permanent = req.query.permanent === 'true';
    await BooksService.deleteBook(id, permanent);
    res.status(204).send();
  }

  /**
   * Controller method for retrieving a single book by ID.
   * Assumes req.params is pre-validated by Zod middleware.
   */
  static async getBook(req: Request, res: Response): Promise<void> {
    const { id } = req.params as BookIdParam;
    const result = await BooksService.getBookById(id);
    res.status(200).json(result);
  }
}
