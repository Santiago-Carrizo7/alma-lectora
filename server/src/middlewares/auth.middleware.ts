import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken, generateAccessToken } from '../utils/jwt.utils.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.access_token;
  if (!token) {
    throw new AppError('No token provided / Invalid token', 401);
  }

  try {
    const payload = verifyAccessToken(token) as any;
    req.user = {
      id: payload.id,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch (error) {
    throw new AppError('No token provided / Invalid token', 401);
  }
};
