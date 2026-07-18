import { Router } from 'express';
import { CombosController } from './combos.controller.js';
import { getCombosQuerySchema, createComboSchema, updateComboSchema, comboIdParamSchema } from './combos.schemas.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const combosRouter: Router = Router();

// Rutas Públicas
combosRouter.get(
  '/',
  validateSchema(getCombosQuerySchema, 'query'),
  CombosController.getCombos
);

combosRouter.get(
  '/:id',
  validateSchema(comboIdParamSchema, 'params'),
  CombosController.getCombo
);

// Rutas Administrativas Protegidas
combosRouter.post(
  '/',
  requireAuth,
  validateSchema(createComboSchema, 'body'),
  CombosController.createCombo
);

combosRouter.patch(
  '/:id',
  requireAuth,
  validateSchema(comboIdParamSchema, 'params'),
  validateSchema(updateComboSchema, 'body'),
  CombosController.updateCombo
);

combosRouter.delete(
  '/:id',
  requireAuth,
  validateSchema(comboIdParamSchema, 'params'),
  CombosController.deleteCombo
);
