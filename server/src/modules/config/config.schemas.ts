import { z } from 'zod';

export const updateConfigSchema = z.object({
  whatsappPhone: z.string().min(1, 'El teléfono es obligatorio').max(50).optional(),
  instagramUrl: z.string().url('URL inválida').max(255).optional(),
  shippingCost: z.coerce.number().nonnegative('El costo de envío debe ser no negativo').optional(),
  freeShippingMin: z.coerce.number().nonnegative('El mínimo de envío gratis debe ser no negativo').optional(),
  bannerMessage: z.string().nullable().optional(),
  isStoreOpen: z.boolean().optional(),
});

export type UpdateConfigPayload = z.infer<typeof updateConfigSchema>;
