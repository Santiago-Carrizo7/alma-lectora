import { z } from 'zod';

export const getAccessoriesQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(['VELAS', 'SEPARADORES', 'TRES_D']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  isActive: z.string().optional(),
});

export const createAccessorySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  category: z.enum(['VELAS', 'SEPARADORES', 'TRES_D']),
  coverUrl: z.string().url().nullable().optional(),
  isActive: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
});

export const updateAccessorySchema = createAccessorySchema.partial();

export const accessoryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type GetAccessoriesQuery = z.infer<typeof getAccessoriesQuerySchema>;
export type CreateAccessoryInput = z.infer<typeof createAccessorySchema>;
export type UpdateAccessoryInput = z.infer<typeof updateAccessorySchema>;
export type AccessoryIdParam = z.infer<typeof accessoryIdParamSchema>;

export const updateAccessoryStockSchema = z.object({
  stock: z.coerce.number().int().nonnegative(),
});
export type UpdateAccessoryStockInput = z.infer<typeof updateAccessoryStockSchema>;
