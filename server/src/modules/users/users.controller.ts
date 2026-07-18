import type { Request, Response } from 'express';
import { UsersService } from './users.service.js';
import type { CreateUserPayload, ListUsersQuery, UpdateUserPayload } from './users.schemas.js';

export class UsersController {
  static async createUser(req: Request, res: Response): Promise<void> {
    const payload = req.body as CreateUserPayload;
    const user = await UsersService.createUser(payload);
    res.status(201).json(user);
  }

  static async listUsers(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListUsersQuery;
    const result = await UsersService.listUsers(query);
    res.status(200).json(result);
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const user = await UsersService.getUserById(id);
    res.status(200).json(user);
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    const payload = req.body as UpdateUserPayload;
    const user = await UsersService.updateUser(id, payload);
    res.status(200).json(user);
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    await UsersService.deleteUser(id);
    res.status(204).send();
  }
}
