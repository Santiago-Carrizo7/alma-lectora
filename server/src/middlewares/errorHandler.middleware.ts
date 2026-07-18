import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

/**
 * Global Express error-handling middleware (4-parameter signature required by Express).
 *
 * Discriminates between operational `AppError` instances and unexpected system errors:
 * - `AppError` → responds with `err.statusCode` and `err.message` (safe to expose to clients).
 * - Unknown errors → logs to `console.error` and responds with a generic `500` message
 *   to prevent leaking internal implementation details.
 *
 * Must be registered **after** all routes and other middlewares in the Express application.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('[GlobalErrorHandler]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
};
