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

    // Sliding Session: si expira en menos de 5 minutos, renovar silenciosamente
    if (payload.exp) {
      const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000);
      if (remainingSeconds < 300) {
        console.log(`[Sliding Session] Renovación silenciosa de token para el usuario: ${payload.email}`);
        const newToken = generateAccessToken({
          id: payload.id,
          email: payload.email,
          rol: payload.rol,
        });

        res.cookie('access_token', newToken, {
          httpOnly: true,
          path: '/',
          maxAge: 15 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
      }
    }

    next();
  } catch (error) {
    throw new AppError('No token provided / Invalid token', 401);
  }
};
