import { z } from 'zod';

export const getCombosQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  isActive: z.preprocess(
    (val) => (val === 'true' ? true : val === 'false' ? false : val),
    z.boolean().optional()
  ),
});

export const createComboSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.number().positive(),
  coverUrl: z.string().url().nullable().optional(),
  stock: z.coerce.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional(),
  books: z.array(
    z.object({
      bookId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
    })
  ).default([]),
  accessories: z.array(
    z.object({
      accessoryId: z.string().uuid(),
      quantity: z.number().int().positive().default(1),
    })
  ).default([]),
});

export const updateComboSchema = createComboSchema.partial();

export const comboIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type GetCombosQuery = z.infer<typeof getCombosQuerySchema>;
export type CreateComboInput = z.infer<typeof createComboSchema>;
export type UpdateComboInput = z.infer<typeof updateComboSchema>;
export type ComboIdParam = z.infer<typeof comboIdParamSchema>;

export const updateComboStockSchema = z.object({
  stock: z.coerce.number().int().nonnegative(),
});
export type UpdateComboStockInput = z.infer<typeof updateComboStockSchema>;
