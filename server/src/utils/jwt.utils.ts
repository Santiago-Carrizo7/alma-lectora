import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './AppError.js';

export type JwtPayload = {
  id: string;
  email: string;
  rol: Role;
};

const getEnvOrThrow = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new AppError(`${key} not configured`, 500);
  return val;
};

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getEnvOrThrow('JWT_SECRET'), {
    expiresIn: getEnvOrThrow('JWT_EXPIRES_IN') as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, getEnvOrThrow('JWT_SECRET')) as JwtPayload;
};
