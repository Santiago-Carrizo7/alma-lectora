import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

/**
 * Higher-order function that returns a validation middleware bound to the provided Zod schema.
 *
 * Validates the specified part of the Express `Request` object (`body`, `params`, or `query`)
 * and replaces it with the sanitized, type-coerced output produced by `safeParse`.
 *
 * The `target` parameter makes the validation target **explicit at the call site**, avoiding
 * the fragile heuristic of inspecting schema key names — which can produce false positives
 * if a body schema happens to contain a field named `body`, `params`, or `query`.
 *
 * @param schema - Zod schema to validate the selected request property against.
 * @param target - Request property to validate. Defaults to `'body'`.
 * @returns Express middleware that validates and sanitizes the request data.
 * @throws {AppError} `400` if the request data does not conform to the provided schema.
 */
export const validateSchema = (schema: z.ZodType, target: 'body' | 'params' | 'query' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      throw new AppError('Validation error', 400);
    }

    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };
