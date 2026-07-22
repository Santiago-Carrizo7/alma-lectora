import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AppError } from './AppError.js';

export type JwtPayload = {
  id: string;
  email: string;
  rol: Role;
};

const getEnv = (key: string, fallback?: string): string => {
  const val = process.env[key];
  if (val) return val;
  if (fallback) return fallback;
  throw new AppError(`${key} not configured`, 500);
};

export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = getEnv('JWT_SECRET');
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = getEnv('JWT_SECRET');
  return jwt.verify(token, secret) as JwtPayload;
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET || getEnv('JWT_SECRET');
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.REFRESH_TOKEN_SECRET || getEnv('JWT_SECRET');
  return jwt.verify(token, secret) as JwtPayload;
};
