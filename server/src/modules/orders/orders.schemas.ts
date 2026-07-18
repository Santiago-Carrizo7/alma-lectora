import { z } from 'zod';

export const createOrderLeadSchema = z.object({
  customerName: z.string().min(2).max(150),
  customerPhone: z.string().min(5).max(50),
  customerEmail: z.string().email().max(255),
  customerDni: z.string().min(5).max(20),
  postalCode: z.string().min(1).max(20).optional(),
  address: z.string().min(2).optional(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(['BOOK', 'ACCESSORY', 'COMBO']),
      title: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
    })
  ).min(1),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export type CreateOrderLeadInput = z.infer<typeof createOrderLeadSchema>;

export const getOrdersQuerySchema = z.object({
  status: z.enum(['PENDING_WHATSAPP', 'CONFIRMED', 'CANCELLED']).optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().positive().default(1)),
  limit: z.preprocess((val) => (val ? Number(val) : 24), z.number().int().positive().default(24)),
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid('ID de orden inválido'),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;

