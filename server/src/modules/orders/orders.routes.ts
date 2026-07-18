import { Router } from 'express';
import { OrdersController } from './orders.controller.js';
import { OrdersAdminController } from './orders.admin.controller.js';
import {
  createOrderLeadSchema,
  getOrdersQuerySchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
} from './orders.schemas.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const ordersRouter: Router = Router();

// Public routes
ordersRouter.post(
  '/lead',
  validateSchema(createOrderLeadSchema, 'body'),
  OrdersController.createOrderLead
);

// Protected admin routes
ordersRouter.get(
  '/admin',
  requireAuth,
  validateSchema(getOrdersQuerySchema, 'query'),
  OrdersAdminController.listOrders
);

ordersRouter.patch(
  '/admin/:id/status',
  requireAuth,
  validateSchema(orderIdParamSchema, 'params'),
  validateSchema(updateOrderStatusSchema, 'body'),
  OrdersAdminController.updateOrderStatus
);
