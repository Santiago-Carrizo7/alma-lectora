import 'express';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      rol: Role;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
