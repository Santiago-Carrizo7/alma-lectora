import bcrypt from 'bcrypt';
import { prisma } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { generateAccessToken } from '../../utils/jwt.utils.js';
import type { LoginPayload } from './auth.schemas.js';
import { Role } from '@prisma/client';

const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGiydYPEfMOBsXoFk4wqynGjb2';

export type LoginResult = {
  accessToken: string;
};

export type ProfileResult = {
  id: string;
  email: string;
  rol: Role;
};

export class AuthService {
  static async login(payload: LoginPayload): Promise<LoginResult> {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        rol: true,
        passwordHash: true,
        activo: true,
      },
    });

    const isValidPassword = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.activo || !isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
    });

    return { accessToken };
  }

  static async getProfile(userId: string): Promise<ProfileResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    if (!user || !user.activo) {
      throw new AppError('Usuario no encontrado', 404);
    }

    return {
      id: user.id,
      email: user.email,
      rol: user.rol,
    };
  }
}
