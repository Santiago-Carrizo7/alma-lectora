import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { loginSchema } from './auth.schemas.js';

export const authRouter: Router = Router();

authRouter.post('/login', authRateLimiter, validateSchema(loginSchema), AuthController.login);
authRouter.post('/logout', AuthController.logout);
authRouter.get('/me', requireAuth, AuthController.me);
