import type { Request, Response } from 'express';
import { OrdersService } from './orders.service.js';
import type { CreateOrderLeadInput } from './orders.schemas.js';

export class OrdersController {
  static async createOrderLead(req: Request, res: Response): Promise<void> {
    const input = req.body as CreateOrderLeadInput;
    const result = await OrdersService.createOrderLead(input);
    res.status(201).json(result);
  }
}
