import { Router } from 'express';
import multer from 'multer';
import { AccessoriesController } from './accessories.controller.js';
import { getAccessoriesQuerySchema, createAccessorySchema, updateAccessorySchema, accessoryIdParamSchema } from './accessories.schemas.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { AdminService } from '../admin/admin.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

async function injectCoverUrl(req: any, res: any, next: any) {
  if (req.file?.buffer) {
    req.body.coverUrl = await AdminService.uploadImage(req.file.buffer);
  }
  next();
}

export const accessoriesRouter: Router = Router();

// Rutas Públicas
accessoriesRouter.get(
  '/',
  validateSchema(getAccessoriesQuerySchema, 'query'),
  AccessoriesController.getAccessories
);

accessoriesRouter.get(
  '/:id',
  validateSchema(accessoryIdParamSchema, 'params'),
  AccessoriesController.getAccessory
);

// Rutas Administrativas Protegidas
accessoriesRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  injectCoverUrl,
  validateSchema(createAccessorySchema, 'body'),
  AccessoriesController.createAccessory
);

accessoriesRouter.patch(
  '/:id',
  requireAuth,
  validateSchema(accessoryIdParamSchema, 'params'),
  upload.single('file'),
  injectCoverUrl,
  validateSchema(updateAccessorySchema, 'body'),
  AccessoriesController.updateAccessory
);

accessoriesRouter.delete(
  '/:id',
  requireAuth,
  validateSchema(accessoryIdParamSchema, 'params'),
  AccessoriesController.deleteAccessory
);
