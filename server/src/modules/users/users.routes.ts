import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateSchema } from '../../middlewares/validateSchema.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { UsersController } from './users.controller.js';
import {
  createUserSchema,
  deleteUserQuerySchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from './users.schemas.js';

/**
 * Express router for the Users module (`/api/v1/users`).
 * All routes require `ADMIN` role. `requireAuth` + `requireRole(['ADMIN'])` applied globally.
 *
 * | Method | Path   | Input validation                                    | Handler                       |
 * |--------|--------|-----------------------------------------------------|-------------------------------|
 * | POST   | `/`    | `validateSchema(createUserSchema)`                  | `UsersController.createUser`  |
 * | GET    | `/`    | `validateSchema(listUsersQuerySchema, 'query')`     | `UsersController.listUsers`   |
 * | GET    | `/:id` | `validateSchema(userIdParamSchema, 'params')`       | `UsersController.getUserById` |
 * | PATCH  | `/:id` | `userIdParamSchema` + `updateUserSchema`            | `UsersController.updateUser`  |
 * | DELETE | `/:id` | `validateSchema(userIdParamSchema, 'params')`       | `UsersController.deleteUser`  |
 */
export const usersRouter: Router = Router();

usersRouter.use(requireAuth);
usersRouter.use(requireRole(['ADMIN']));

usersRouter.post('/', validateSchema(createUserSchema), UsersController.createUser);
usersRouter.get(
  '/',
  validateSchema(listUsersQuerySchema, 'query'),
  UsersController.listUsers,
);
usersRouter.get(
  '/:id',
  validateSchema(userIdParamSchema, 'params'),
  UsersController.getUserById,
);
usersRouter.patch(
  '/:id',
  validateSchema(userIdParamSchema, 'params'),
  validateSchema(updateUserSchema),
  UsersController.updateUser,
);
usersRouter.delete(
  '/:id',
  validateSchema(userIdParamSchema, 'params'),
  validateSchema(deleteUserQuerySchema, 'query'),
  UsersController.deleteUser,
);
