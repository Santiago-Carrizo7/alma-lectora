import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import type { CreateUserPayload, ListUsersQuery, UpdateUserPayload } from './users.schemas.js';

export class UsersService {
  static async createUser(payload: CreateUserPayload) {
    const passwordHash = await bcrypt.hash(payload.password, 10);
    const existing = await prisma.user.findUnique({
      where: { email: payload.email },
    });
    if (existing) {
      throw new AppError('El email ya se encuentra registrado', 400);
    }
    return prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        rol: payload.rol,
      },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async listUsers(query: ListUsersQuery) {
    const { page, limit, rol } = query;
    const skip = (page - 1) * limit;
    const where = rol ? { rol } : {};
    
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          rol: true,
          activo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return user;
  }

  static async updateUser(id: string, payload: UpdateUserPayload) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    await prisma.user.delete({ where: { id } });
  }
}
