import { Role } from '@prisma/client';
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rol: z.nativeEnum(Role).default(Role.ADMIN),
});

export const updateUserSchema = z.object({
  rol: z.nativeEnum(Role).optional(),
  activo: z.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  rol: z.nativeEnum(Role).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('El ID del usuario debe ser un UUID valido'),
});

export const deleteUserQuerySchema = z.object({
  permanent: z.preprocess((val) => val === 'true', z.boolean().optional()),
});

export type CreateUserPayload = z.infer<typeof createUserSchema>;
export type UpdateUserPayload = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamSchema>;
