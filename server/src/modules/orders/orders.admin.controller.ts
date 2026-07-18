import type { Request, Response } from 'express';
import { OrdersAdminService } from './orders.admin.service.js';
import type { GetOrdersQuery, OrderIdParam, UpdateOrderStatusInput } from './orders.schemas.js';

export class OrdersAdminController {
  static async listOrders(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetOrdersQuery;
    const result = await OrdersAdminService.listOrders(query);
    res.json(result);
  }

  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as OrderIdParam;
    const { status } = req.body as UpdateOrderStatusInput;

    const result = await OrdersAdminService.updateOrderStatus(id, status);
    res.json({
      id: result.id,
      status: result.status,
    });
  }
}
