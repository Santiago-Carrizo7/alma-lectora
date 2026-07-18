import type { Request, Response } from 'express';
import { AccessoriesService } from './accessories.service.js';
import type { GetAccessoriesQuery, CreateAccessoryInput, UpdateAccessoryInput, AccessoryIdParam } from './accessories.schemas.js';

export class AccessoriesController {
  static async getAccessories(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetAccessoriesQuery;
    const result = await AccessoriesService.getAccessories(query);
    res.status(200).json(result);
  }

  static async getAccessory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as AccessoryIdParam;
    const result = await AccessoriesService.getAccessoryById(id);
    res.status(200).json(result);
  }

  static async createAccessory(req: Request, res: Response): Promise<void> {
    const data = req.body as CreateAccessoryInput;
    const result = await AccessoriesService.createAccessory(data);
    res.status(201).json(result);
  }

  static async updateAccessory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as AccessoryIdParam;
    const data = req.body as UpdateAccessoryInput;
    const result = await AccessoriesService.updateAccessory(id, data);
    res.status(200).json(result);
  }

  static async deleteAccessory(req: Request, res: Response): Promise<void> {
    const { id } = req.params as AccessoryIdParam;
    await AccessoriesService.deleteAccessory(id);
    res.status(204).send();
  }
}
