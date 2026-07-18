import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

export const requireRole = (allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Acceso denegado: Permisos insuficientes', 403);
    }

    const userRole = req.user.rol;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Acceso denegado: Permisos insuficientes', 403);
    }

    next();
  };
