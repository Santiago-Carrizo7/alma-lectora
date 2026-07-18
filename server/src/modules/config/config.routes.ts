import { Router } from 'express';
import { ConfigController } from './config.controller.js';
import { updateConfigSchema } from './config.schemas.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const configRouter: Router = Router();

configRouter.get(
  '/',
  ConfigController.getConfig
);

configRouter.patch(
  '/',
  requireAuth,
  validateSchema(updateConfigSchema, 'body'),
  ConfigController.updateConfig
);
