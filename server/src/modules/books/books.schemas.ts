import { z } from 'zod';

export const lookupBookSchema = z.object({
  isbn: z.string()
    .transform((val) => val.replace(/[- ]/g, ''))
    .refine((val) => {
      const isIsbn10 = /^\d{9}[\dX]$/i.test(val);
      const isIsbn13 = /^\d{13}$/.test(val);
      return isIsbn10 || isIsbn13;
    }, {
      message: 'Formato de ISBN inválido. Debe ser ISBN-10 o ISBN-13.',
    }),
});

export type LookupBookParams = z.infer<typeof lookupBookSchema>;

export interface ISBNLookupResult {
  title: string | null;
  originalTitle: string | null;
  googleBooksId: string | null;
  authors: string[];
  synopsis: string | null;
  coverUrl: string | null;
  publishedDate: string | null;
  language: string | null;
}

export const getBooksQuerySchema = z.object({
  search: z.string().optional(),
  badge: z.string().optional(),
  genre: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 24), z.number().int().positive().default(24)),
});

export type GetBooksQuery = z.infer<typeof getBooksQuerySchema>;

export const createBookSchema = z.object({
  isbn: z.string()
    .transform((val) => val.replace(/[- ]/g, ''))
    .refine((val) => {
      const isIsbn10 = /^\d{9}[\dX]$/i.test(val);
      const isIsbn13 = /^\d{13}$/.test(val);
      return isIsbn10 || isIsbn13;
    }, {
      message: 'Formato de ISBN inválido. Debe ser ISBN-10 o ISBN-13.',
    }),
  title: z.string().min(1, 'El título es obligatorio').max(255),
  originalTitle: z.string().optional().nullable(),
  googleBooksId: z.string().optional().nullable(),
  authors: z.array(z.string()).default([]),
  synopsis: z.string().optional().nullable(),
  coverUrl: z.string().url('Debe ser una URL válida').optional().nullable().or(z.literal('')),
  price: z.preprocess((val) => Number(val), z.number().positive('El precio debe ser un número positivo')),
  stock: z.preprocess((val) => Number(val), z.number().int().nonnegative('El stock debe ser un número no negativo')),
  badge: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  publishedDate: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
});

export type CreateBookPayload = z.infer<typeof createBookSchema>;

export const bookIdParamSchema = z.object({
  id: z.string().uuid('ID de libro inválido'),
});

export type BookIdParam = z.infer<typeof bookIdParamSchema>;

export const updateBookSchema = createBookSchema.partial().omit({ isbn: true }).extend({
  isActive: z.boolean().optional(),
});

export type UpdateBookPayload = z.infer<typeof updateBookSchema>;

export const updateBookStockSchema = z.object({
  stock: z.preprocess((val) => Number(val), z.number().int().nonnegative('El stock debe ser un número entero no negativo')),
});

export type UpdateBookStockPayload = z.infer<typeof updateBookStockSchema>;

